// Opt-in prose layout: keep authored whitespace while retaining Markdown markup.
export default function remarkProseWhitespace() {
  return (tree, file) => {
    if (file.data.astro?.frontmatter?.preserveWhitespace !== true) return;
    const source = String(file.value);

    const restoreInline = (node) => {
      if (node.type === 'break' && node.position) {
        // Use one preserved newline, avoiding a <br> plus a second CSS newline.
        node.type = 'text';
        node.value = source.slice(node.position.start.offset, node.position.end.offset)
          .replace(/\\(?=\r?\n)/g, '').replace(/\r\n/g, '\n');
      } else if (node.type === 'text' && node.position) {
        const rawLines = source.slice(node.position.start.offset, node.position.end.offset)
          .replace(/\r\n/g, '\n').split('\n');
        const lines = node.value.split('\n');
        // Restore whitespace stripped by the parser, without undoing escapes,
        // entities or typography transformations in the actual text.
        if (rawLines.length === lines.length) {
          node.value = lines.map((line, index) => {
            const raw = rawLines[index];
            const leading = raw.match(/^[ \t]*/)[0];
            const trailing = raw.match(/[ \t]*$/)[0];
            if (/^[ \t]*$/.test(raw)) return raw;
            return leading + line.replace(/^[ \t]*|[ \t]*$/g, '') + trailing;
          }).join('\n');
        }
      }
      node.children?.forEach(restoreInline);
    };

    let previous;
    for (const node of tree.children) {
      if (node.type === 'paragraph' && node.position) {
        node.children.forEach(restoreInline);
        const children = [];
        let cursor = node.position.start.offset - node.position.start.column + 1;
        for (const child of node.children) {
          if (child.position) {
            const gap = source.slice(cursor, child.position.start.offset);
            if (gap && /^[ \t]*$/.test(gap)) children.push({ type: 'text', value: gap });
            cursor = child.position.end.offset;
          }
          children.push(child);
        }
        const end = source.indexOf('\n', node.position.end.offset);
        const trailing = source.slice(cursor, end === -1 ? source.length : end);
        if (trailing && /^[ \t\r]*$/.test(trailing)) {
          children.push({ type: 'text', value: trailing.replace(/\r$/, '') });
        }
        node.children = children;
        // The standard text-to-HTML handler trims every line again. A custom
        // literal text node uses its value unchanged through the default handler.
        const preserveText = (child) => {
          if (child.type === 'text') child.type = 'sourceWhitespaceText';
          child.children?.forEach(preserveText);
        };
        node.children.forEach(preserveText);
        const blankLines = previous?.position
          ? Math.max(0, node.position.start.line - previous.position.end.line - 1)
          // Astro masks frontmatter with whitespace to retain source positions.
          // Those metadata lines must not become empty lines above the article.
          : 0;
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          'data-source-whitespace': 'true',
          style: `--source-empty-lines: ${blankLines}`,
        };
      }
      previous = node;
    }
  };
}
