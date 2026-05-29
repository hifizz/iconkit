import { useEffect, useState } from "react"

import { Label } from "@/components/ui/label"
import { isValidHex, normalizeHex } from "@/lib/color"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string // normalized #RRGGBB
  onChange: (hex: string) => void
}

export function ColorField({ label, value, onChange }: Props) {
  const [text, setText] = useState(value)

  // keep local text in sync when the value changes externally (presets, undo)
  useEffect(() => setText(value), [value])

  const valid = isValidHex(text)

  function commit(next: string) {
    setText(next)
    const norm = normalizeHex(next)
    if (norm) onChange(norm)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative size-7 shrink-0 overflow-hidden rounded-md border">
          <input
            type="color"
            value={value}
            onChange={(e) => commit(e.target.value)}
            className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer border-0 p-0"
          />
        </label>
        <input
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(value)}
          spellCheck={false}
          className={cn(
            "h-7 w-full rounded-md border bg-transparent px-2 font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            !valid && "border-destructive text-destructive",
          )}
        />
      </div>
    </div>
  )
}
