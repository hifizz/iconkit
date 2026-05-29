import { useMemo } from "react"

import { buildMasterSVG } from "@/lib/render/buildMasterSVG"
import { useIconState } from "@/state/iconStore"

const PREVIEW_SIZES = [16, 32, 180, 512]

// Heuristic: lucide glyphs are line art; very small + many subpaths reads as "dense".
function densityHint(svg: string): boolean {
  const paths = (svg.match(/<(path|circle|line|rect|polyline|polygon|ellipse)/g) || [])
    .length
  return paths >= 5
}

export function CenterCanvas() {
  const state = useIconState()
  const master = useMemo(() => buildMasterSVG(state), [state])
  const dataUrl = useMemo(
    () => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(master),
    [master],
  )
  const dense = densityHint(state.iconSource.svg)

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6">
      {/* main preview on a checkerboard transparency backdrop */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundImage:
            "linear-gradient(45deg,#00000010 25%,transparent 25%),linear-gradient(-45deg,#00000010 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#00000010 75%),linear-gradient(-45deg,transparent 75%,#00000010 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
        }}
      >
        <img src={dataUrl} width={224} height={224} alt="icon preview" />
      </div>

      <div className="text-xs text-muted-foreground">512 × 512</div>

      {/* multi-size preview strip */}
      <div className="flex items-end gap-5">
        {PREVIEW_SIZES.map((s) => {
          const px = Math.min(s, 56)
          return (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <img src={dataUrl} width={px} height={px} alt={`${s}px preview`} />
              <span className="text-[10px] text-muted-foreground">{s}</span>
            </div>
          )
        })}
      </div>

      {dense && (
        <p className="max-w-xs text-center text-[11px] text-amber-600 dark:text-amber-500">
          这个字形细节较多，在 16px 下可能会糊 — 可以调大图标尺寸或换个更简单的字形。
        </p>
      )}
    </div>
  )
}
