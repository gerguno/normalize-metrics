export function inertOutside(root: HTMLElement) {
  const restored: Array<{ el: HTMLElement; inert: boolean }> = [];
  let node: HTMLElement | null = root;

  while (node && node !== document.body) {
    const parent = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue;
      restored.push({ el: sibling, inert: sibling.inert });
      sibling.inert = true;
    }
    node = parent;
  }

  return () => {
    restored.forEach(({ el, inert }) => {
      el.inert = inert;
    });
  };
}
