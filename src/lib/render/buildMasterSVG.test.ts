import { describe, expect, it } from "vitest"

import { defaultIconState, type IconState } from "@/lib/types"
import { buildMasterSVG } from "./buildMasterSVG"

const base = defaultIconState

describe("buildMasterSVG", () => {
  it("is deterministic for the same input", () => {
    expect(buildMasterSVG(base)).toBe(buildMasterSVG(base))
  })

  it("produces a 512 viewBox svg", () => {
    const svg = buildMasterSVG(base)
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).toContain('viewBox="0 0 512 512"')
  })

  it("computes the glyph transform from size + offset", () => {
    const state: IconState = {
      ...base,
      icon: { ...base.icon, size: 240, xOffset: 0, yOffset: 0 },
    }
    // scale = 240/24 = 10, tx = ty = 256 - 120 = 136 (canvas center 256)
    expect(buildMasterSVG(state)).toContain('transform="translate(136 136) scale(10)"')
  })

  it("keeps lucide fidelity attrs on the glyph group", () => {
    const svg = buildMasterSVG(base)
    expect(svg).toContain('stroke-width="2"')
    expect(svg).toContain('stroke-linecap="round"')
    expect(svg).toContain('fill="none"')
  })

  it("emits a linear gradient for linear fill", () => {
    const svg = buildMasterSVG(base)
    expect(svg).toContain("<linearGradient")
    expect(svg).toContain('rotate(135 0.5 0.5)')
  })

  it("uses a solid paint (no fill gradient) for solid fill", () => {
    const svg = buildMasterSVG({
      ...base,
      fill: { ...base.fill, type: "solid", primary: "#123456" },
      background: { ...base.background, radialGlare: false },
    })
    expect(svg).not.toContain("fillGrad")
    expect(svg).not.toContain("<linearGradient")
    expect(svg).toContain('fill="#123456"')
  })

  it("uses a squircle path (no rounded rect) when shape is squircle", () => {
    const svg = buildMasterSVG({
      ...base,
      background: { ...base.background, shape: "squircle" },
    })
    expect(svg).toContain('<path d="M512.00 256.00')
    expect(svg).not.toContain("rx=")
  })

  it("omits glare/noise/stroke layers when disabled", () => {
    const svg = buildMasterSVG({
      ...base,
      background: {
        ...base.background,
        radialGlare: false,
        noiseTexture: false,
        strokeSize: 0,
      },
    })
    expect(svg).not.toContain("url(#glare)")
    expect(svg).not.toContain("url(#noise)")
  })

  it("paints fill icons with fill (no stroke) and scales by their viewBox", () => {
    const svg = buildMasterSVG({
      ...base,
      icon: { ...base.icon, size: 256, xOffset: 0, yOffset: 0 },
      iconSource: {
        lib: "phosphor",
        name: "heart",
        svg: '<path d="M1 1"/>',
        viewBox: 256,
        paint: "fill",
      },
    })
    // scale = 256/256 = 1, centered at 256 - 128 = 128 (canvas center 256)
    expect(svg).toContain('transform="translate(128 128) scale(1)"')
    expect(svg).toContain(`fill="${base.icon.color}"`)
    // the glyph group itself should not carry a stroke paint
    expect(svg).not.toContain('stroke-width="2"')
  })

  it("snapshot: default state", () => {
    expect(buildMasterSVG(base)).toMatchSnapshot()
  })
})
