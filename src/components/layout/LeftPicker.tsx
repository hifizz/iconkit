import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { DynamicIcon } from "lucide-react/dynamic"

import { Input } from "@/components/ui/input"
import { loadLucideGlyph, searchLucide } from "@/lib/icons/lucide"
import { cn } from "@/lib/utils"
import { usePatch, useIconState } from "@/state/iconStore"

const LIBS = [
  { id: "lucide", label: "Lucide", enabled: true },
  { id: "tabler", label: "Tabler", enabled: false },
  { id: "phosphor", label: "Phosphor", enabled: false },
  { id: "simple", label: "Simple", enabled: false },
  { id: "upload", label: "SVG", enabled: false },
]

export function LeftPicker() {
  const state = useIconState()
  const patch = usePatch()
  const [query, setQuery] = useState("")

  const results = useMemo(() => searchLucide(query, 120), [query])

  async function pick(name: string) {
    const svg = await loadLucideGlyph(name)
    patch({ iconSource: { lib: "lucide", name, svg } })
  }

  return (
    <div className="flex h-full flex-col gap-3 border-r p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索图标"
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {LIBS.map((lib) => (
          <button
            key={lib.id}
            type="button"
            disabled={!lib.enabled}
            title={lib.enabled ? undefined : "即将支持（M3）"}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] transition-colors",
              lib.enabled && state.iconSource.lib === lib.id
                ? "bg-primary text-primary-foreground"
                : lib.enabled
                  ? "border text-muted-foreground hover:text-foreground"
                  : "border text-muted-foreground/40",
            )}
          >
            {lib.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
        <div className="grid grid-cols-4 gap-1.5">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pick(name)}
              title={name}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border transition-colors hover:bg-muted",
                state.iconSource.name === name
                  ? "border-primary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <DynamicIcon name={name as never} size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
