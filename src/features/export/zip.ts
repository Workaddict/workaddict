/**
 * Minimal zip writer: entries are stored uncompressed. Enough for OpenDocument packages,
 * which require the first entry (`mimetype`) to be stored anyway, and keeps a compression
 * library out of the bundle.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

export interface ZipEntry {
  name: string
  data: Uint8Array | string
}

/** MS-DOS date and time, as zip headers store them (local time, 2-second resolution). */
function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

/** Bit 11: file names are UTF-8. */
const UTF8_NAMES = 0x0800

export function zip(entries: ZipEntry[], modified = new Date()): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder()
  const { time, date } = dosDateTime(modified)
  const files = entries.map((e) => {
    const data = typeof e.data === 'string' ? enc.encode(e.data) : e.data
    return { name: enc.encode(e.name), data, crc: crc32(data), offset: 0 }
  })

  const localSize = files.reduce((s, f) => s + 30 + f.name.length + f.data.length, 0)
  const centralSize = files.reduce((s, f) => s + 46 + f.name.length, 0)
  const out = new Uint8Array(localSize + centralSize + 22)
  const view = new DataView(out.buffer)
  let p = 0
  const u16 = (v: number) => {
    view.setUint16(p, v, true)
    p += 2
  }
  const u32 = (v: number) => {
    view.setUint32(p, v, true)
    p += 4
  }
  const bytes = (b: Uint8Array) => {
    out.set(b, p)
    p += b.length
  }

  for (const f of files) {
    f.offset = p
    u32(0x04034b50)
    u16(20) // version needed
    u16(UTF8_NAMES)
    u16(0) // stored
    u16(time)
    u16(date)
    u32(f.crc)
    u32(f.data.length) // compressed size
    u32(f.data.length)
    u16(f.name.length)
    u16(0) // extra length
    bytes(f.name)
    bytes(f.data)
  }

  const centralStart = p
  for (const f of files) {
    u32(0x02014b50)
    u16(20) // version made by
    u16(20) // version needed
    u16(UTF8_NAMES)
    u16(0)
    u16(time)
    u16(date)
    u32(f.crc)
    u32(f.data.length)
    u32(f.data.length)
    u16(f.name.length)
    u16(0) // extra length
    u16(0) // comment length
    u16(0) // disk number
    u16(0) // internal attributes
    u32(0) // external attributes
    u32(f.offset)
    bytes(f.name)
  }

  u32(0x06054b50)
  u16(0) // this disk
  u16(0) // disk with central directory
  u16(files.length)
  u16(files.length)
  u32(centralSize)
  u32(centralStart)
  u16(0) // comment length
  return out
}
