/**
 * Wrap a single 32x32 PNG into a valid PNG-in-ICO container.
 * Layout: 6-byte ICONDIR + 16-byte ICONDIRENTRY + PNG payload (offset 22).
 * Modern OSes accept a PNG payload directly inside an ICO (no BMP needed).
 */
export function wrapAsICO(png: Uint8Array, size = 32): Uint8Array {
  const out = new Uint8Array(22 + png.length)
  const dv = new DataView(out.buffer)
  // ICONDIR
  dv.setUint16(0, 0, true) // reserved
  dv.setUint16(2, 1, true) // type = icon
  dv.setUint16(4, 1, true) // count = 1
  // ICONDIRENTRY
  out[6] = size >= 256 ? 0 : size // bWidth (0 means 256)
  out[7] = size >= 256 ? 0 : size // bHeight
  out[8] = 0 // bColorCount (truecolor)
  out[9] = 0 // reserved
  dv.setUint16(10, 1, true) // wPlanes
  dv.setUint16(12, 32, true) // wBitCount
  dv.setUint32(14, png.length, true) // dwBytesInRes
  dv.setUint32(18, 22, true) // dwImageOffset
  // payload
  out.set(png, 22)
  return out
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Validate a wrapped ICO: correct header + a PNG payload at offset 22. */
export function isValidICO(ico: Uint8Array): boolean {
  if (ico.length < 22 + PNG_SIG.length) return false
  const headerOk =
    ico[0] === 0 &&
    ico[1] === 0 &&
    ico[2] === 1 &&
    ico[3] === 0 &&
    ico[4] === 1 &&
    ico[5] === 0
  if (!headerOk) return false
  for (let i = 0; i < PNG_SIG.length; i++) {
    if (ico[22 + i] !== PNG_SIG[i]) return false
  }
  return true
}
