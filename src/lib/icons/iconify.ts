import { normalizeSvg, type NormalizedGlyph } from "./normalize"

const API = "https://api.iconify.design"

/**
 * Iconify is an aggregator of 200k+ icons across 150+ sets, reached through an
 * HTTP API. Unlike the bundled/CDN-listing libraries there is no full name list
 * to fetch — we query the search endpoint on demand. Icon ids look like
 * "mdi:home" / "feather:rocket".
 */

/** Public SVG URL for an icon id — usable directly as an <img> src. */
export function iconifyUrl(id: string): string {
  const [prefix, name] = id.split(":")
  return `${API}/${prefix}/${name}.svg`
}

/** Search Iconify for icon ids matching a query. */
export async function searchIconify(query: string, limit = 120): Promise<string[]> {
  const q = query.trim()
  if (!q) return []
  const res = await fetch(`${API}/search?query=${encodeURIComponent(q)}&limit=${limit}`)
  if (!res.ok) throw new Error(`iconify search failed: ${res.status}`)
  const json = (await res.json()) as { icons?: string[] }
  return json.icons ?? []
}

const glyphCache = new Map<string, NormalizedGlyph>()

/** Fetch + normalize a single Iconify icon by id (prefix:name). */
export async function loadIconifyGlyph(id: string): Promise<NormalizedGlyph> {
  const cached = glyphCache.get(id)
  if (cached) return cached
  const res = await fetch(iconifyUrl(id))
  if (!res.ok) throw new Error(`iconify icon failed: ${res.status}`)
  const raw = await res.text()
  const glyph = normalizeSvg(raw) // mixed stroke/fill across sets — auto-detect
  glyphCache.set(id, glyph)
  return glyph
}
