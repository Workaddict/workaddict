export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** "a/b: c" → "a-b-c": safe for file names on all platforms. */
export function safeFileName(s: string): string {
  return s.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
}
