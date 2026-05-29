import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Upload } from "lucide-react"
import { DynamicIcon } from "lucide-react/dynamic"

import { Input } from "@/components/ui/input"
import { loadLucideGlyph, searchLucide } from "@/lib/icons/lucide"
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

const MAX_UPLOAD_BYTES = 100 * 1024

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
  const [activeLib, setActiveLib] = useState<IconLib>("lucide")
  const [query, setQuery] = useState("")

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

  const lucideResults = useMemo(
    () => (activeLib === "lucide" ? searchLucide(query, 120) : []),
    [activeLib, query],
  )
  const providerResults = useMemo(() => {
    if (!provider) return []
    if (provider.searchMode === "remote") return remoteResults
    // only use names that belong to the active provider
    const names = local.id === provider.id ? local.names : []
    return searchNames(names, query, 120)
  }, [provider, remoteResults, local, query])

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
    provider?.searchMode === "remote" ? "搜索 Iconify…" : "搜索图标"

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
          {LIBS.map((lib) => (
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

          <div
            data-grid-scroll
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          >
            <div className="grid grid-cols-4 gap-1.5">
              {activeLib === "lucide" &&
                lucideResults.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => void pickLucide(name)}
                    title={name}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border transition-colors hover:bg-muted",
                      state.iconSource.lib === "lucide" && state.iconSource.name === name
                        ? "border-primary text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <DynamicIcon name={name as never} size={16} />
                  </button>
                ))}

              {provider &&
                status === "idle" &&
                providerResults.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => void pickProvider(provider, name)}
                    title={name}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border p-2 transition-colors hover:bg-muted",
                      state.iconSource.lib === provider.id && state.iconSource.name === name
                        ? "border-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <IconThumb provider={provider} name={name} />
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
