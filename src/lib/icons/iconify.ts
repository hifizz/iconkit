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

type CollectionResponse = {
  uncategorized?: string[]
  categories?: Record<string, string[]>
}

/** Flatten an Iconify /collection response into a sorted, de-duped name list. */
export function collectionNames(json: CollectionResponse): string[] {
  const names = [
    ...(json.uncategorized ?? []),
    ...Object.values(json.categories ?? {}).flat(),
  ]
  return [...new Set(names)].sort()
}

const collectionCache = new Map<string, string[]>()
const collectionKey = (prefix: string) => `iconkit:names:iconify:${prefix}`

/** Synchronously return a cached Iconify collection name list, or null. */
export function getCachedIconifyCollection(prefix: string): string[] | null {
  const mem = collectionCache.get(prefix)
  if (mem) return mem
  try {
    const stored = sessionStorage.getItem(collectionKey(prefix))
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      collectionCache.set(prefix, parsed)
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

/** Fetch every icon name in an Iconify collection (e.g. "material-symbols"). */
export async function fetchIconifyCollection(prefix: string): Promise<string[]> {
  const cached = getCachedIconifyCollection(prefix)
  if (cached) return cached
  const res = await fetch(`${API}/collection?prefix=${encodeURIComponent(prefix)}`)
  if (!res.ok) throw new Error(`iconify collection failed: ${res.status}`)
  const names = collectionNames((await res.json()) as CollectionResponse)
  collectionCache.set(prefix, names)
  try {
    sessionStorage.setItem(collectionKey(prefix), JSON.stringify(names))
  } catch {
    // ignore quota / unavailable
  }
  return names
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
