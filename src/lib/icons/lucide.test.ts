import { describe, expect, it } from "vitest"

import { iconNodeToInnerSvg, type IconNode } from "./lucide"

describe("iconNodeToInnerSvg", () => {
  it("serializes iconNode to inner svg and strips the key attr", () => {
    const node: IconNode = [
      ["path", { d: "M12 15v5", key: "abc" }],
      ["circle", { cx: 12, cy: 12, r: 3, key: "def" }],
    ]
    const out = iconNodeToInnerSvg(node)
    expect(out).toBe('<path d="M12 15v5"/><circle cx="12" cy="12" r="3"/>')
    expect(out).not.toContain("key")
  })

  it("produces no <svg> wrapper", () => {
    const out = iconNodeToInnerSvg([["path", { d: "M0 0", key: "k" }]])
    expect(out).not.toContain("<svg")
  })
})
