// Central state object. Every panel reads/writes this; the canvas and all export
// artifacts are pure derivations of it (see prd.md §5).

export type IconLib = "lucide" | "tabler" | "phosphor" | "simple" | "upload"
export type FillType = "linear" | "radial" | "solid"
export type BackgroundShape = "rounded" | "squircle"

export type IconState = {
  iconSource: {
    lib: IconLib
    name: string
    /** Normalized inner glyph markup in a 24x24 coordinate space (no <svg> wrapper). */
    svg: string
  }
  fill: {
    type: FillType
    primary: string // hex
    secondary: string // hex
    angle: number // degrees
  }
  background: {
    shape: BackgroundShape
    radius: number // px (in 512 space)
    radialGlare: boolean
    noiseTexture: boolean
    noiseOpacity: number // %
    strokeSize: number // px
    strokeColor: string // hex
  }
  icon: {
    color: string // hex
    size: number // px (glyph box edge, in 512 space)
    xOffset: number // px
    yOffset: number // px
  }
  meta: { filename: string }
}

/** A placeholder rocket glyph so the canvas renders something before any pick. */
export const ROCKET_GLYPH =
  '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>' +
  '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/>' +
  '<path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>' +
  '<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>'

export const defaultIconState: IconState = {
  iconSource: { lib: "lucide", name: "rocket", svg: ROCKET_GLYPH },
  fill: { type: "linear", primary: "#7F77DD", secondary: "#5B51C7", angle: 135 },
  background: {
    shape: "rounded",
    radius: 112,
    radialGlare: true,
    noiseTexture: false,
    noiseOpacity: 15,
    strokeSize: 0,
    strokeColor: "#000000",
  },
  icon: { color: "#FFFFFF", size: 256, xOffset: 0, yOffset: 0 },
  meta: { filename: "icon.png" },
}
