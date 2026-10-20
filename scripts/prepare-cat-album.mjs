import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('请提供原始猫咪照片目录。');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/images/cats');
const photos = [
  ['01', '椅子上的长毛', 'east'],
  ['02', '书架旁的长毛', 'centre'],
  ['03', '吃饭的长毛', 'east'],
  ['04', '被抱着摸摸的长毛', 'centre'],
  ['05', '躺地撒娇的长毛', 'centre'],
  ['06', '吃完饭舔嘴的长毛', 'centre'],
  ['07', '要猫条的小黄长毛', 'centre'],
  ['08', '抬头看镜头的小黄长毛', 'centre'],
];
await mkdir(output, { recursive: true });
const manifest = [];
let bytes = 0;
for (const [id, alt, position] of photos) {
  const input = resolve(source, `${id}.jpg`);
  const thumb = await sharp(input).rotate()
    .resize(560, 560, { fit: 'cover', position })
    .webp({ quality: 78 }).toFile(join(output, `${id}-thumb.webp`));
  const full = await sharp(input).rotate()
    .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 }).toFile(join(output, `${id}.webp`));
  bytes += thumb.size + full.size;
  manifest.push({
    alt, thumbnail: `/images/cats/${id}-thumb.webp`,
    src: `/images/cats/${id}.webp`, width: full.width, height: full.height,
  });
}
await writeFile(join(root, 'src/data/cat-album.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${photos.length} 张照片已生成，缩略图和大图合计 ${(bytes / 1024).toFixed(0)} KiB。`);
