import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Upload } from "lucide-react"
import { DynamicIcon } from "lucide-react/dynamic"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Input } from "@/components/ui/input"
import { loadLucideGlyph, lucideNames, searchLucide } from "@/lib/icons/lucide"
import { normalizeSvg, sanitizeUploadedSvg, type NormalizedGlyph } from "@/lib/icons/normalize"
import { PROVIDERS, type Provider, type ProviderId } from "@/lib/icons/providers"
import { searchNames } from "@/lib/icons/registry"
import type { IconLib } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePatch, useIconState } from "@/state/iconStore"

const LIBS: { id: IconLib; label: string }[] = [
  { id: "lucide", label: "Lucide" },
  { id: "tabler", label: "Tabler" },
  { id: "phosphor", label: "Phosphor" },
  { id: "feather", label: "Feather" },
  { id: "simple", label: "Simple" },
  { id: "material", label: "Material" },
  { id: "heroicons", label: "Heroicons" },
  { id: "bootstrap", label: "Bootstrap" },
  { id: "remix", label: "Remix" },
  { id: "solar", label: "Solar" },
  { id: "carbon", label: "Carbon" },
  { id: "mdi", label: "MDI" },
  { id: "octicon", label: "Octicons" },
  { id: "untitled", label: "Untitled UI" },
  { id: "iconify", label: "Iconify" },
  { id: "upload", label: "SVG" },
]

/** Picker tab id: a real library, the upload pseudo-tab, or the cross-library "全部". */
type TabId = IconLib | "all"

const TABS: { id: TabId; label: string }[] = [{ id: "all", label: "全部" }, ...LIBS]

// Libraries the "全部" search spans: every local source. Remote Iconify (a 200k
// aggregator that overlaps these) and the upload pseudo-tab are excluded.
const GLOBAL_LIBS = LIBS.filter((l) => l.id !== "iconify" && l.id !== "upload")

/** Names for a global-search library: lucide is bundled; the rest come from the cache map. */
function namesForLib(id: IconLib, loaded: Record<string, string[]>): string[] | null {
  if (id === "lucide") return lucideNames
  return loaded[id] ?? null
}

const MAX_UPLOAD_BYTES = 100 * 1024
const PER_GROUP = 24

/** Inline SVG markup for a thumbnail rendered from a parsed glyph (no img URL). */
function inlineThumb(g: NormalizedGlyph): string {
  const paint =
    g.paint === "fill"
      ? 'fill="currentColor"'
      : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  return `<svg viewBox="0 0 ${g.viewBox} ${g.viewBox}" width="16" height="16" ${paint}>${g.svg}</svg>`
}

function IconThumb({ provider, name }: { provider: Provider; name: string }) {
  const url = provider.thumbUrl(name)
  const [inner, setInner] = useState<string | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  // Inline thumbnails (no URL, e.g. Untitled UI) must fetch + parse their source,
  // so only load them once scrolled into view to avoid a fetch storm.
  useEffect(() => {
    if (url) return
    const el = ref.current
    if (!el) return
    let cancelled = false
    const load = () => {
      provider
        .loadGlyph(name)
        .then((g) => !cancelled && setInner(inlineThumb(g)))
        .catch(() => {})
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          load()
        }
      },
      { root: el.closest("[data-grid-scroll]"), rootMargin: "200px" },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [provider, name, url])

  if (url) {
    return (
      <img src={url} alt={name} loading="lazy" className="size-4 dark:invert" />
    )
  }
  return (
    <span
      ref={ref}
      className="flex size-4 text-foreground [&_svg]:size-4"
      dangerouslySetInnerHTML={inner ? { __html: inner } : undefined}
    />
  )
}

