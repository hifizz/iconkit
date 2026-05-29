import { iconifyUrl, loadIconifyGlyph, searchIconify } from "./iconify"
import type { NormalizedGlyph } from "./normalize"
import {
  CDN_LIBS,
  fetchLibNames,
  getCachedNames,
  loadCdnGlyph,
  svgUrl,
  type CdnLibId,
} from "./registry"
import { fetchUntitledNames, getCachedUntitledNames, loadUntitledGlyph } from "./untitled"

export type ProviderId =
  | "tabler"
  | "phosphor"
  | "simple"
  | "feather"
  | "iconify"
  | "untitled"

export type Provider = {
  id: ProviderId
  label: string
  /** "local": fetch the full name list once + filter client-side. "remote": query an API per search. */
  searchMode: "local" | "remote"
  /** local: full name list (cached across switches). */
  loadAll?: () => Promise<string[]>
  /** local: synchronously available cached list, to skip the loading flash. */
  cachedAll?: () => string[] | null
  /** remote: query → matching names/ids. */
  search?: (query: string) => Promise<string[]>
  /** Thumbnail URL, or null when the thumbnail must be rendered inline from the glyph. */
  thumbUrl: (name: string) => string | null
  loadGlyph: (name: string) => Promise<NormalizedGlyph>
  note?: string
}

function cdnProvider(id: CdnLibId, note?: string): Provider {
  return {
    id,
    label: CDN_LIBS[id].label,
    searchMode: "local",
    loadAll: () => fetchLibNames(id),
    cachedAll: () => getCachedNames(id),
    thumbUrl: (name) => svgUrl(id, name),
    loadGlyph: (name) => loadCdnGlyph(id, name),
    note,
  }
}

const SIMPLE_NOTE = "品牌 logo 适合 demo / 占位；正式发布产品 logo 请注意商标风险。"

export const PROVIDERS: Record<ProviderId, Provider> = {
  tabler: cdnProvider("tabler"),
  phosphor: cdnProvider("phosphor"),
  simple: cdnProvider("simple", SIMPLE_NOTE),
  feather: cdnProvider("feather"),
  iconify: {
    id: "iconify",
    label: "Iconify",
    searchMode: "remote",
    search: (q) => searchIconify(q),
    thumbUrl: (id) => iconifyUrl(id),
    loadGlyph: (id) => loadIconifyGlyph(id),
    note: "200k+ 图标聚合，输入关键词搜索（需要网络）。",
  },
  untitled: {
    id: "untitled",
    label: "Untitled UI",
    searchMode: "local",
    loadAll: () => fetchUntitledNames(),
    cachedAll: () => getCachedUntitledNames(),
    thumbUrl: () => null, // no SVG endpoint — render inline from parsed glyph
    loadGlyph: (name) => loadUntitledGlyph(name),
  },
}
