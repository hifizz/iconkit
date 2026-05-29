import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Upload } from "lucide-react"
import { DynamicIcon } from "lucide-react/dynamic"

import { Input } from "@/components/ui/input"
import { loadLucideGlyph, searchLucide } from "@/lib/icons/lucide"
import { sanitizeUploadedSvg, normalizeSvg } from "@/lib/icons/normalize"
import {
  fetchLibNames,
  getCachedNames,
  loadCdnGlyph,
  searchNames,
  svgUrl,
  type CdnLibId,
} from "@/lib/icons/registry"
import type { IconLib } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePatch, useIconState } from "@/state/iconStore"

const LIBS: { id: IconLib; label: string }[] = [
  { id: "lucide", label: "Lucide" },
  { id: "tabler", label: "Tabler" },
  { id: "phosphor", label: "Phosphor" },
  { id: "simple", label: "Simple" },
  { id: "upload", label: "SVG" },
]

const MAX_UPLOAD_BYTES = 100 * 1024

export function LeftPicker() {
  const state = useIconState()
  const patch = usePatch()
  const [activeLib, setActiveLib] = useState<IconLib>("lucide")
  const [query, setQuery] = useState("")

  // CDN library name lists, loaded lazily on first switch
  const [cdnNames, setCdnNames] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isCdn = activeLib === "tabler" || activeLib === "phosphor" || activeLib === "simple"

  useEffect(() => {
    if (!isCdn) {
      setStatus("idle")
      return
    }
    let cancelled = false
    // Already loaded this library (memory / sessionStorage)? Show it instantly,
    // no loading flash, no stale-names-from-other-lib flash.
    const cached = getCachedNames(activeLib as CdnLibId)
    if (cached) {
      setCdnNames(cached)
      setStatus("idle")
      return
    }
    setCdnNames([]) // clear the previous library's names while fetching
    setStatus("loading")
    fetchLibNames(activeLib as CdnLibId)
      .then((names) => {
        if (cancelled) return
        setCdnNames(names)
        setStatus("idle")
      })
      .catch(() => {
        if (cancelled) return
        setStatus("error")
        setCdnNames([])
      })
    return () => {
      cancelled = true
    }
  }, [activeLib, isCdn])

  const lucideResults = useMemo(
    () => (activeLib === "lucide" ? searchLucide(query, 120) : []),
    [activeLib, query],
  )
  const cdnResults = useMemo(
    () => (isCdn ? searchNames(cdnNames, query, 120) : []),
    [isCdn, cdnNames, query],
  )

  async function pickLucide(name: string) {
    const svg = await loadLucideGlyph(name)
    patch({ iconSource: { lib: "lucide", name, svg, viewBox: 24, paint: "stroke" } })
  }

  async function pickCdn(lib: CdnLibId, name: string) {
    try {
      const g = await loadCdnGlyph(lib, name)
      patch({ iconSource: { lib, name, svg: g.svg, viewBox: g.viewBox, paint: g.paint } })
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

  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="flex flex-col gap-3 p-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图标"
            className="h-8 pl-8 text-xs"
            disabled={activeLib === "upload"}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LIBS.map((lib) => (
          <button
            key={lib.id}
            type="button"
            onClick={() => setActiveLib(lib.id)}
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
          {(activeLib === "simple" || status !== "idle") && (
            <div className="flex flex-col gap-2 px-3 pb-2">
              {activeLib === "simple" && (
                <p className="rounded-md bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  品牌 logo 适合 demo / 占位；正式发布产品 logo 请注意商标风险。
                </p>
              )}
              {status === "loading" && (
                <p className="text-xs text-muted-foreground">加载图标库中…</p>
              )}
              {status === "error" && (
                <p className="text-xs text-destructive">
                  该图标库暂不可用（需要网络），请稍后重试或改用 Lucide。
                </p>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
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

              {isCdn &&
                status === "idle" &&
                cdnResults.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => void pickCdn(activeLib as CdnLibId, name)}
                    title={name}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border p-2 transition-colors hover:bg-muted",
                      state.iconSource.lib === activeLib && state.iconSource.name === name
                        ? "border-primary"
                        : "",
                    )}
                  >
                    <img
                      src={svgUrl(activeLib as CdnLibId, name)}
                      alt={name}
                      loading="lazy"
                      className="size-4 dark:invert"
                    />
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
