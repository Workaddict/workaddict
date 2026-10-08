/** UTF-8 safe base64 helpers (btoa/atob only handle Latin-1). */
export function encodeBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

export function decodeBase64(b64: string): string {
  return new TextDecoder().decode(base64ToBytes(b64))
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
