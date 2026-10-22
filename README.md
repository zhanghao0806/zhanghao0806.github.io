# 张浩的个人主页

这是一个基于 Astro 的个人主页项目，用来维护个人介绍、项目展示和长期写作内容。

网站本地地址：

```text
http://127.0.0.1:4321/
```

线上地址：

```text
https://zhanghao0806.github.io/
```

## 一键发布网站（macOS）

脚本位置：

```text
/Users/zhanghao/code/personal-homepage/publish.command
```

## 写文章格式、放哪里

所有文章都放在：

```text
src/content/blog/
```

新建一个 `.md` 文件，例如：

```text
src/content/blog/qnn-note-02.md
```

文章开头必须写 frontmatter：

```md
---
title: 文章标题
slug: qnn-note-02
date: 2026-06-04
category: note
---

正文从这里开始写。
```

`slug` 是文章网址的一部分，例如：

```text
https://zhanghao0806.github.io/blog/qnn-note-02/
```

文件名用于管理源文件，网址由 frontmatter 中的 `slug` 决定，两者不必相同。每篇文章的 `slug` 必须唯一，建议统一写成带引号的字符串，例如 `slug: '2026-10-19-matrix'` 或 `slug: '20261019'`。最外层引号是 YAML 语法，不会出现在网址里；纯数字 slug 也应保留引号，避免被解析为数字。frontmatter 的每个字段单独占一行。

当前读取规则是 `src/content/blog/*.md`，因此文章应直接放在这个目录下，放进子目录不会被自动读取。当前没有草稿或定时发布过滤：放入此目录的文章会参与构建，未来日期也会参与排序。

`category` 只能使用下面三种之一：

```text
experiment      做过的项目
note            一些笔记
reflections     杂思录
```

“杂思录”统一收录学习回顾、生活随想、阅读与观察。旧的 `/notes/` 入口同步展示合并后的杂思录文章。修改分类时保留文章的 `slug`，已有文章链接仍然可用。

文章目录会自动按 `category` 分类，并按 `date` 从新到旧展示各分类的全部文章。新增文章会自动出现在对应栏目，直接滚动页面即可浏览。

### 正文换行、空格和空行

所有现有文章和未来新增文章默认保留正文中的手动换行、连续空格和段落首行空格。无需为文章添加额外配置。单次换行只换行；Markdown 块之间空一行使用紧凑的 0.65em 段落间距，不再额外留出一整行高度；连续空多行时，额外空行仍各增加一行高度。加粗、标题、链接、列表、代码和公式仍按 Markdown 语法渲染。屏幕宽度不同会影响自动折行。

推荐使用两个全角空格表达中文段首缩进。四个普通空格或行首制表符在标准 Markdown 中可能被解析为代码块；已有代码块仍按代码显示。

### 文章字体与加载速度

文章标题、正文和目录使用网站提供的统一思源宋体设计（Noto Serif SC 2.003），正常、粗体均提供网页字体，不依赖访客设备是否安装宋体。字体加载完成后，各设备使用同一套字形；屏幕和系统的抗锯齿效果仍可能略有差异。下载期间先显示备用字体，避免等待时文章不可读。

字体按每篇文章用字分别裁剪并压缩为 WOFF2，打开一篇只加载该篇的两种字重，并在页面头部预加载。文件名随字体内容变化，便于浏览器缓存；完整源字体只保存在 `assets/fonts/songti/`，不会发布给访客。旧文楷已移除。代码块使用系统等宽字体；数学公式保留 KaTeX 专用字体。

猫咪台词复用同一套粗体宋体源文件，按 `src/data/pet-lines.zh-CN.json` 中的全部台词生成一个共用 WOFF2 包，各页面使用相同地址以复用缓存。它独立于文章字体，只作用于台词；不预加载，以免与正文资源争抢加载优先级。增加台词后，下一次构建自动更新字体包。生成的字体包不会提交进 Git 仓库。

`npm run dev` / `npm run build` 会先自动生成字体；推送到远程 `main` 后，GitHub Actions 自动安装字体工具、裁剪、构建和发布。本地首次使用需运行 `python -m pip install -r scripts/requirements-fonts.txt`，可通过 `FONT_PYTHON` 指定 Python 环境。开发服务运行中新增用字后执行 `npm run font:subset` 或重启。构建会检查汉字覆盖，发现缺字就中止，避免发布混合字体。

