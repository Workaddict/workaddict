// Hides the static fallback when the page is loaded inside a frame.
// FrameGuard repeats this check once React is mounted; this closes the window before mount,
// where clickjacking protection cannot rely on headers (GitHub Pages sends none and browsers
// ignore frame-ancestors in a <meta> CSP).
let framed = false
try {
  framed = window.top !== window.self
} catch {
  // A cross-origin parent makes window.top throw, which also means "framed".
  framed = true
}
if (framed) {
  const fallback = document.querySelector('.static-fallback')
  if (fallback) fallback.style.display = 'none'
}
