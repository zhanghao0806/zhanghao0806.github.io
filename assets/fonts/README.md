# 文章字体构建素材

`LXGWWenKai-Regular-v1.521.ttf` 是霞鹜文楷 1.521 的完整源字体，与网站原有裁剪字体使用同一版本。

- 上游：https://github.com/lxgw/LxgwWenKai/releases/tag/v1.521
- 许可证：`OFL.txt`（SIL Open Font License 1.1）。
- `npm run build` 和 `npm run dev` 会先从此文件裁剪所有文章所需字符。
- 浏览器只加载 `src/assets/fonts/lxgw-wenkai-v1.521-blog.woff2`，此目录的完整 TTF 不会发布到网站。
- 字体工具依赖记录在 `scripts/requirements-fonts.txt`，GitHub Actions 自动安装。
