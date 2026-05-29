import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loadLucideGlyph } from "@/lib/icons/lucide"
import { FILL_PRESETS } from "@/lib/presets"
import { matchKeyword, slugifyFilename } from "@/lib/quickstart"
import { usePatch } from "@/state/iconStore"

export function QuickStart() {
  const patch = usePatch()
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function generate() {
    const keyword = value.trim()
    if (!keyword) return
    setBusy(true)
    const { iconName, presetId } = matchKeyword(keyword)
    const preset = FILL_PRESETS.find((p) => p.id === presetId) ?? FILL_PRESETS[0]
    let svg: string
    try {
      svg = await loadLucideGlyph(iconName)
    } catch {
      svg = await loadLucideGlyph("rocket")
    }
    patch({
      iconSource: { lib: "lucide", name: iconName, svg, viewBox: 24, paint: "stroke" },
      fill: {
        type: preset.type,
        primary: preset.primary,
        secondary: preset.secondary,
        angle: preset.angle,
      },
      meta: { filename: `${slugifyFilename(keyword)}.png` },
    })
    setBusy(false)
    setOpen(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-base font-medium">Generate an icon in seconds</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Enter a project name or keyword to auto-match a glyph + color set. Fine-tune afterward or export right away.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void generate()
          }}
          className="flex gap-2"
        >
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. my chat app, analytics, coffee shop"
            className="h-9"
          />
          <Button type="submit" size="lg" disabled={busy || !value.trim()}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {["chat", "analytics", "rocket", "music"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue(s)}
                className="rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip, I'll do it myself →
          </button>
        </div>
      </div>
    </div>
  )
}
