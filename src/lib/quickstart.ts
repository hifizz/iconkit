import { lucideNames, searchLucide } from "@/lib/icons/lucide"
import { FILL_PRESETS } from "@/lib/presets"

// Deterministic keyword → lucide glyph. No image generation, just a synonym
// table + name matching (prd.md §4.6). First matching rule wins.
const SYNONYMS: { keys: string[]; icon: string }[] = [
  { keys: ["shop", "store", "ecommerce", "commerce", "cart", "buy"], icon: "shopping-bag" },
  { keys: ["chat", "message", "talk", "dm", "im"], icon: "message-circle" },
  { keys: ["music", "audio", "song", "sound", "podcast"], icon: "music" },
  { keys: ["photo", "camera", "image", "picture", "gallery"], icon: "camera" },
  { keys: ["code", "dev", "api", "program", "compiler"], icon: "code" },
  { keys: ["cloud", "saas", "hosting"], icon: "cloud" },
  { keys: ["rocket", "launch", "startup", "boost", "ship"], icon: "rocket" },
  { keys: ["book", "blog", "docs", "read", "wiki", "note"], icon: "book-open" },
  { keys: ["game", "play", "arcade"], icon: "gamepad-2" },
  { keys: ["finance", "money", "bank", "pay", "wallet", "crypto"], icon: "wallet" },
  { keys: ["mail", "email", "inbox", "newsletter"], icon: "mail" },
  { keys: ["calendar", "event", "schedule", "date"], icon: "calendar" },
  { keys: ["map", "location", "place", "geo", "travel"], icon: "map-pin" },
  { keys: ["ai", "bot", "robot", "agent", "ml", "gpt"], icon: "bot" },
  { keys: ["health", "fitness", "medical", "care"], icon: "heart-pulse" },
  { keys: ["lock", "security", "auth", "secure", "vault", "privacy"], icon: "lock" },
  { keys: ["setting", "config", "admin", "control"], icon: "settings" },
  { keys: ["dashboard", "analytics", "chart", "stats", "metric", "report"], icon: "bar-chart-3" },
  { keys: ["search", "find", "explore", "discover"], icon: "search" },
  { keys: ["video", "stream", "movie", "film", "tv"], icon: "video" },
  { keys: ["file", "document", "pdf", "paper"], icon: "file-text" },
  { keys: ["user", "profile", "account", "people", "social", "team"], icon: "users" },
  { keys: ["home", "house", "dashboard", "landing"], icon: "house" },
  { keys: ["star", "favorite", "premium", "pro", "vip"], icon: "star" },
  { keys: ["bell", "notification", "alert", "remind"], icon: "bell" },
  { keys: ["terminal", "cli", "shell", "console", "command"], icon: "terminal" },
  { keys: ["database", "db", "data", "storage", "sql"], icon: "database" },
  { keys: ["package", "box", "ship", "deliver", "logistics"], icon: "package" },
  { keys: ["fast", "bolt", "speed", "energy", "power", "zap"], icon: "zap" },
  { keys: ["weather", "sun", "forecast"], icon: "sun" },
  { keys: ["food", "eat", "restaurant", "recipe", "kitchen"], icon: "utensils" },
  { keys: ["coffee", "cafe", "tea"], icon: "coffee" },
  { keys: ["paint", "design", "art", "draw", "color"], icon: "palette" },
  { keys: ["link", "url", "share", "connect"], icon: "link" },
  { keys: ["flag", "goal", "mission", "todo", "task"], icon: "flag" },
]

const FALLBACK_ICON = "sparkles"

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Deterministic 32-bit string hash (FNV-1a style). */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type QuickMatch = { iconName: string; presetId: string }

/**
 * Map a project name / keyword to a deterministic lucide glyph + color preset.
 * Same input always yields the same result. Never calls an image model.
 */
export function matchKeyword(input: string): QuickMatch {
  const tokens = tokenize(input)
  const presetId = FILL_PRESETS[hashString(input || "icon") % FILL_PRESETS.length].id

  // 1. synonym table
  for (const token of tokens) {
    for (const rule of SYNONYMS) {
      if (rule.keys.some((k) => token === k || token.includes(k) || k.includes(token))) {
        return { iconName: rule.icon, presetId }
      }
    }
  }
  // 2. exact lucide name
  for (const token of tokens) {
    if (lucideNames.includes(token)) return { iconName: token, presetId }
  }
  // 3. lucide substring match
  for (const token of tokens) {
    if (token.length < 3) continue
    const hit = searchLucide(token, 1)[0]
    if (hit) return { iconName: hit, presetId }
  }
  return { iconName: FALLBACK_ICON, presetId }
}

/** Slugify a keyword into a filename stem (no extension). */
export function slugifyFilename(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "icon"
}
