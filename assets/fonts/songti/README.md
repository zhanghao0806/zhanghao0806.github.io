# 统一文章宋体的构建素材

使用思源宋体设计的 Noto Serif SC 2.003，正常 / 粗体两个字重。

- 上游：https://github.com/notofonts/noto-cjk/releases/tag/Serif2.003
- 固定源版本：`9b0f1436e455d902de067a2501422e5dc71ad16b`。
- 源路径：`Serif/SubsetOTF/SC/NotoSerifSC-{Regular,Bold}.otf`。
- 许可证：`OFL.txt`，SIL Open Font License 1.1。源文件版权信息也保存在字体内部。
- 完整区域源字体只用于构建，不放入网站发布目录。
- 每篇文章单独裁剪为 WOFF2，派生字体内部命名为 `Article Songti`。
- 生成文件和映射不提交 Git；`npm run dev` / `npm run build` 自动生成。
- 本地字体工具：`python -m pip install -r scripts/requirements-fonts.txt`。
