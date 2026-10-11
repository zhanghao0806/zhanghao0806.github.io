// Keep the number of source blank lines between Markdown blocks. This runs
// after Markdown conversion so code, lists and formulas retain their syntax.
export default function rehypeSourceSpacing() {
  return (tree, file) => {
    const positions = file.data.proseBlockPositions ?? [];
    const blocks = tree.children.filter((node) => node.type === 'element'
      && !(node.tagName === 'section' && node.properties?.dataFootnotes !== undefined));
    if (blocks.length !== positions.length) {
      throw new Error('文章块数量与源文件不一致，无法安全保留空行。');
    }
    let previous;
    for (const [index, node] of blocks.entries()) {
      const position = positions[index];
      const blankLines = previous && position
        ? Math.max(0, position.start.line - previous.end.line - 1)
        // Astro masks metadata with whitespace to preserve source positions.
        // These frontmatter lines are not visible article blank lines.
        : 0;
      node.properties ??= {};
      node.properties['data-source-spacing'] = 'true';
      node.properties.style = `${node.properties.style ?? ''};--source-empty-lines: ${blankLines}`;
      previous = position;
    }
  };
}
