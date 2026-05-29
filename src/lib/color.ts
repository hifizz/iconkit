const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Validate a hex color string (#rgb / #rrggbb, with or without leading #). */
export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim())
}

/** Normalize to #rrggbb uppercase. Returns null if invalid. */
export function normalizeHex(value: string): string | null {
  const v = value.trim()
  if (!HEX_RE.test(v)) return null
  let hex = v.startsWith("#") ? v.slice(1) : v
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  return "#" + hex.toUpperCase()
}