## 文章评论（giscus）

所有文章末尾都有评论按钮。滚动到按钮附近（300px 内）时后台加载 giscus，通过其元数据把收起状态的按钮更新为“2 条评论”；数量只统计主评论，不包含楼中楼回复。数据未就绪或网络失败时保留“评论”，仅服务明确报告没有讨论帖时显示“0 条评论”。点击展开后显示“收起评论”，收起后恢复数量，重新展开保留原来的评论框。giscus 没有独立可跨域读取的数量接口，因此显示数量需要预加载完整组件，但不在长文章首屏加载。顶部采用紧凑输入框和右侧提交按钮，下方评论按最新优先显示，保留原生头像、GitHub 用户名和相对时间。隐藏预览标签、排序切换、表情回应、“退出登录”按钮及“评论数／由 giscus 提供支持”标题行。隐藏退出按钮只影响界面，不更改登录状态或已发表的评论。查看无需登录，提交需登录 GitHub 并授权 giscus。

- 页面组件：`src/components/ArticleComments.astro`；按钮与加载失败提示在这里维护。
- 自定义主题：`public/styles/giscus.css`，正式页面从本站加载；本地 HTTP 预览使用 `src/data/giscus.json` 中 `previewTheme` 指向的 HTTPS 副本（评论仓库的 `giscus.css`，通过固定提交的 jsDelivr 地址加载）。修改主题后需同步预览副本并更新提交地址；正式网站随正常构建发布即可。主题依赖 giscus 的 CSS 类名，上游调整界面时需复核。
- 排序配置：`config/giscus-repository.json` 是评论仓库根目录 `giscus.json` 的本地副本，`defaultCommentOrder` 设置为 `newest`。它必须在评论仓库生效，单独修改主页仓库的副本不会改变排序。
- 仓库配置：`src/data/giscus.json`；当前关联公开仓库 `zhanghao0806/blog-comments` 的 `Announcements` 分类。仓库需开启 Discussions，并安装 giscus GitHub App。
- 文章按固定字符串 `blog/<slug>` 严格匹配讨论帖，不受文章标题、域名和本地预览地址影响。已有评论的文章不要随意改 slug。
- 讨论帖会在首次留言时自动创建；构建、浏览或展开空评论区不会创建帖子。数据保存在 GitHub Discussions，不在 Markdown 文件中。
- OAuth 返回时会自动展开评论区以完成登录。网络超时会提供重试和 GitHub 讨论区入口，正文不依赖评论服务。
- 本地预览也连接真实评论仓库，不要随意提交测试留言；首次留言的回链固定为正式文章网址。

配置 ID 是公开标识，不是密钥。安装或重装入口：https://github.com/apps/giscus 。此功能不需要在网站保存 GitHub token。

## 常用目录

```text
publish.command                       双击检查、提交并推送，触发线上更新
src/pages/index.astro                  首页
src/pages/projects.astro               项目页
src/pages/blog/index.astro             文章目录页
src/pages/blog/[slug].astro            文章详情页
src/content/blog/                      所有文章 Markdown
src/lib/writing.js                     写作分类、日期格式
src/layouts/BaseLayout.astro           全站布局和样式
public/avatar.jpg                      导航头像
public/favicon.jpg                     浏览器标签页图标
public/images/                         文章图片
public/images/cats/                    猫咪相册缩略图和大图
```

## 首页怎么维护

首页文件在：

```text
src/pages/index.astro
```

### 在首页添加项目卡片

打开 `src/pages/index.astro`，找到顶部的 `featuredProjects` 数组，在数组的 `[` 和 `]` 之间添加一个对象。对象之间用逗号分隔：

```js
{
  title: '计算系统跨层优化实验',
  summary: '通过多线程计数实验，分析线程数和内存布局对性能的影响。',
  tags: ['性能分析', '缓存行'],
  links: [
    { label: 'GitHub', href: 'https://github.com/zhanghao0806/cpu_counter_experiment' },
    { label: '文章', href: '/blog/2026-10-20/' },
  ],
},
```

| 字段 | 显示位置与写法 |
| --- | --- |
| `title` | 卡片标题 |
| `summary` | 标题下面的项目简介 |
| `tags` | 标签字符串数组；没有标签可写 `[]` |
| `links` | 卡片底部的链接数组；每个链接用 `label` 设置文字、`href` 设置地址，没有链接可写 `[]` |

