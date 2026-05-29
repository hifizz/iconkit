export type NormalizedGlyph = {
  /** Inner markup with no <svg> wrapper, <title>, <desc>, or scripts. */
  svg: string
  /** Native square viewBox edge. */
  viewBox: number
  paint: "stroke" | "fill"
}

const VIEWBOX_RE = /viewBox\s*=\s*["']\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*["']/i

/**
 * Parse a raw <svg> string into a normalized glyph: inner markup, square
 * viewBox edge, and paint mode. Pure string work (regex) so it runs in node
 * for tests and never touches the DOM. `paintHint` overrides detection when a
 * library's mode is known up front.
 */
export function normalizeSvg(
  raw: string,
  paintHint?: "stroke" | "fill",
): NormalizedGlyph {
  // viewBox edge (assume square; fall back to width or 24)
  let viewBox = 24
  const vb = raw.match(VIEWBOX_RE)
  if (vb) {
    viewBox = Math.max(Number(vb[1]), Number(vb[2])) || 24
  } else {
    const w = raw.match(/\bwidth\s*=\s*["']?([\d.]+)/i)
    if (w) viewBox = Number(w[1]) || 24
  }

  // detect paint from the root <svg ...> attributes before stripping it
  const openTag = raw.match(/<svg[^>]*>/i)?.[0] ?? ""
  let paint: "stroke" | "fill"
  if (paintHint) {
    paint = paintHint
  } else {
    const hasNoneFill = /fill\s*=\s*["']none["']/i.test(openTag)
    const hasStroke = /stroke\s*=\s*["'](?!none)/i.test(openTag)
    paint = hasNoneFill || hasStroke ? "stroke" : "fill"
  }

  // inner = between the opening <svg ...> and closing </svg>
  let inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg\s*>[\s\S]*$/i, "")

  // drop accessibility/metadata nodes that aren't glyph geometry
  inner = inner
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<desc[\s\S]*?<\/desc>/gi, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .trim()

  return { svg: inner, viewBox, paint }
}

const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi
const EVENT_ATTR_RE = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const FOREIGN_RE = /<foreignObject[\s\S]*?<\/foreignObject>/gi
// external references (http/https) in href/src/url() — strip to block leaks
const EXTERNAL_REF_RE =
  /\s(?:xlink:href|href|src)\s*=\s*("https?:[^"]*"|'https?:[^']*'|https?:[^\s>]+)/gi

/**
 * Sanitize an untrusted (uploaded) SVG: remove scripts, event handlers,
 * foreignObject, and external references. Returns null if the result isn't a
 * usable <svg>. Does not normalize — call normalizeSvg afterwards.
 */
export function sanitizeUploadedSvg(raw: string): string | null {
  if (!/<svg[\s\S]*<\/svg>/i.test(raw)) return null
  const cleaned = raw
    .replace(SCRIPT_RE, "")
    .replace(FOREIGN_RE, "")
    .replace(EVENT_ATTR_RE, "")
    .replace(EXTERNAL_REF_RE, "")
  if (/<script|javascript:/i.test(cleaned)) return null
  return cleaned
}
