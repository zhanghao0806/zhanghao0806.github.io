import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { parseFragment } from 'parse5';
import remarkProseWhitespace from '../src/lib/remark-prose-whitespace.mjs';
import remarkParagraphIndent from '../src/lib/remark-paragraph-indent.mjs';

const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkProseWhitespace, remarkParagraphIndent],
  syntaxHighlight: false,
  smartypants: false,
});
const text = (node) => node.nodeName === '#text'
  ? node.value : (node.childNodes ?? []).map(text).join('');
const render = async (source, preserveWhitespace = true) => parseFragment(
  (await processor.render(source, { frontmatter: { preserveWhitespace } })).code,
);
const paragraphs = (tree) => tree.childNodes.filter((node) => node.tagName === 'p');
const attribute = (node, name) => node.attrs.find((attr) => attr.name === name)?.value;

const source = '  第一行  两个空格\n   第二行 **加粗** 和 [链接](https://example.com)  \n  第三行\n\n\n第四行   \n';
const result = paragraphs(await render(source));
assert.equal(attribute(paragraphs(await render('\n\n\n正文'))[0], 'style'), '--source-empty-lines: 0');
assert.equal(text(result[0]), '  第一行  两个空格\n   第二行 加粗 和 链接  \n  第三行');
assert.equal(text(result[1]), '第四行   ');
assert.equal(attribute(result[1], 'style'), '--source-empty-lines: 2');
assert.ok(result[0].childNodes.some((node) => node.tagName === 'strong'));
assert.ok(result[0].childNodes.some((node) => node.tagName === 'a'));
assert.equal(text(paragraphs(await render('第一行\\\n第二行'))[0]), '第一行\n第二行');
assert.equal(text(paragraphs(await render('第一行\r\n第二行\r\n\r\n第三行'))[0]), '第一行\n第二行');
assert.equal(attribute(paragraphs(await render(source, false))[0], 'data-source-whitespace'), undefined);

const structural = await render('# 标题\n\n- 列表\n\n```text\n  代码\n```');
assert.deepEqual(structural.childNodes.filter((node) => node.tagName).map((node) => node.tagName), ['h1', 'ul', 'pre']);

const article = await readFile(new URL('../src/content/blog/遗憾常有.md', import.meta.url), 'utf8');
const body = article.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
const actual = paragraphs(await render(body));
const expected = body.trim().split(/\n\n+/).map((paragraph) => paragraph.replace(/\*\*/g, ''));
assert.deepEqual(actual.map(text), expected);
assert.equal(actual[1].childNodes.filter((node) => node.tagName === 'strong').length, 1);
assert.ok(text(actual[1]).includes('\n人与人活的是缘分而非关系'));
console.log('Prose whitespace verified: source article, indentation, repeated spaces, blank lines, Markdown markup, hard breaks and CRLF.');
