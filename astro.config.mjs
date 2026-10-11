// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkProseWhitespace from './src/lib/remark-prose-whitespace.mjs';
import rehypeSourceSpacing from './src/lib/rehype-source-spacing.mjs';

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
      remarkPlugins: [remarkMath, remarkProseWhitespace, remarkArticleImagePerformance],
      rehypePlugins: [rehypeKatex, rehypeSourceSpacing],
    }),
  },
});
