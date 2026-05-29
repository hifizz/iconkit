import { describe, expect, it } from "vitest"

import { withSvgSize } from "./rasterize"

describe("withSvgSize", () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">' +
    '<rect x="0" y="0" width="512" height="512" rx="112"/>' +
    "</svg>"

  it("replaces the <svg> tag width/height with the target size", () => {
    const out = withSvgSize(svg, 144)
    expect(out).toContain('width="144" height="144"')
    expect(out).not.toContain('width="512" height="512"><rect')
  })

  it("leaves viewBox untouched", () => {
    expect(withSvgSize(svg, 96)).toContain('viewBox="0 0 512 512"')
  })

  it("does not touch inner element width/height (the <rect>)", () => {
    const out = withSvgSize(svg, 96)
    expect(out).toContain('<rect x="0" y="0" width="512" height="512" rx="112"/>')
  })

  it("works when the svg tag has no width/height to begin with", () => {
    const bare = '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>'
    const out = withSvgSize(bare, 48)
    expect(out).toContain('width="48" height="48"')
    expect(out).toContain('viewBox="0 0 24 24"')
  })
})
