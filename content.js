(() => {
  // genuine, genuinely, genuineness, ungenuine, ungenuinely...
  const SPLIT = /(\b(?:un)?genuine(?:ly|ness)?\b)/i;
  const SKIP =
    'script,style,noscript,textarea,svg,[contenteditable=""],[contenteditable="true"],.genuine-rainbow';

  const skipped = (node) => {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !el || el.closest(SKIP);
  };

  function wrapText(node) {
    const parts = node.nodeValue.split(SPLIT);
    if (parts.length < 2) return;
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i % 2) {
        const span = document.createElement('span');
        span.className = 'genuine-rainbow';
        span.textContent = part;
        frag.appendChild(span);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    node.replaceWith(frag);
  }

  function process(root) {
    if (root.nodeType === 3) {
      if (!skipped(root)) wrapText(root);
      return;
    }
    if (root.nodeType !== 1 || skipped(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        SPLIT.test(n.nodeValue) && !skipped(n)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapText);
  }

  process(document.body);

  // Handle dynamically added content
  const queue = new Set();
  let scheduled = false;
  new MutationObserver((mutations) => {
    for (const m of mutations)
      m.addedNodes.forEach((n) => (n.nodeType === 1 || n.nodeType === 3) && queue.add(n));
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const batch = [...queue];
      queue.clear();
      batch.forEach((n) => n.isConnected && process(n));
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
