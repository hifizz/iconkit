import { describe, expect, it } from "vitest"

import { hashString, matchKeyword, slugifyFilename } from "./quickstart"

describe("matchKeyword", () => {
  it("maps synonyms to the right glyph", () => {
    expect(matchKeyword("my chat app").iconName).toBe("message-circle")
    expect(matchKeyword("Coffee Shop").iconName).toBe("coffee")
    expect(matchKeyword("analytics dashboard").iconName).toBe("bar-chart-3")
  })

  it("is deterministic (same input → same result)", () => {
    expect(matchKeyword("rocket")).toEqual(matchKeyword("rocket"))
  })

  it("falls back to a known glyph for gibberish", () => {
    const m = matchKeyword("zzxqyw")
    expect(m.iconName).toBe("sparkles")
  })

  it("always returns a valid preset id", () => {
    const m = matchKeyword("anything")
    expect(typeof m.presetId).toBe("string")
    expect(m.presetId.length).toBeGreaterThan(0)
  })

  it("matches an exact lucide name", () => {
    expect(matchKeyword("anchor").iconName).toBe("anchor")
  })
})

describe("hashString", () => {
  it("is stable and unsigned", () => {
    expect(hashString("abc")).toBe(hashString("abc"))
    expect(hashString("abc")).toBeGreaterThanOrEqual(0)
  })
})

describe("slugifyFilename", () => {
  it("slugifies to a filename stem", () => {
    expect(slugifyFilename("My Chat App!")).toBe("my-chat-app")
    expect(slugifyFilename("   ")).toBe("icon")
  })
})
