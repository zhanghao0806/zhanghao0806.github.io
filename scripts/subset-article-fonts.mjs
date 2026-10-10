import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'public/fonts');
const manifestPath = join(root, 'src/generated/article-fonts.json');
const helper = join(root, 'scripts/subset-songti.py');
const sources = Object.fromEntries(['Regular', 'Bold'].map(style => [
  style, join(root, `assets/fonts/songti/NotoSerifSC-${style}.otf`),
]));
const sharedFiles = ['src/pages/blog/[slug].astro', 'src/components/ArticleToc.astro',
  'src/lib/writing.js', 'src/styles/article-sakura.css'];
const shared = sharedFiles.map(path => readFileSync(join(root, path), 'utf8')).join('\n')
  + '\n…‘’“”–—\u00A0' + Array.from({length: 95}, (_, i) => String.fromCharCode(32 + i)).join('');
const hash = value => createHash('sha256').update(value).digest('hex');
const sourceHash = hash(Buffer.concat([
  ...Object.values(sources).map(path => readFileSync(path)), readFileSync(helper),
]));
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const manifest = {};
const jobs = [];
const blogDirectory = join(root, 'src/content/blog');

mkdirSync(output, { recursive: true });
mkdirSync(join(root, 'src/generated'), { recursive: true });
for (const article of readdirSync(blogDirectory).filter(name => name.endsWith('.md')).sort()) {
  const text = [...new Set(readFileSync(join(blogDirectory, article), 'utf8') + shared)].sort().join('');
  const fingerprint = hash(sourceHash + text).slice(0, 20);
  const files = Object.fromEntries(['Regular', 'Bold'].map(style => [
    style, `songti-${fingerprint}-${style.toLowerCase()}.woff2`,
  ]));
  manifest[article] = { fingerprint, regular: `/fonts/${files.Regular}`, bold: `/fonts/${files.Bold}` };
  if (previous[article]?.fingerprint === fingerprint
    && Object.values(files).every(name => existsSync(join(output, name)))) continue;
  jobs.push({ article, text, fingerprint, sources,
    outputs: Object.fromEntries(Object.entries(files).map(([style, name]) => [style, join(output, name)])) });
}

// One shared regular font covers every cat line, independently of article text.
const dialogue = JSON.parse(readFileSync(join(root, 'src/data/pet-lines.zh-CN.json'), 'utf8'));
const catText = [...new Set(dialogue.map(line => line.text).join('\n')
  + '…‘’“”–—' + Array.from({length: 95}, (_, i) => String.fromCharCode(32 + i)).join(''))].sort().join('');
const catFingerprint = hash(sourceHash + catText).slice(0, 20);
const catFile = `songti-${catFingerprint}-regular.woff2`;
manifest.__catDialogue = { fingerprint: catFingerprint, regular: `/fonts/${catFile}` };
if (previous.__catDialogue?.fingerprint !== catFingerprint || !existsSync(join(output, catFile))) {
  jobs.push({ article: '猫咪台词', text: catText, fingerprint: catFingerprint, sources,
    outputs: { Regular: join(output, catFile) } });
}

if (jobs.length) {
  const temp = mkdtempSync(join(tmpdir(), 'article-songti-'));
  try {
    const jobsPath = join(temp, 'jobs.json');
    writeFileSync(jobsPath, JSON.stringify(jobs));
    const result = spawnSync(process.env.FONT_PYTHON || 'python', [helper, jobsPath], { stdio: 'inherit' });
    if (result.error || result.status !== 0) {
      throw new Error('宋体裁剪失败。请先运行 python -m pip install -r scripts/requirements-fonts.txt；可用 FONT_PYTHON 指定 Python 环境。', { cause: result.error });
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

writeFileSync(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
renameSync(`${manifestPath}.tmp`, manifestPath);
const used = new Set(Object.values(manifest).flatMap(font => [font.regular, font.bold].filter(Boolean)));
for (const name of readdirSync(output)) {
  if (/^songti-[a-f0-9]{20}-(regular|bold)\.woff2$/.test(name) && !used.has(`/fonts/${name}`)) {
    rmSync(join(output, name));
  }
}
const sizes = Object.entries(manifest).filter(([article]) => article !== '__catDialogue').map(([article, font]) => ({article,
  kib: Math.ceil((statSync(join(root, 'public', font.regular)).size
    + statSync(join(root, 'public', font.bold)).size) / 1024),
}));
console.log(`宋体准备完成：${sizes.length} 篇文章，每篇两种字重共 ${Math.min(...sizes.map(s => s.kib))}–${Math.max(...sizes.map(s => s.kib))} KiB；猫咪共用字体 ${Math.ceil(statSync(join(output, catFile)).size / 1024)} KiB；本次更新 ${jobs.length} 组。`);
