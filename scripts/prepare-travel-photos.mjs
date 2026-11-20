import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const convert = promisify(execFile);
const [source, mode, ...extra] = process.argv.slice(2);
if (!source || (mode !== undefined && mode !== '--numbered') || extra.length) {
  throw new Error('用法：npm run prepare:travel-photos -- "照片文件夹路径" [--numbered]');
}

const sourceDir = resolve(source);
const formats = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const photos = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && formats.has(extname(entry.name).toLowerCase()))
  .map(({ name }) => ({ name, output: `${basename(name, extname(name))}.webp` }));

if (photos.length === 0) throw new Error('文件夹里没有找到支持的照片。');
if (new Set(photos.map(({ output }) => output.toLowerCase().normalize('NFC'))).size !== photos.length) {
  throw new Error('有不同照片会导出成同一个文件名，请先给它们改名。');
}

async function publishNumberedBatch(tempDir) {
  let highest = 0n;
  for (const name of await readdir(sourceDir)) {
    const match = /^travel-web-(\d+)$/i.exec(name);
    if (match && BigInt(match[1]) > highest) highest = BigInt(match[1]);
  }
  for (let number = highest + 1n; ; number++) {
    const target = join(sourceDir, `travel-web-${String(number).padStart(3, '0')}`);
    try {
      await rename(tempDir, target);
      return target;
    } catch (error) {
      // Another export may have published this number while we were converting.
      if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error;
    }
  }
}

const numbered = mode === '--numbered';
let exportDir = join(sourceDir, 'travel-web');
if (!numbered) await mkdir(exportDir, { recursive: true });
const tempDir = await mkdtemp(join(numbered ? sourceDir : exportDir, '.export-'));
try {
  for (const [index, { name, output }] of photos.entries()) {
    const original = join(sourceDir, name);
    let input = original;
    if (/\.hei[cf]$/i.test(name)) {
      if (process.platform !== 'darwin') throw new Error('HEIC/HEIF 转换需要 macOS，请先导出为 JPEG 或 PNG。');
      const converted = join(tempDir, `heic-${index}.png`);
      await convert('/usr/bin/sips', ['-s', 'format', 'png', input, '--out', converted]);
      input = converted;
    }

    const outputPath = join(tempDir, output);
    const { width, height, size } = await sharp(input)
      .autoOrient()
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(outputPath);
    if (input !== original) await rm(input);
    console.log(`${output}  ${width}×${height}  ${Math.round(size / 1024)} KiB`);
  }
  if (numbered) {
    exportDir = await publishNumberedBatch(tempDir);
  } else {
    for (const { output } of photos) {
      await rename(join(tempDir, output), join(exportDir, output));
    }
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
console.log(`上传这个目录中的 WebP：${exportDir}`);
