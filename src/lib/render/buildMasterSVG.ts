import { SQUIRCLE_PATH_512 } from "@/lib/presets"
import type { IconState } from "@/lib/types"

export const MASTER_SIZE = 512

/**
 * Pure: IconState -> a standalone 512x512 master SVG string. The single source
 * of truth from which every PNG / ICO / SVG export is derived (prd.md §5.2).
 *
 * Deterministic: no Math.random / Date, fixed attribute order, fixed element
 * ids — so the same state always yields byte-identical output (snapshot-safe).
 *
 * Layer order (back to front): fill shape -> radial glare -> noise -> stroke
 * outline -> glyph.
 */
export function buildMasterSVG(state: IconState): string {
  const { fill, background, icon, iconSource } = state
  const S = MASTER_SIZE

  // --- background shape element (without paint attrs) ---
  const shapeEl = (extra: string) =>
    background.shape === "squircle"
      ? `<path d="${SQUIRCLE_PATH_512}" ${extra}/>`
      : `<rect x="0" y="0" width="${S}" height="${S}" rx="${background.radius}" ry="${background.radius}" ${extra}/>`

  // --- fill paint ---
  const defs: string[] = []
  let fillPaint: string
  if (fill.type === "solid") {
    fillPaint = fill.primary
  } else if (fill.type === "linear") {
    defs.push(
      `<linearGradient id="fillGrad" gradientTransform="rotate(${fill.angle} 0.5 0.5)">` +
        `<stop offset="0%" stop-color="${fill.primary}"/>` +
        `<stop offset="100%" stop-color="${fill.secondary}"/>` +
        `</linearGradient>`,
    )
    fillPaint = "url(#fillGrad)"
  } else {
    defs.push(
      `<radialGradient id="fillGrad" cx="50%" cy="50%" r="75%">` +
        `<stop offset="0%" stop-color="${fill.primary}"/>` +
        `<stop offset="100%" stop-color="${fill.secondary}"/>` +
        `</radialGradient>`,
    )
    fillPaint = "url(#fillGrad)"
  }

  if (background.radialGlare) {
    defs.push(
      `<radialGradient id="glare" cx="50%" cy="0%" r="80%">` +
        `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>` +
        `<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>` +
        `</radialGradient>`,
    )
  }

  if (background.noiseTexture) {
    defs.push(
      `<filter id="noise" x="0" y="0" width="100%" height="100%">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix type="saturate" values="0"/>` +
        `<feComponentTransfer><feFuncA type="linear" slope="${background.noiseOpacity / 100}"/></feComponentTransfer>` +
        `</filter>`,
    )
  }

  // clip path so glare/noise stay inside the shape
  defs.push(`<clipPath id="clip">${shapeEl("")}</clipPath>`)

  // --- glyph transform: native viewBox -> icon.size, centered + offset ---
  const viewBox = iconSource.viewBox || 24
  const scale = icon.size / viewBox
  const tx = S / 2 - icon.size / 2 + icon.xOffset
  const ty = S / 2 - icon.size / 2 + icon.yOffset

  const layers: string[] = []
  // fill
  layers.push(shapeEl(`fill="${fillPaint}"`))
  // glare (clipped)
  if (background.radialGlare) {
    layers.push(
      `<g clip-path="url(#clip)"><rect x="0" y="0" width="${S}" height="${S}" fill="url(#glare)"/></g>`,
    )
  }
  // noise (clipped)
  if (background.noiseTexture) {
    layers.push(
      `<g clip-path="url(#clip)"><rect x="0" y="0" width="${S}" height="${S}" filter="url(#noise)"/></g>`,
    )
  }
  // stroke outline (no fill)
  if (background.strokeSize > 0) {
    layers.push(
      shapeEl(`fill="none" stroke="${background.strokeColor}" stroke-width="${background.strokeSize}"`),
    )
  }
  // glyph: stroke icons paint with stroke (width:2 inside the scaled group so it
  // scales with the glyph); filled/brand icons paint with fill.
  const glyphPaint =
    iconSource.paint === "fill"
      ? `fill="${icon.color}"`
      : `fill="none" stroke="${icon.color}" stroke-width="2" ` +
        `stroke-linecap="round" stroke-linejoin="round"`
  layers.push(
    `<g transform="translate(${tx} ${ty}) scale(${scale})" ${glyphPaint}>${iconSource.svg}</g>`,
  )

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<defs>${defs.join("")}</defs>` +
    layers.join("") +
    `</svg>`
  )
}
