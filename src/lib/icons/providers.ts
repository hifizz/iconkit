import {
  fetchIconifyCollection,
  getCachedIconifyCollection,
  iconifyUrl,
  loadIconifyGlyph,
  searchIconify,
} from "./iconify"
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
  | "material"
  | "heroicons"
  | "bootstrap"
  | "remix"
  | "solar"
  | "carbon"
  | "mdi"
  | "octicon"
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

/** A browsable first-class tab backed by a single Iconify collection (prefix). */
function iconifySetProvider(
  id: ProviderId,
  prefix: string,
  label: string,
  note?: string,
): Provider {
  return {
    id,
    label,
    searchMode: "local",
    loadAll: () => fetchIconifyCollection(prefix),
    cachedAll: () => getCachedIconifyCollection(prefix),
    thumbUrl: (name) => iconifyUrl(`${prefix}:${name}`),
    loadGlyph: (name) => loadIconifyGlyph(`${prefix}:${name}`),
    note,
  }
}

const SIMPLE_NOTE =
  "Brand logos are fine for demos / placeholders; mind trademark risk when shipping a real product logo."

export const PROVIDERS: Record<ProviderId, Provider> = {
  tabler: cdnProvider("tabler"),
  phosphor: cdnProvider("phosphor"),
  simple: cdnProvider("simple", SIMPLE_NOTE),
  feather: cdnProvider("feather"),
  material: iconifySetProvider(
    "material",
    "material-symbols",
    "Material",
    "Google Material Symbols; the -rounded / -sharp name suffix switches style.",
  ),
  heroicons: iconifySetProvider("heroicons", "heroicons", "Heroicons"),
  bootstrap: iconifySetProvider("bootstrap", "bi", "Bootstrap"),
  remix: iconifySetProvider(
    "remix",
    "ri",
    "Remix",
    "line / fill variants, distinguished by name suffix.",
  ),
  solar: iconifySetProvider(
    "solar",
    "solar",
    "Solar",
    "Multiple weights; CC license, attribute when used commercially.",
  ),
  carbon: iconifySetProvider("carbon", "carbon", "Carbon", "IBM Carbon；Apache-2.0。"),
  mdi: iconifySetProvider(
    "mdi",
    "mdi",
    "MDI",
    "Material Design Icons (community), 7000+; Apache-2.0.",
  ),
  octicon: iconifySetProvider(
    "octicon",
    "octicon",
    "Octicons",
    "GitHub's official icons; MIT.",
  ),
  iconify: {
    id: "iconify",
    label: "Iconify",
    searchMode: "remote",
    search: (q) => searchIconify(q),
    thumbUrl: (id) => iconifyUrl(id),
    loadGlyph: (id) => loadIconifyGlyph(id),
    note: "200k+ aggregated icons; type a keyword to search (needs network).",
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
