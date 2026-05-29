import dynamicIconImports from "lucide-react/dist/esm/dynamicIconImports.mjs"

export type IconNode = [tag: string, attrs: Record<string, string | number>][]

/** All available lucide icon names (kebab-case). Used for the grid + search. */
export const lucideNames: string[] = Object.keys(dynamicIconImports)

/**
 * Serialize a lucide iconNode array to inner SVG markup (no <svg> wrapper).
 * Drops the React-only `key` attribute. Pure — safe for snapshot tests.
 */
export function iconNodeToInnerSvg(node: IconNode): string {
  return node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ")
      return `<${tag} ${a}/>`
    })
    .join("")
}

const glyphCache = new Map<string, string>()

/** Lazily load a lucide glyph's inner SVG markup by name. */
export async function loadLucideGlyph(name: string): Promise<string> {
  const cached = glyphCache.get(name)
  if (cached) return cached
  const loader = dynamicIconImports[name]
  if (!loader) throw new Error(`Unknown lucide icon: ${name}`)
  const mod = await loader()
  const inner = iconNodeToInnerSvg(mod.__iconNode as IconNode)
  glyphCache.set(name, inner)
  return inner
}

/** Lucide glyphs are 24-viewBox stroke icons. */
export const LUCIDE_VIEWBOX = 24
export const LUCIDE_PAINT = "stroke" as const

/** Fuzzy-ish filter by substring; returns up to `limit` names. */
export function searchLucide(query: string, limit = 120): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return lucideNames.slice(0, limit)
  const out: string[] = []
  for (const name of lucideNames) {
    if (name.includes(q)) {
      out.push(name)
      if (out.length >= limit) break
    }
  }
  return out
}
