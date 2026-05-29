import { useEffect } from "react"
import { Download, Redo2, Squircle, Undo2 } from "lucide-react"

import { ExportPanel } from "@/components/layout/ExportPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useHistory,
  useIconDispatch,
  usePatch,
  useIconState,
} from "@/state/iconStore"

export function TopBar() {
  const state = useIconState()
  const dispatch = useIconDispatch()
  const patch = usePatch()
  const { canUndo, canRedo } = useHistory()

  // keyboard: Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
        e.preventDefault()
        dispatch({ type: e.shiftKey ? "redo" : "undo" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch])

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Squircle className="size-[18px] text-muted-foreground" />
        <span className="text-sm font-medium">IconKit</span>
        <Input
          value={state.meta.filename}
          onChange={(e) => patch({ meta: { filename: e.target.value } })}
          spellCheck={false}
          className="h-7 w-44 text-xs text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canUndo}
          onClick={() => dispatch({ type: "undo" })}
          title="撤销 (⌘Z)"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canRedo}
          onClick={() => dispatch({ type: "redo" })}
          title="重做 (⇧⌘Z)"
        >
          <Redo2 className="size-4" />
        </Button>
        <ExportPanel
          trigger={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> 导出整套
            </Button>
          }
        />
      </div>
    </header>
  )
}
