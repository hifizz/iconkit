import { useMemo } from "react"

import { buildMasterSVG, MASTER_SIZE } from "@/lib/render/buildMasterSVG"
import { useIconState } from "@/state/iconStore"

const PREVIEW_SIZES = [16, 24, 32, 48, 96]

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
    // checkerboard fills the whole center area as the backdrop
    <div className="checkerboard flex h-full min-h-0 flex-col">
      {/* main preview — large, fills the available space */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <img
          src={dataUrl}
          alt="icon preview"
          className="max-h-full w-auto max-w-[min(80%,600px)] object-contain drop-shadow-sm"
        />
      </div>

      {/* bottom bar: readout + multi-size strip, on a solid panel for legibility */}
      <div className="flex flex-col items-center gap-3 border-t bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="text-xs text-muted-foreground">
          {MASTER_SIZE} × {MASTER_SIZE}
        </div>

        <div className="flex items-end gap-5">
          {PREVIEW_SIZES.map((s) => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              {/* true pixel size — this is the point of the multi-size preview */}
              <div
                className="checkerboard flex items-center justify-center rounded"
                style={{ width: s, height: s }}
              >
                <img src={dataUrl} width={s} height={s} alt={`${s}px preview`} />
              </div>
              <span className="text-[10px] text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>

        {dense && (
          <p className="max-w-md text-center text-[11px] text-amber-600 dark:text-amber-500">
            这个字形细节较多，在 16px 下可能会糊 — 可以调大图标尺寸或换个更简单的字形。
          </p>
        )}
      </div>
    </div>
  )
}
