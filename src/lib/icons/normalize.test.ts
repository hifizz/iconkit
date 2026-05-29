import { describe, expect, it } from "vitest"

import { normalizeSvg, sanitizeUploadedSvg } from "./normalize"

describe("normalizeSvg", () => {
  it("detects a 24-viewBox stroke icon (tabler/lucide style)", () => {
    const raw =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1"/></svg>'
    const g = normalizeSvg(raw)
    expect(g.viewBox).toBe(24)
    expect(g.paint).toBe("stroke")
    expect(g.svg).toBe('<path d="M1 1"/>')
  })

  it("detects a 256-viewBox fill icon (phosphor style)", () => {
    const raw =
      '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M2 2"/></svg>'
    const g = normalizeSvg(raw)
    expect(g.viewBox).toBe(256)
    expect(g.paint).toBe("fill")
  })

  it("strips <title> from brand icons (simple-icons style)", () => {
    const raw =
      '<svg role="img" viewBox="0 0 24 24"><title>GitHub</title><path d="M12 .3"/></svg>'
    const g = normalizeSvg(raw)
    expect(g.svg).not.toContain("<title")
    expect(g.svg).toBe('<path d="M12 .3"/>')
    expect(g.paint).toBe("fill")
  })

  it("respects an explicit paint hint", () => {
    const raw = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>'
    expect(normalizeSvg(raw, "stroke").paint).toBe("stroke")
  })
})

describe("sanitizeUploadedSvg", () => {
  it("removes script tags and event handlers", () => {
    const raw =
      '<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M1 1" onload="evil()"/></svg>'
    const out = sanitizeUploadedSvg(raw)!
    expect(out).not.toContain("<script")
    expect(out).not.toContain("onload")
  })

  it("strips external references", () => {
    const raw =
      '<svg viewBox="0 0 24 24"><image href="https://evil.com/x.png"/><path d="M1 1"/></svg>'
    const out = sanitizeUploadedSvg(raw)!
    expect(out).not.toContain("https://evil.com")
  })

  it("rejects non-svg input", () => {
    expect(sanitizeUploadedSvg("<div>nope</div>")).toBeNull()
  })
})
