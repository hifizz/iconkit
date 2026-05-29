import type { BackgroundShape, FillType } from "@/lib/types"

export type FillPreset = {
  id: string
  type: FillType
  primary: string
  secondary: string
  angle: number
}

/**
 * Curated gradient/solid presets for the right-panel grid (ray.so-inspired).
 * Single-hue ramps use Tailwind-calibrated 400→700 stops at 135°; the multi-hue
 * and radial sets add variety. Solids stay dark since the default glyph is white.
 */
export const FILL_PRESETS: FillPreset[] = [
  // single-hue linear gradients, ordered around the hue wheel
  { id: "indigo", type: "linear", primary: "#818CF8", secondary: "#4338CA", angle: 135 },
  { id: "violet", type: "linear", primary: "#7F77DD", secondary: "#5B51C7", angle: 135 },
  { id: "purple", type: "linear", primary: "#C084FC", secondary: "#7E22CE", angle: 135 },
  { id: "fuchsia", type: "linear", primary: "#E879F9", secondary: "#A21CAF", angle: 135 },
  { id: "pink", type: "linear", primary: "#F472B6", secondary: "#BE185D", angle: 135 },
  { id: "rose", type: "linear", primary: "#FB7185", secondary: "#E11D48", angle: 135 },
  { id: "red", type: "linear", primary: "#F87171", secondary: "#DC2626", angle: 135 },
  { id: "orange", type: "linear", primary: "#FB923C", secondary: "#EA580C", angle: 135 },
  { id: "amber", type: "linear", primary: "#FBBF24", secondary: "#D97706", angle: 135 },
  { id: "lime", type: "linear", primary: "#A3E635", secondary: "#65A30D", angle: 135 },
  { id: "green", type: "linear", primary: "#4ADE80", secondary: "#16A34A", angle: 135 },
  { id: "emerald", type: "linear", primary: "#34D399", secondary: "#059669", angle: 135 },
  { id: "teal", type: "linear", primary: "#2DD4BF", secondary: "#0D9488", angle: 135 },
  { id: "cyan", type: "linear", primary: "#22D3EE", secondary: "#0891B2", angle: 135 },
  { id: "sky", type: "linear", primary: "#38BDF8", secondary: "#0284C7", angle: 135 },
  { id: "blue", type: "linear", primary: "#60A5FA", secondary: "#2563EB", angle: 135 },
  // multi-hue gradients
  { id: "sunset", type: "linear", primary: "#FB7185", secondary: "#F59E0B", angle: 120 },
  { id: "mango", type: "linear", primary: "#FACC15", secondary: "#F97316", angle: 120 },
  { id: "aurora", type: "linear", primary: "#34D399", secondary: "#3B82F6", angle: 135 },
  { id: "lagoon", type: "linear", primary: "#22D3EE", secondary: "#6366F1", angle: 135 },
  { id: "twilight", type: "linear", primary: "#818CF8", secondary: "#C084FC", angle: 135 },
  { id: "flamingo", type: "linear", primary: "#F472B6", secondary: "#FB7185", angle: 135 },
  { id: "mint", type: "linear", primary: "#6EE7B7", secondary: "#14B8A6", angle: 135 },
  // radials
  { id: "ocean", type: "radial", primary: "#22D3EE", secondary: "#2563EB", angle: 90 },
  { id: "grape", type: "radial", primary: "#C084FC", secondary: "#7C3AED", angle: 90 },
  { id: "halo", type: "radial", primary: "#FDE68A", secondary: "#F59E0B", angle: 90 },
  // neutrals + solids
  { id: "slate", type: "linear", primary: "#64748B", secondary: "#1E293B", angle: 135 },
  { id: "graphite", type: "linear", primary: "#52525B", secondary: "#18181B", angle: 135 },
  { id: "ink", type: "solid", primary: "#111827", secondary: "#111827", angle: 0 },
  { id: "royal", type: "solid", primary: "#2563EB", secondary: "#2563EB", angle: 0 },
  { id: "crimson", type: "solid", primary: "#DC2626", secondary: "#DC2626", angle: 0 },
]

export type IOSPreset = {
  id: string
  label: string
  primary: string
  secondary: string
  type: FillType
  angle: number
}

/**
 * iOS-flavored background presets. Selecting one switches the background shape
 * to `squircle`. Colors mimic typical iOS app-icon palettes.
 */
export const IOS_PRESETS: IOSPreset[] = [
  { id: "ios-blue", label: "Blue", type: "linear", primary: "#3B82F6", secondary: "#1D4ED8", angle: 135 },
  { id: "ios-green", label: "Green", type: "linear", primary: "#34D399", secondary: "#059669", angle: 135 },
  { id: "ios-pink", label: "Pink", type: "linear", primary: "#FB7185", secondary: "#E11D48", angle: 135 },
  { id: "ios-orange", label: "Orange", type: "linear", primary: "#FBBF24", secondary: "#F97316", angle: 135 },
  { id: "ios-graphite", label: "Graphite", type: "linear", primary: "#4B5563", secondary: "#1F2937", angle: 135 },
]

export const IOS_SHAPE: BackgroundShape = "squircle"

const SQUIRCLE_N = 5 // superellipse exponent — iOS "continuous corner" feel
const SQUIRCLE_STEPS = 96

/**
 * iOS-style superellipse (|x|^n + |y|^n = 1) squircle path for a `size`×`size`
 * box. Near-flat sides with smooth continuous corners. Deterministic (pure math,
 * fixed step count, rounded coords) so identical input yields identical output.
 */
export function squirclePath(size: number): string {
  const c = size / 2
  const r = size / 2
  const exp = 2 / SQUIRCLE_N
  const pts: string[] = []
  for (let i = 0; i <= SQUIRCLE_STEPS; i++) {
    const t = (i / SQUIRCLE_STEPS) * 2 * Math.PI
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const x = c + r * Math.sign(ct) * Math.abs(ct) ** exp
    const y = c + r * Math.sign(st) * Math.abs(st) ** exp
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return "M" + pts.join(" L") + " Z"
}
