import { describe, expect, it } from "vitest"

import { isValidICO, wrapAsICO } from "./wrapAsICO"

// minimal fake PNG: just the signature + a few bytes
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const fakePng = new Uint8Array([...PNG_SIG, 1, 2, 3, 4])

describe("wrapAsICO", () => {
  it("writes the ICONDIR header", () => {
    const ico = wrapAsICO(fakePng)
    expect(Array.from(ico.slice(0, 6))).toEqual([0, 0, 1, 0, 1, 0])
  })

  it("writes the dir entry fields (little-endian)", () => {
    const ico = wrapAsICO(fakePng, 32)
    const dv = new DataView(ico.buffer)
    expect(ico[6]).toBe(32) // width
    expect(ico[7]).toBe(32) // height
    expect(dv.getUint16(10, true)).toBe(1) // planes
    expect(dv.getUint16(12, true)).toBe(32) // bitcount
    expect(dv.getUint32(14, true)).toBe(fakePng.length) // bytesInRes
    expect(dv.getUint32(18, true)).toBe(22) // imageOffset
  })

  it("places the PNG payload at offset 22", () => {
    const ico = wrapAsICO(fakePng)
    expect(Array.from(ico.slice(22, 22 + 8))).toEqual(PNG_SIG)
    expect(ico.length).toBe(22 + fakePng.length)
  })

  it("validates a well-formed ICO", () => {
    expect(isValidICO(wrapAsICO(fakePng))).toBe(true)
  })

  it("rejects a malformed payload", () => {
    const bad = wrapAsICO(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))
    expect(isValidICO(bad)).toBe(false)
  })
})