首页通过 `featuredProjects.map(...)` 渲染卡片，按数组中的顺序显示全部对象，没有自动排序或数量限制。要调整顺序就移动整个对象；要从首页移除卡片就删除对应对象。

首页项目卡片与 `/projects/` 项目页是两份独立数据：

| 展示位置 | 修改文件 | 数组 |
| --- | --- | --- |
| 首页“项目” | `src/pages/index.astro` | `featuredProjects` |
| 项目页 | `src/pages/projects.astro` | `projects` |

如果两处都要展示，需要把同一个项目对象分别加入两个数组，后续修改也要分别同步。只修改项目页不会自动更新首页；新增 `category: experiment` 的文章也不会自动生成项目卡片。

站内文章链接推荐使用 `/blog/文章slug/`，这样本地预览和线上都指向当前网站。GitHub 等外部链接使用完整的 `https://...` 地址。

### 首页“文章”卡片是怎么选出来的

首页“文章”区域使用 `featuredPosts`，先展示 `featuredSlugs` 指定的文章，再用最新文章补足 3 篇。当前配置为：

```js
const featuredSlugs = ['llm01'];
```

因此，当前会先显示 `llm01`，再按日期选取另外最新的 2 篇。这里读取全部分类，不限于项目文章或笔记。

要指定其他文章，把对应的 `slug` 写进数组，例如：

```js
const featuredSlugs = ['llm01', '2026-10-20', '2026-10-19-matrix'];
```

这些值必须与 Markdown 开头的 `slug` 完全一致，注意大小写；不要填写文件名、文章标题或完整网址。例如：

```md
---
title: 如何理解 QNN 参数化量子电路
slug: qnn1
date: 2026-06-02
category: note
---
```

具体显示规则：

- 指定文章按 `featuredSlugs` 中的顺序排在前面。
- 指定文章不足 3 篇时，从其余文章中按 `date` 从新到旧补齐；补充部分会排除已经指定的 slug。
- 空数组 `[]` 表示自动展示最新 3 篇；文章总数不足 3 篇时展示现有文章。
- 不存在的 slug 会被忽略，仍用最新文章补位。重复 slug 不会自动去重，因此不要重复填写。
- 指定超过 3 篇有效文章时会全部展示，当前代码没有把指定列表截断为 3 篇。

### 最新文章模块怎么更新

首页的“最新文章”模块会自动读取：

```text
src/content/blog/
```

然后按照文章 frontmatter 里的 `date` 从新到旧排序，展示最新 5 篇。

也就是说，你只需要在 Markdown 里正确写日期：

```md
date: 2026-06-04
```

不需要手动修改“最新文章”列表。

它与上方“文章”卡片独立筛选，所以同一篇文章可以同时出现在两个区域。修改 `featuredSlugs` 不会改变“最新文章”的排序。

### 新增文章到页面的完整流程

1. 在 `src/content/blog/` 直接新建 `.md`，填写 `title`、唯一的字符串 `slug`、`date` 和合法的 `category`，然后写正文。
2. 构建时，首页读取这些 Markdown 模块，用 `src/lib/writing.js` 中的 `sortPostsByDateDesc` 按日期降序排序，再分别生成“文章”卡片和“最新文章”列表。
3. `src/pages/blog/index.astro` 根据 `category` 把文章放进对应栏目；`src/pages/blog/[slug].astro` 根据 `slug` 生成 `/blog/slug/` 详情页。
4. 如需让文章固定出现在首页，修改 `featuredSlugs`；如需展示项目简介和仓库入口，另行维护 `featuredProjects`，并按需要同步项目页的 `projects`。
5. 运行 `npm run dev`，检查首页、文章目录、文章详情及项目卡片链接；发布前运行 `npm run build`，再按下方发布流程推送。

### 首页猫咪相册

首页底部的相册使用项目自身的 Astro 组件和原生 `<dialog>`，没有额外引入相册库。桌面端四列、手机端两列方形缩略图；点击后，在白色半透明遮罩上显示居中白色相框，保留照片完整的横竖构图，文字说明放在图片下面。支持左右按钮、方向键、Esc、关闭按钮和点击相框空白处或遮罩关闭；关闭后恢复页面滚动。

