// Preserve authored prose whitespace for every article, including future posts.
export default function remarkProseWhitespace() {
  return (tree, file) => {
    const source = String(file.value);
    // Syntax highlighters and formula renderers can replace HTML nodes and
    // discard their positions. Retain the original block order separately.
    file.data.proseBlockPositions = tree.children
      .filter((node) => !['definition', 'footnoteDefinition', 'html'].includes(node.type))
      .map((node) => node.position);

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

    const preserveText = (child) => {
      if (child.type === 'break') restoreInline(child);
      if (child.type === 'text') child.type = 'sourceWhitespaceText';
      child.children?.forEach(preserveText);
    };
    const visit = (node, topLevel = false) => {
      if ((node.type === 'paragraph' || node.type === 'heading') && node.position) {
        // Nested lists and quotes use indentation as Markdown structure. Keep
        // their parsed prose spacing rather than copying list/quote markers.
        if (!topLevel || node.type === 'heading') {
          node.children.forEach(preserveText);
          node.data ??= {};
          node.data.hProperties = {
            ...node.data.hProperties,
            'data-source-whitespace': 'true',
          };
          return;
        }
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
        node.children.forEach(preserveText);
        node.data ??= {};
        node.data.hProperties = {
          ...node.data.hProperties,
          'data-source-whitespace': 'true',
        };
        return;
      }
      node.children?.forEach((child) => visit(child));
    };
    tree.children.forEach((node) => visit(node, true));
  };
}
