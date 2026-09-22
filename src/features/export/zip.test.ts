import { crc32, zip } from './zip'

const enc = new TextEncoder()
const dec = new TextDecoder()

/** Reads a zip back through its central directory, checking every header on the way. */
function unzip(
  buf: Uint8Array,
): { name: string; method: number; data: Uint8Array; offset: number }[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const eocd = buf.length - 22
  expect(view.getUint32(eocd, true)).toBe(0x06054b50)
  const count = view.getUint16(eocd + 10, true)
  const cdSize = view.getUint32(eocd + 12, true)
  let p = view.getUint32(eocd + 16, true)
  expect(p + cdSize).toBe(eocd)
  const out = []
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(p, true)).toBe(0x02014b50)
    const method = view.getUint16(p + 10, true)
    const crc = view.getUint32(p + 16, true)
    const size = view.getUint32(p + 24, true)
    const nameLen = view.getUint16(p + 28, true)
    const offset = view.getUint32(p + 42, true)
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen))
    p += 46 + nameLen

    expect(view.getUint32(offset, true)).toBe(0x04034b50)
    expect(view.getUint16(offset + 8, true)).toBe(method)
    expect(view.getUint32(offset + 14, true)).toBe(crc)
    const localNameLen = view.getUint16(offset + 26, true)
    const extraLen = view.getUint16(offset + 28, true)
    expect(dec.decode(buf.subarray(offset + 30, offset + 30 + localNameLen))).toBe(name)
    const start = offset + 30 + localNameLen + extraLen
    const data = buf.subarray(start, start + size)
    expect(crc32(data)).toBe(crc)
    out.push({ name, method, data, offset })
  }
  return out
}

describe('zip', () => {
  it('computes CRC-32', () => {
    expect(crc32(enc.encode('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array())).toBe(0)
  })

  it('stores entries in order with valid headers and central directory', () => {
    const buf = zip([
      { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
      { name: 'META-INF/manifest.xml', data: '<x/>' },
      { name: 'ümlaut.txt', data: enc.encode('Grüße') },
    ])
    const files = unzip(buf)
    expect(files.map((f) => f.name)).toEqual(['mimetype', 'META-INF/manifest.xml', 'ümlaut.txt'])
    expect(files[0]!.offset).toBe(0)
    expect(files.every((f) => f.method === 0)).toBe(true)
    expect(dec.decode(files[0]!.data)).toBe('application/vnd.oasis.opendocument.spreadsheet')
    expect(dec.decode(files[2]!.data)).toBe('Grüße')
    // The ODF magic: "mimetype" name followed directly by its content at byte 30.
    expect(dec.decode(buf.subarray(30, 38))).toBe('mimetype')
  })
})