#### 文件职责与每张照片的说明

| 文件 | 维护内容 |
| --- | --- |
| `src/components/CatAlbum.astro` | 相册标题、带时间的简介、网格样式、大图弹窗和交互 |
| `scripts/prepare-cat-album.mjs` | `photos` 列表：照片顺序、文件编号、每张文字说明、缩略图裁剪位置；以及压缩参数 |
| `src/data/cat-album.json` | 脚本生成的图片路径、说明 `alt`、尺寸，供组件读取 |
| `public/images/cats/` | 网站实际使用的 WebP 缩略图、完整构图预览和清晰大图 |

**每张图片点开后的文字说明，在 `scripts/prepare-cat-album.mjs` 的 `photos` 数组里写，位于每行的第二项**。例如：

```js
['01', '椅子上的长毛', 'east'],
```

三项分别是源文件编号（对应 `01.jpg`）、文字说明、方形缩略图裁剪位置。说明同时作为图片的替代文本，建议简短描述照片内容。修改说明后重新运行脚本；不要只改生成的 JSON，否则下次生成会覆盖。列表顺序就是网页展示顺序。

| 照片 | 当前说明 | 缩略图裁剪 |
| --- | --- | --- |
| `01.jpg` | 椅子上的长毛 | `east`，靠右 |
| `02.jpg` | 书架旁的长毛 | `centre`，居中 |
| `03.jpg` | 吃饭的长毛 | `east`，靠右 |
| `04.jpg` | 被抱着摸摸的长毛 | `centre`，居中 |
| `05.jpg` | 躺地撒娇的长毛 | `centre`，居中 |
| `06.jpg` | 吃完饭舔嘴的长毛 | `centre`，居中 |
| `07.jpg` | 要猫条的小黄长毛 | `centre`，居中 |
| `08.jpg` | 抬头看镜头的小黄长毛 | `centre`，居中 |

裁剪位置还可用 `north`（靠上）、`west`（靠左）。只裁剪缩略图，大图不裁剪。

#### 新增、修改和删除照片

1. 把原始 JPG 放在本地来源目录；当前目录是 `/Users/zhanghao/MyFile/zh-个人文件/猫咪照片`，原图不会被修改或复制进仓库。
2. 修改脚本的 `photos` 列表：新增照片时添加如 `['09', '新照片的说明', 'centre']`；更换照片时替换来源目录中相应的 JPG；调整顺序时移动整行。
3. 在项目根目录执行生成命令：

```sh
node scripts/prepare-cat-album.mjs '/Users/zhanghao/MyFile/zh-个人文件/猫咪照片'
```

4. 删除照片时，从列表删除对应行并重新生成，同时删除 `public/images/cats/` 中该编号的 `.webp`、`-thumb.webp` 和 `-preview.webp`。脚本不会自动清理旧文件，以免误删；无需删除本地原图。
5. 用 `npm run dev` 检查缩略图、横竖大图和说明，再运行 `npm run build`。发布时提交脚本、生成的 JSON、WebP，以及修改过的组件。

仅把图片复制到目录不会自动加入相册。日常构建读取已生成的文件，不依赖本地原始照片目录，也不会重复压缩。

#### 图片处理与加载

处理复用项目已有的 `sharp`：自动校正照片方向，输出 560 × 560px 方形缩略图（WebP 质量 78），以及最长边不超过 1800px 的完整图片（质量 84，不放大小图），默认不保留 EXIF 元数据。另生成最长边 560px、质量 65 的完整构图预览（`-preview.webp`）。缩略图懒加载并预留尺寸；接近相册时提前加载小预览，悬停或键盘聚焦时预取对应清晰图。点击后立即显示已有缩略图，接着显示完整预览，清晰图解码完成后再替换。快速切图和关闭会使旧请求失效，避免迟到的图片覆盖当前照片；没有一次性预加载全部清晰图。JavaScript 不可用时，缩略图链接仍能直接打开大图。

## 项目页面怎么维护

项目页文件在：

```text
src/pages/projects.astro
```

每一个项目卡片对应 `projects` 数组里的一个对象：

```js
{
  title: '项目中文名',
  summary: '一句话简介。',
  tags: ['标签1', '标签2'],
  links: [
    { label: '做过的项目', href: '/blog/你的文章slug/' },
    { label: 'GitHub', href: 'https://github.com/zhanghao0806/你的项目仓库' },
  ],
}
```

