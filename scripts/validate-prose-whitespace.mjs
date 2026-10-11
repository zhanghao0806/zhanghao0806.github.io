import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { parseFragment } from 'parse5';
import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import config from '../astro.config.mjs';

const processor = await createMarkdownProcessor({
  ...config.markdown.processor.options,
  syntaxHighlight: false,
  smartypants: false,
});
const text = (node) => node.nodeName === '#text'
  ? node.value : (node.childNodes ?? []).map(text).join('');
const render = async (source, frontmatter = {}) => parseFragment(
  (await processor.render(source, { frontmatter })).code,
);
const paragraphs = (tree) => tree.childNodes.filter((node) => node.tagName === 'p');
const attribute = (node, name) => node.attrs?.find((attr) => attr.name === name)?.value;

const source = '  第一行  两个空格\n   第二行 **加粗** 和 [链接](https://example.com)  \n  第三行\n\n\n第四行   \n';
const result = paragraphs(await render(source));
assert.match(attribute(paragraphs(await render('\n\n\n正文'))[0], 'style'), /--source-empty-lines: 0/);
assert.equal(text(result[0]), '  第一行  两个空格\n   第二行 加粗 和 链接  \n  第三行');
assert.equal(text(result[1]), '第四行   ');
assert.match(attribute(result[1], 'style'), /--source-empty-lines: 2/);
assert.ok(result[0].childNodes.some((node) => node.tagName === 'strong'));
assert.ok(result[0].childNodes.some((node) => node.tagName === 'a'));
assert.equal(text(paragraphs(await render('第一行\\\n第二行'))[0]), '第一行\n第二行');
assert.equal(text(paragraphs(await render('第一行\r\n第二行\r\n\r\n第三行'))[0]), '第一行\n第二行');
// No frontmatter opt-in, and stale article metadata cannot disable the rule.
assert.equal(attribute(paragraphs(await render(source))[0], 'data-source-whitespace'), 'true');
assert.equal(attribute(paragraphs(await render(source, { preserveWhitespace: false }))[0], 'data-source-whitespace'), 'true');

const structural = await render('# 标题\n\n- 列表\n\n```text\n  代码\n```');
assert.deepEqual(structural.childNodes.filter((node) => node.tagName).map((node) => node.tagName), ['h1', 'ul', 'pre']);
for (const node of structural.childNodes.filter((node) => node.tagName)) {
  assert.equal(attribute(node, 'data-source-spacing'), 'true');
}
assert.match(attribute((await render('# 标题\n\n\n\n正文')).childNodes.find((node) => node.tagName === 'p'), 'style'), /--source-empty-lines: 3/);
assert.equal(text((await render('- 列表  空格\n  下一行')).childNodes.find((node) => node.tagName === 'ul')).trim(), '列表  空格\n下一行');
assert.equal(text((await render('> 引用  空格  \n> 下一行')).childNodes.find((node) => node.tagName === 'blockquote')).trim(), '引用  空格  \n下一行');
const escaped = paragraphs(await render('文本 &amp; \\*星号\\*  空格'))[0];
assert.equal(text(escaped), '文本 & *星号*  空格');

console.log('Prose whitespace verified: default behavior, indentation, repeated spaces, blank lines, Markdown markup, hard breaks and CRLF.');

const walk = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.childNodes ?? []).flatMap((child) => walk(child, predicate)),
];
const formulas = await render('正文 $a+b$\n下一行\n\n$$\na+b\n$$');
assert.ok(walk(formulas, (node) => attribute(node, 'class')?.split(' ').includes('katex')).length >= 2);
assert.ok(walk(formulas, (node) => attribute(node, 'class')?.split(' ').includes('katex-display')).length >= 1);
assert.ok(text(paragraphs(formulas)[0]).includes('\n下一行'));
const articleDirectory = new URL('../src/content/blog/', import.meta.url);
const files = (await readdir(articleDirectory)).filter((name) => name.endsWith('.md'));
for (const name of files) {
  const raw = await readFile(new URL(name, articleDirectory), 'utf8');
  const { content, frontmatter } = parseFrontmatter(raw, { frontmatter: 'empty-with-spaces' });
  const rendered = await render(content, frontmatter);
  for (const paragraph of walk(rendered, (node) => node.tagName === 'p')) {
    assert.equal(attribute(paragraph, 'data-source-whitespace'), 'true', `Whitespace missing: ${name}`);
  }
  if (process.argv.includes('--built')) {
    const html = await readFile(new URL(`../dist/blog/${frontmatter.slug}/index.html`, import.meta.url), 'utf8');
    const page = parseFragment(html);
    const prose = walk(page, (node) => attribute(node, 'class')?.split(' ').includes('article-prose'))[0];
    assert.ok(prose, `Missing built article: ${name}`);
    for (const paragraph of walk(prose, (node) => node.tagName === 'p')) {
      assert.equal(attribute(paragraph, 'data-source-whitespace'), 'true', `Built whitespace missing: ${name}`);
    }
    for (const block of prose.childNodes.filter((node) => node.tagName && ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'pre', 'table', 'blockquote', 'hr'].includes(node.tagName))) {
      assert.equal(attribute(block, 'data-source-spacing'), 'true', `Built source spacing missing: ${name}`);
    }
  }
}
const css = await readFile(new URL('../src/styles/article-sakura.css', import.meta.url), 'utf8');
assert.match(css, /\[data-source-whitespace="true"\]\s*\{[^}]*white-space:\s*break-spaces/);
assert.match(css, /\[data-source-spacing="true"\]\s*\{[^}]*margin-block:\s*calc\(var\(--source-empty-lines/);
console.log(`Whitespace preservation is enabled for all ${files.length} articles${process.argv.includes('--built') ? ' and their built pages' : ''}.`);
