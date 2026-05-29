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

/**
 * iOS-style superellipse (|x|^5 + |y|^5 = 1) squircle path in a 0..512 box.
 * Near-flat sides with smooth continuous corners — the iOS app-icon look.
 * Static constant — never recomputed per render (keeps SVG output deterministic).
 */
export const SQUIRCLE_PATH_512 =
  "M512 256 L511.78 342 L511.12 369.38 L510.02 389.15 L508.47 405.09 L506.48 418.58 L504.02 430.33 L501.09 440.72 L497.69 450.01 L493.78 458.37 L489.36 465.9 L484.4 472.71 L478.86 478.86 L472.71 484.4 L465.9 489.36 L458.37 493.78 L450.01 497.69 L440.72 501.09 L430.33 504.02 L418.58 506.48 L405.09 508.47 L389.15 510.02 L369.38 511.12 L342 511.78 L256 512 L170 511.78 L142.62 511.12 L122.85 510.02 L106.91 508.47 L93.42 506.48 L81.67 504.02 L71.28 501.09 L61.99 497.69 L53.63 493.78 L46.1 489.36 L39.29 484.4 L33.14 478.86 L27.6 472.71 L22.64 465.9 L18.22 458.37 L14.31 450.01 L10.91 440.72 L7.98 430.33 L5.52 418.58 L3.53 405.09 L1.98 389.15 L0.88 369.38 L0.22 342 L0 256 L0.22 170 L0.88 142.62 L1.98 122.85 L3.53 106.91 L5.52 93.42 L7.98 81.67 L10.91 71.28 L14.31 61.99 L18.22 53.63 L22.64 46.1 L27.6 39.29 L33.14 33.14 L39.29 27.6 L46.1 22.64 L53.63 18.22 L61.99 14.31 L71.28 10.91 L81.67 7.98 L93.42 5.52 L106.91 3.53 L122.85 1.98 L142.62 0.88 L170 0.22 L256 0 L342 0.22 L369.38 0.88 L389.15 1.98 L405.09 3.53 L418.58 5.52 L430.33 7.98 L440.72 10.91 L450.01 14.31 L458.37 18.22 L465.9 22.64 L472.71 27.6 L478.86 33.14 L484.4 39.29 L489.36 46.1 L493.78 53.63 L497.69 61.99 L501.09 71.28 L504.02 81.67 L506.48 93.42 L508.47 106.91 L510.02 122.85 L511.12 142.62 L511.78 170 L512 256 Z"