以后做完一个项目，推荐流程是：

1. 先在 `src/content/blog/` 写一篇 `category: experiment` 的项目文章。
2. 给这篇文章设置清楚的 `slug`，例如 `mnist-qnn-lab`。
3. 在 `src/pages/projects.astro` 的 `projects` 数组里复制一个项目对象。
4. `title` 写项目中文名。
5. `summary` 写一句话简介。
6. 第一个链接写项目文章地址：`/blog/mnist-qnn-lab/`。
7. 第二个链接写这个项目的 GitHub 仓库地址。
8. 如果首页也要展示，把同一个对象加入 `src/pages/index.astro` 的 `featuredProjects` 数组。

目前项目卡片不会自动从项目文章生成。原因是项目页需要“项目中文名、简介、GitHub 仓库、相关文章链接”这些结构化信息，而普通 Markdown 文章现在只保存了 `title / slug / date / category`。

如果以后想自动生成，可以给项目文章增加额外 frontmatter，例如：

```md
---
title: QNN 实现 MNIST01 分类学习
slug: mnist-qnn-lab
date: 2026-06-04
category: experiment
project:
  name: QNN 手写数字分类
  summary: 使用参数化量子电路完成 MNIST 0/1 分类实验。
  github: https://github.com/zhanghao0806/xxx
---
```

然后再改 `src/pages/projects.astro`，让它读取这些带 `project` 字段的文章自动生成卡片。现在为了简单稳定，项目卡片先采用手动维护。

## 文章目录和分类浏览

`src/pages/blog/index.astro` 按三个专栏显示全部文章，按日期从新到旧排序。桌面端为三栏，窄屏自动切换为两栏或单栏，通过浏览器页面滚动即可看到最后一篇；没有栏目内部滚动或“查看全部”按钮。

`src/pages/blog/[category]/index.astro` 提供单独的分类归档，使用 `src/components/WritingArchive.astro` 显示该分类的完整列表。旧的分类分页链接由 `src/pages/blog/[category]/[page].astro` 跳转到完整分类页，兼容已有链接。

持续往 `src/content/blog/` 添加 Markdown 文章即可，构建时会自动更新目录与文章数量。分类和日期格式在 `src/lib/writing.js` 维护，无需配置每页篇数。

## 图片放哪里

文章图片建议统一放在：

```text
public/images/
```

当前已经按文章类型建好目录：

```text
public/images/
├─ experiment/
├─ note/
└─ reflections/
```

例如图片放在：

```text
public/images/note/qnn-circuit.png
```

Markdown 里这样引用：

```md
![QNN 电路示意图](/images/note/qnn-circuit.png)
```

注意：

- 不要写本地绝对路径，例如 `/Users/zhanghao/Desktop/a.png`。
- `public/` 目录会成为网站根目录，所以路径从 `/images/...` 开始。
- 图片文件也要一起 `git add`，否则线上不会显示。

## 写完文章后怎么预览

进入项目目录：

```sh
cd /path/to/personal-homepage
```

启动本地服务：

```sh
npm run dev
```

打开文章目录：

```text
http://127.0.0.1:4321/blog/
```

或者直接打开某篇文章：

```text
http://127.0.0.1:4321/blog/你的slug/
```

如果页面没有刷新，浏览器里按：

```text
Cmd + Shift + R
```

## 发布到 GitHub Pages

可选：先在本地构建检查（推送后的自动部署也会执行构建）：

```sh
npm run build
```

提交并推送：

```sh
git status
git add .
git commit -m "Add new article"
git push personal-homepage main
```

GitHub Actions 会自动部署。部署状态看这里：

```text
https://github.com/zhanghao0806/zhanghao0806.github.io/actions
```

部署成功后访问：

```text
https://zhanghao0806.github.io/
```

## 支持哪些笔记格式

当前网站直接支持：

```text
.md Markdown 文件
```

也就是说，文章应该写成 Markdown，放进：

```text
src/content/blog/
```

Word 文档 `.docx` 不能直接作为网页文章渲染。可以这样处理：

- 推荐：把 Word 内容转换成 Markdown，再放进 `src/content/blog/`。
- 如果只是提供下载：把 `.docx` 放到 `public/files/`，然后在 Markdown 里链接它。

