import type { BackgroundShape, FillType } from "@/lib/types"

export type FillPreset = {
  id: string
  type: FillType
  primary: string
  secondary: string
  angle: number
}

/** ray.so-style gradient/solid presets for the right-panel grid. */
export const FILL_PRESETS: FillPreset[] = [
  { id: "violet", type: "linear", primary: "#7F77DD", secondary: "#5B51C7", angle: 135 },
  { id: "emerald", type: "linear", primary: "#34D399", secondary: "#1D9E75", angle: 135 },
  { id: "rose", type: "linear", primary: "#F472B6", secondary: "#D4537E", angle: 135 },
  { id: "sky", type: "linear", primary: "#60A5FA", secondary: "#378ADD", angle: 135 },
  { id: "amber", type: "linear", primary: "#FBBF24", secondary: "#EF9F27", angle: 135 },
  { id: "slate", type: "linear", primary: "#475569", secondary: "#1E293B", angle: 135 },
  { id: "sunset", type: "linear", primary: "#FB7185", secondary: "#F59E0B", angle: 120 },
  { id: "ocean", type: "radial", primary: "#22D3EE", secondary: "#2563EB", angle: 90 },
  { id: "grape", type: "radial", primary: "#C084FC", secondary: "#7C3AED", angle: 90 },
  { id: "ink", type: "solid", primary: "#111827", secondary: "#111827", angle: 0 },
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
