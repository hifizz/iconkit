import { normalizeSvg, type NormalizedGlyph } from "./normalize"

export type CdnLibId = "tabler" | "phosphor" | "simple" | "feather"

type LibConfig = {
  id: CdnLibId
  label: string
  pkg: string
  version: string
  /** Path prefix within the package where the SVGs live. */
  dir: string
  paint: "stroke" | "fill"
}

export const CDN_LIBS: Record<CdnLibId, LibConfig> = {
  tabler: {
    id: "tabler",
    label: "Tabler",
    pkg: "@tabler/icons",
    version: "3.44.0",
    dir: "/icons/outline/",
    paint: "stroke",
  },
  phosphor: {
    id: "phosphor",
    label: "Phosphor",
    pkg: "@phosphor-icons/core",
    version: "2.1.1",
    dir: "/assets/regular/",
    paint: "fill",
  },
  simple: {
    id: "simple",
    label: "Simple",
    pkg: "simple-icons",
    version: "16.21.0",
    dir: "/icons/",
    paint: "fill",
  },
  feather: {
    id: "feather",
    label: "Feather",
    pkg: "feather-icons",
    version: "4.29.2",
    dir: "/dist/icons/",
    paint: "stroke",
  },
}

const CDN = "https://cdn.jsdelivr.net/npm"
const DATA = "https://data.jsdelivr.com/v1/packages/npm"

/** Public CDN URL for an icon's SVG file (used directly as <img> src too). */
export function svgUrl(lib: CdnLibId, name: string): string {
  const c = CDN_LIBS[lib]
  return `${CDN}/${c.pkg}@${c.version}${c.dir}${name}.svg`
}

const namesCache = new Map<CdnLibId, string[]>()

/**
 * Synchronously return the cached name list for a library if we already have it
 * (memory, or a prior session in sessionStorage). Lets the picker skip the
 * loading flash when revisiting a library. Returns null if not yet loaded.
 */
export function getCachedNames(lib: CdnLibId): string[] | null {
  const mem = namesCache.get(lib)
  if (mem) return mem
  const c = CDN_LIBS[lib]
  try {
    const stored = sessionStorage.getItem(`iconkit:names:${c.pkg}@${c.version}`)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      namesCache.set(lib, parsed)
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Fetch the list of icon names for a CDN library via jsDelivr's flat file
 * listing. Cached in memory + sessionStorage. Throws on network failure so the
 * caller can fall back to Lucide (prd.md §6).
 */
export async function fetchLibNames(lib: CdnLibId): Promise<string[]> {
  const mem = namesCache.get(lib)
  if (mem) return mem

  const c = CDN_LIBS[lib]
  const storeKey = `iconkit:names:${c.pkg}@${c.version}`
  try {
    const stored = sessionStorage.getItem(storeKey)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      namesCache.set(lib, parsed)
      return parsed
    }
  } catch {
    // sessionStorage unavailable — fall through to network
  }

  const res = await fetch(`${DATA}/${c.pkg}@${c.version}?structure=flat`)
  if (!res.ok) throw new Error(`listing failed: ${res.status}`)
  const json = (await res.json()) as { files: { name: string }[] }
  const names = json.files
    .filter((f) => f.name.startsWith(c.dir) && f.name.endsWith(".svg"))
    .map((f) => f.name.slice(c.dir.length, -4))
    .sort()

  namesCache.set(lib, names)
  try {
    sessionStorage.setItem(storeKey, JSON.stringify(names))
  } catch {
    // ignore quota / unavailable
  }
  return names
}

const glyphCache = new Map<string, NormalizedGlyph>()

/** Fetch + normalize a single CDN icon into a glyph ready for IconState. */
export async function loadCdnGlyph(
  lib: CdnLibId,
  name: string,
): Promise<NormalizedGlyph> {
  const key = `${lib}/${name}`
  const cached = glyphCache.get(key)
  if (cached) return cached
  const res = await fetch(svgUrl(lib, name))
  if (!res.ok) throw new Error(`icon fetch failed: ${res.status}`)
  const raw = await res.text()
  const glyph = normalizeSvg(raw, CDN_LIBS[lib].paint)
  glyphCache.set(key, glyph)
  return glyph
}

export function searchNames(names: string[], query: string, limit = 120): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return names.slice(0, limit)
  const out: string[] = []
  for (const n of names) {
    if (n.toLowerCase().includes(q)) {
      out.push(n)
      if (out.length >= limit) break
    }
  }
  return out
}