例如：

```text
public/files/my-report.docx
```

Markdown 里写：

```md
[下载 Word 报告](/files/my-report.docx)
```

PDF 也类似，可以放到：

```text
public/files/
```

然后作为下载或预览链接使用。

## 代码片段能不能显示

可以。Markdown 里用代码块：

````md
```python
def hello():
    print("hello")
```
````

Astro 会正常渲染代码块，并带基础代码高亮。

## 数学公式能不能显示

可以。项目已经配置了 `remark-math`、`rehype-katex` 和 KaTeX 样式，网页端会把 Markdown 里的 LaTeX 公式渲染成正式数学公式。

行内公式写法：

```md
参数更新可以写成 $\theta_{t+1} = \theta_t - \eta \nabla L(\theta_t)$。
```

块级公式写法：

```md
$$
E = mc^2
$$
```

如果你在 VS Code 里预览 Markdown 时也想看到接近网页端的公式效果，可以安装支持 KaTeX / LaTeX 的 Markdown 预览插件，比如 `Markdown Preview Enhanced`。最终以本地网页预览 `npm run dev` 的效果为准。

## 常用维护命令

```sh
# 启动本地预览
npm run dev

# 构建检查
npm run build

# 查看本地修改
git status

# 提交并推送
git add .
git commit -m "Update site"
git push personal-homepage main
```


## 猫咪按钮与阅读彩蛋

文章页的猫咪右侧有五个小圆按钮，从上到下如下。修改时可以直接用下表的“按钮名称”指示，例如“把呼神护卫按钮的光圈调大”。普通页面只有巨大模式和隐藏猫咪按钮。

| 按钮名称 | 图案 | 作用 | 悬停台词 | 代码标识 |
| --- | --- | --- | --- | --- |
| 巨大模式按钮 | 坏笑猫头（邪恶猫猫头像） | 放大猫咪，再点恢复 | 哥斯喵来袭！（仅未放大时触发） | `data-pet-action="giant"` |
| 量子叠加按钮（喵化按钮） | 重影猫头 | 标题和正文变成“喵”，产生粉蓝重影并轻微漂移；保留标点、空格、目录、公式和代码 | 小心，猫猫大军来袭！ | `data-reading-effect="quantum"` |
| 重力失效按钮 | 眯眼猫头 | 标题、段落和目录项漂浮，鼠标轻推附近少量元素 | 重力好像失效了？ | `data-reading-effect="gravity"` |
| 呼神护卫按钮 | 圆框眼镜＋闪电 | 页面变暗，银蓝光源跟随鼠标或触摸位置照亮文字 | Expecto Patronum ! | `data-reading-effect="patronum"` |
| 隐藏猫咪按钮 | 向下箭头 | 收起猫咪并关闭阅读效果，点击留下的爪印召回 | 欢迎再来找我玩。 | `data-pet-action="hide"` |

鼠标进入猫咪四周约 32px 的感应区域时显示按钮，离开时隐藏；普通模式感应区域包含猫咪到按钮之间的空隙。巨大模式下，感应区域同样包含猫咪与旁边的按钮组。感应区域不拦截正文点击。键盘聚焦和手机点击猫咪也可显示按钮。

三个阅读彩蛋默认关闭，首次点击才加载，彼此互斥。再次点击当前效果按钮或按 Esc 关闭；退出喵化会恢复原文。悬停只显示台词，不开启效果，键盘聚焦按钮也会显示对应台词。

维护位置：

- `src/components/CatCompanion.astro`：按钮顺序、SVG 图标、名称和点击加载入口。
- `src/styles/cat-companion.css`：按钮大小、颜色和位置；普通模式工具栏位于猫咪右侧偏下，巨大模式跟随猫咪，优先放在右侧，靠近屏幕边缘时切换到左侧或向内收。
- `src/scripts/cat-companion/controller.ts`：猫咪交互、悬停台词触发和气泡定位。
- `src/data/pet-lines.zh-CN.json`：五条按钮台词，ID 为 `hover-giant`、`hover-quantum`、`hover-gravity`、`hover-patronum`、`hover-hide`；修改后运行 `npm run font:subset` 更新台词字体。
- `src/scripts/reading-effects.ts` 和 `src/styles/reading-effects.css`：喵化、漂浮幅度、光圈和效果恢复逻辑。
