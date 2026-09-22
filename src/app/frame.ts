/**
 * Whether the app runs inside a frame. Blocking framing needs `frame-ancestors`, which browsers
 * ignore in a <meta> CSP, and GitHub Pages cannot send headers, so it is checked here.
 * A cross-origin parent makes `window.top` access throw, which also means "framed".
 */
export function isFramed(win: Window = window): boolean {
  try {
    return win.top !== win.self
  } catch {
    return true
  }
}
