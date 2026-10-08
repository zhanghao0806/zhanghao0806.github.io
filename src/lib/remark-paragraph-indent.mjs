// Preserve explicit paragraph indents as layout, rather than collapsible HTML whitespace.
export default function remarkParagraphIndent() {
  return (tree, file) => {
    const source = String(file.value);

    // Only top-level prose paragraphs: list nesting and code indentation are Markdown syntax.
    for (const node of tree.children) {
      if (node.type !== 'paragraph' || !node.position) continue;
      if (node.children.every((child) => child.type === 'image' || child.type === 'inlineMath'
        || (child.type === 'text' && /^[\s\u200B\uFEFF]*$/.test(child.value)))) continue;

      const { offset, column } = node.position.start;
      const lineStart = offset - column + 1;
      // Markdown strips up to three initial ASCII spaces, so inspect the original line.
      const leading = source.slice(lineStart, node.position.end.offset)
        .match(/^[ \t\u3000\u00A0\u200B\uFEFF]+/)?.[0] ?? '';
      const visibleSpaces = leading.replace(/[\u200B\uFEFF]/g, '');
      if (!visibleSpaces.includes('\t') && visibleSpaces.length < 2) continue;

      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        'data-paragraph-indent': 'true',
      };

      // Avoid adding the original spaces on top of the CSS indent.
      const first = node.children[0];
      if (first?.type === 'text') {
        first.value = first.value.replace(/^[ \t\u3000\u00A0\u200B\uFEFF]+/, '');
      }
    }
  };
}
