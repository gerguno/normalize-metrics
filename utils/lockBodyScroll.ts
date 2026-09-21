export function lockBodyScroll() {
  const html = document.documentElement;
  const body = document.body;
  const y = window.scrollY || html.scrollTop;
  const prevHtml = html.style.overflow;
  const prevBody = body.style.overflow;
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  html.scrollTop = y;
  return () => {
    html.style.overflow = prevHtml;
    body.style.overflow = prevBody;
    html.scrollTop = y;
  };
}
