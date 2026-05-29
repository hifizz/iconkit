import type { NormalizedGlyph } from "./normalize"

// Untitled UI ships React components (no raw SVGs). Each dist/<Name>.mjs is a
// component like:
//   createElement("svg",{viewBox:"0 0 24 24",stroke:t,strokeWidth:"2",fill:"none",...},
//                 createElement("path",{d:"..."}))
// They are 24-viewBox, 2px stroke line icons. We parse the path geometry out of
// the module source and rebuild inner SVG markup.

const PKG = "@untitledui/icons"
const VERSION = "0.0.22"
const CDN = "https://cdn.jsdelivr.net/npm"
const base = `${CDN}/${PKG}@${VERSION}/dist`

const GEOM_KEYS = [
  "d",
  "points",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "x1",
  "y1",
  "x2",
  "y2",
  "rx",
  "ry",
]

/** Parse Untitled UI component source into inner SVG markup (24-viewBox stroke). */
export function parseUntitledComponent(src: string): string {
  const calls = src.matchAll(/createElement\(\s*"(\w+)"\s*,\s*\{([^}]*)\}/g)
  const parts: string[] = []
  for (const [, tag, attrsStr] of calls) {
    if (tag === "svg") continue // outer wrapper — we supply our own
    const attrs: string[] = []
    for (const key of GEOM_KEYS) {
      const m = attrsStr.match(
        new RegExp(`(?:^|,)\\s*${key}\\s*:\\s*("([^"]*)"|[\\d.]+)`),
      )
      if (m) attrs.push(`${key}="${m[2] ?? m[1]}"`)
    }
    if (attrs.length) parts.push(`<${tag} ${attrs.join(" ")}/>`)
  }
  return parts.join("")
}

let namesCache: string[] | null = null

export function getCachedUntitledNames(): string[] | null {
  if (namesCache) return namesCache
  try {
    const stored = sessionStorage.getItem(`iconkit:names:${PKG}@${VERSION}`)
    if (stored) {
      namesCache = JSON.parse(stored) as string[]
      return namesCache
    }
  } catch {
    // ignore
  }
  return null
}

/** Fetch the list of Untitled UI icon names from the package index. */
export async function fetchUntitledNames(): Promise<string[]> {
  const cached = getCachedUntitledNames()
  if (cached) return cached
  const res = await fetch(`${base}/index.mjs`)
  if (!res.ok) throw new Error(`untitled index failed: ${res.status}`)
  const src = await res.text()
  const names = [...src.matchAll(/from"\.\/([A-Za-z0-9]+)\.mjs"/g)]
    .map((m) => m[1])
    .filter((n) => n !== "index")
  const unique = [...new Set(names)].sort()
  namesCache = unique
  try {
    sessionStorage.setItem(`iconkit:names:${PKG}@${VERSION}`, JSON.stringify(unique))
  } catch {
    // ignore
  }
  return unique
}

const glyphCache = new Map<string, NormalizedGlyph>()

/** Fetch + parse a single Untitled UI icon into a glyph. */
export async function loadUntitledGlyph(name: string): Promise<NormalizedGlyph> {
  const cached = glyphCache.get(name)
  if (cached) return cached
  const res = await fetch(`${base}/${name}.mjs`)
  if (!res.ok) throw new Error(`untitled icon failed: ${res.status}`)
  const src = await res.text()
  const glyph: NormalizedGlyph = {
    svg: parseUntitledComponent(src),
    viewBox: 24,
    paint: "stroke",
  }
  glyphCache.set(name, glyph)
  return glyph
}
