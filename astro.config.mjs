// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkParagraphIndent from './src/lib/remark-paragraph-indent.mjs';

function remarkArticleImagePerformance() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'image') {
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          decoding: 'async',
          loading: 'lazy',
        };
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    processor: unified({
      remarkPlugins: [remarkMath, remarkParagraphIndent, remarkArticleImagePerformance],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