export function LeftPicker() {
  const state = useIconState()
  const patch = usePatch()
  const [activeLib, setActiveLib] = useState<TabId>("all")
  const [query, setQuery] = useState("")
  // Cross-library search: each local library's full name list, filled lazily.
  const [globalNames, setGlobalNames] = useState<Record<string, string[]>>({})

  const provider: Provider | null =
    activeLib in PROVIDERS ? PROVIDERS[activeLib as ProviderId] : null

  // Names are keyed by the provider they belong to, so a switch never renders
  // one provider's names mapped onto another provider's URLs (would 404).
  const [local, setLocal] = useState<{ id: ProviderId | null; names: string[] }>({
    id: null,
    names: [],
  })
  const [remoteResults, setRemoteResults] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Local providers: load the full name list once per library (cache-aware).
  useEffect(() => {
    if (!provider || provider.searchMode !== "local") {
      setStatus("idle")
      return
    }
    let cancelled = false
    const id = provider.id
    const cached = provider.cachedAll?.()
    if (cached) {
      setLocal({ id, names: cached })
      setStatus("idle")
      return
    }
    setLocal({ id, names: [] })
    setStatus("loading")
    provider
      .loadAll!()
      .then((names) => {
        if (cancelled) return
        setLocal({ id, names })
        setStatus("idle")
      })
      .catch(() => {
        if (cancelled) return
        setStatus("error")
        setLocal({ id, names: [] })
      })
    return () => {
      cancelled = true
    }
  }, [provider])

  // Remote providers (Iconify): debounced search per query.
  useEffect(() => {
    if (!provider || provider.searchMode !== "remote") return
    const q = query.trim()
    if (!q) {
      setRemoteResults([])
      setStatus("idle")
      return
    }
    setStatus("loading")
    let cancelled = false
    const t = setTimeout(() => {
      provider
        .search!(q)
        .then((r) => {
          if (cancelled) return
          setRemoteResults(r)
          setStatus("idle")
        })
        .catch(() => {
          if (cancelled) return
          setStatus("error")
          setRemoteResults([])
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [provider, query])

  // No row cap: the grid is virtualized (only visible rows mount), so the full
  // collection — Solar/MDI have 7k+ — can flow in without flooding the DOM/CDN.
  const lucideResults = useMemo(
    () => (activeLib === "lucide" ? searchLucide(query, Infinity) : []),
    [activeLib, query],
  )
  const providerResults = useMemo(() => {
    if (!provider) return []
    if (provider.searchMode === "remote") return remoteResults
    // only use names that belong to the active provider
    const names = local.id === provider.id ? local.names : []
    return searchNames(names, query, Infinity)
  }, [provider, remoteResults, local, query])

  // "全部" mode: ensure every local library's name list is loaded (cache-aware,
  // so each fires its network listing at most once across the session). Groups
  // fill in progressively as lists arrive.
  useEffect(() => {
    if (activeLib !== "all") return
    let cancelled = false
    for (const { id } of GLOBAL_LIBS) {
      if (id === "lucide") continue // bundled, always available
      const p = PROVIDERS[id as ProviderId]
      if (!p?.loadAll) continue
      const cached = p.cachedAll?.()
      if (cached) {
        setGlobalNames((s) => (s[id] ? s : { ...s, [id]: cached }))
        continue
      }
      p.loadAll()
        .then((names) => {
          if (!cancelled) setGlobalNames((s) => ({ ...s, [id]: names }))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [activeLib])

  // Grouped cross-library results: one block per library, each capped.
  const groups = useMemo(() => {
    if (activeLib !== "all") return []
    const q = query.trim()
    if (!q) return []
    return GLOBAL_LIBS.map(({ id, label }) => {
      const names = namesForLib(id, globalNames)
      if (!names) return { id, label, names: [] as string[], more: false, pending: true }
      const matches = searchNames(names, q, PER_GROUP + 1)
      return {
        id,
        label,
        names: matches.slice(0, PER_GROUP),
        more: matches.length > PER_GROUP,
        pending: false,
      }
    }).filter((g) => g.pending || g.names.length > 0)
  }, [activeLib, query, globalNames])

  // Unified grid items for the active library (lucide or any provider).
  const gridItems = useMemo(() => {
    if (activeLib === "lucide") return lucideResults
    if (provider && status === "idle") return providerResults
    return []
  }, [activeLib, provider, status, lucideResults, providerResults])

  // Row virtualization. The left panel is a fixed-width column; a 4-col grid of
  // square cells means row height = cell width + gap, measured off the scroll
  // container so it tracks any width change.
  const GRID_COLS = 4
  const GRID_GAP = 6 // gap-1.5 = 0.375rem
  const scrollRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState(53)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      const content = el.clientWidth - 24 // px-3 both sides
      if (content <= 0) return
      const cell = (content - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS
      setRowHeight(Math.round(cell + GRID_GAP))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rowCount = Math.ceil(gridItems.length / GRID_COLS)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  })
  useEffect(() => rowVirtualizer.measure(), [rowHeight, rowVirtualizer])
  // Reset scroll to the top when the visible set changes (library / query).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [activeLib, query])

  async function pickLucide(name: string) {
    const svg = await loadLucideGlyph(name)
    patch({ iconSource: { lib: "lucide", name, svg, viewBox: 24, paint: "stroke" } })
  }

  async function pickProvider(p: Provider, name: string) {
    try {
      const g = await p.loadGlyph(name)
      patch({ iconSource: { lib: p.id, name, svg: g.svg, viewBox: g.viewBox, paint: g.paint } })
    } catch {
      setStatus("error")
    }
  }

  // A single icon cell, shared by the virtualized single-library grid and the
  // grouped "全部" view. Lucide renders via DynamicIcon; everything else via the
  // provider's (lazy) thumbnail.
  function renderCell(libId: IconLib, name: string) {
    const p = libId === "lucide" ? null : (PROVIDERS[libId as ProviderId] ?? null)
    const selected =
      state.iconSource.lib === libId && state.iconSource.name === name
    return (
      <button
        key={`${libId}:${name}`}
        type="button"
        onClick={() =>
          libId === "lucide" ? void pickLucide(name) : p && void pickProvider(p, name)
        }
        title={name}
        className={cn(
          "flex aspect-square items-center justify-center rounded-md p-2 transition-colors",
          selected ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted",
        )}
      >
        {libId === "lucide" ? (
          <DynamicIcon name={name as never} size={16} />
        ) : (
          p && <IconThumb provider={p} name={name} />
        )}
      </button>
    )
  }

  async function onUpload(file: File) {
    setUploadError(null)
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("文件过大（上限 100KB）")
      return
    }
    const raw = await file.text()
    const cleaned = sanitizeUploadedSvg(raw)
    if (!cleaned) {
      setUploadError("不是合法的 SVG，或包含不允许的内容")
      return
    }
    const g = normalizeSvg(cleaned)
    patch({
      iconSource: {
        lib: "upload",
        name: file.name.replace(/\.svg$/i, ""),
        svg: g.svg,
        viewBox: g.viewBox,
        paint: g.paint,
      },
    })
  }

  const note = provider?.note
  const searchPlaceholder =
    activeLib === "all"
      ? "搜索全部图标库"
      : provider?.searchMode === "remote"
        ? "搜索 Iconify…"
        : "搜索图标"

  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="flex flex-col gap-3 p-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-xs"
            disabled={activeLib === "upload"}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TABS.map((lib) => (
            <button
              key={lib.id}
              type="button"
              onClick={() => {
                setActiveLib(lib.id)
                setQuery("")
              }}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors",
                activeLib === lib.id
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground hover:text-foreground",
              )}
            >
              {lib.id === "upload" && <Upload className="size-3" />}
              {lib.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload panel */}
      {activeLib === "upload" ? (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Upload className="size-5" />
            点击上传 SVG 文件
            <span className="text-[10px]">已自动清洗脚本 / 外链 / 事件属性 · 上限 100KB</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onUpload(f)
              e.target.value = ""
            }}
          />
          {uploadError && <p className="text-[11px] text-destructive">{uploadError}</p>}
          {state.iconSource.lib === "upload" && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
              已载入：{state.iconSource.name || "uploaded.svg"}
            </p>
          )}
        </div>
      ) : (
        <>
          {(note || status !== "idle") && (
            <div className="flex flex-col gap-2 px-3 pb-2">
              {note && (
                <p className="rounded-md bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  {note}
                </p>
              )}
              {status === "loading" && (
                <p className="text-xs text-muted-foreground">加载中…</p>
              )}
              {status === "error" && (
                <p className="text-xs text-destructive">
                  该图标库暂不可用（需要网络），请稍后重试或改用 Lucide。
                </p>
              )}
            </div>
          )}

          {provider?.searchMode === "remote" && !query.trim() && status === "idle" && (
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              输入关键词搜索 20 万+ 图标。
            </p>
          )}

          {activeLib === "all" && !query.trim() && (
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              输入关键词，一次搜索全部精选图标库（不含 Iconify）。
            </p>
          )}

          <div
            ref={scrollRef}
            data-grid-scroll
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          >
            {/* "全部"：按图标库分组展示结果 */}
            {activeLib === "all" && query.trim() && (
              <div className="flex flex-col gap-4">
                {groups.map((g) => (
                  <section key={g.id}>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                      <span>{g.label}</span>
                      {!g.pending && (
                        <span className="text-muted-foreground/60">
                          {g.more ? `${g.names.length}+` : g.names.length}
                        </span>
                      )}
                    </div>
                    {g.pending ? (
                      <p className="text-[10px] text-muted-foreground/60">加载中…</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {g.names.map((name) => renderCell(g.id, name))}
                      </div>
                    )}
                  </section>
                ))}
                {groups.length === 0 && (
                  <p className="text-xs text-muted-foreground">没有匹配的图标。</p>
                )}
              </div>
            )}

            {/* 单库浏览 / 搜索：虚拟滚动 */}
            {activeLib !== "all" && gridItems.length > 0 && (
              <div
                className="relative w-full"
                style={{ height: rowVirtualizer.getTotalSize() }}
              >
                {rowVirtualizer.getVirtualItems().map((vRow) => {
                  const start = vRow.index * GRID_COLS
                  const rowNames = gridItems.slice(start, start + GRID_COLS)
                  return (
                    <div
                      key={vRow.key}
                      className="absolute top-0 left-0 grid w-full grid-cols-4 gap-1.5"
                      style={{ transform: `translateY(${vRow.start}px)` }}
                    >
                      {rowNames.map((name) => renderCell(activeLib as IconLib, name))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
