// Keep native table layout; scrolling belongs to a separate container.
export default function rehypeArticleTables() {
  return (tree) => {
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        visit(child);
        if (child.type !== 'element' || child.tagName !== 'table') return child;

        const properties = { className: ['article-table-scroll'] };
        // Source spacing must stay on the outer, top-level article block.
        if (child.properties?.['data-source-spacing']) {
          properties['data-source-spacing'] = child.properties['data-source-spacing'];
          properties.style = child.properties.style;
          delete child.properties['data-source-spacing'];
          delete child.properties.style;
        }
        return {
          type: 'element',
          tagName: 'div',
          properties,
          children: [child],
        };
      });
    };
    visit(tree);
  };
}
