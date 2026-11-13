import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const convert = promisify(execFile);
const source = process.argv[2];
if (!source || process.argv.length !== 3) {
  throw new Error('用法：npm run prepare:travel-photos -- "照片文件夹路径"');
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

const exportDir = join(sourceDir, 'travel-web');
await mkdir(exportDir, { recursive: true });
const tempDir = await mkdtemp(join(exportDir, '.export-'));
try {
  for (const [index, { name, output }] of photos.entries()) {
    let input = join(sourceDir, name);
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
    console.log(`${output}  ${width}×${height}  ${Math.round(size / 1024)} KiB`);
  }
  for (const { output } of photos) {
    await rename(join(tempDir, output), join(exportDir, output));
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
console.log(`上传这个目录中的 WebP：${exportDir}`);
