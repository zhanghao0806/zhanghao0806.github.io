import { imageKitUrl } from './travel-images.mjs';

export default function rehypeTravelPhotos() {
  return (tree, file) => {
    if (!/[/\\]src[/\\]content[/\\]travel[/\\][^/\\]+\.md$/.test(file.path ?? '')) return;

    const frontmatter = file.data.astro.frontmatter;

    function formatPhoto(node) {
      const { src, alt, title } = node.properties;
      const url = imageKitUrl(src);
      frontmatter.cover ||= src;
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';

      let photo = node;
      if (url && !url.searchParams.has('tr') && !url.pathname.split('/').some((segment) => segment.startsWith('tr:'))) {
        url.searchParams.set('tr', 'w-2400,h-2400,c-at_max,q-86,f-auto');
        node.properties.src = url.href;
        url.searchParams.set('tr', 'w-1200,h-1200,c-at_max,q-86,f-auto');
        photo = {
          type: 'element',
          tagName: 'picture',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'source',
              properties: { media: '(max-width: 640px)', srcSet: url.href },
              children: [],
            },
            node,
          ],
        };
      }

      if (frontmatter.cover === src && frontmatter.coverAlt === undefined) {
        frontmatter.coverAlt = alt || '';
      }

      const children = [photo];
      if (title) {
        delete node.properties.title;
        children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: title }],
        });
      }
      return { type: 'element', tagName: 'figure', properties: { className: ['travel-photo'] }, children };
    }

    function visit(node) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        const image = child.children?.[0];
        if (child.tagName === 'p' && child.children.length === 1 && image?.tagName === 'img') {
          return formatPhoto(image);
        }
        visit(child);
        return child;
      });
    }

    visit(tree);
  };
}
