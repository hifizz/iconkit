import { CenterCanvas } from "@/components/layout/CenterCanvas"
import { LeftPicker } from "@/components/layout/LeftPicker"
import { RightControls } from "@/components/layout/RightControls"
import { TopBar } from "@/components/layout/TopBar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { IconStoreProvider } from "@/state/iconStore"

export function App() {
  return (
    <TooltipProvider>
      <IconStoreProvider>
        <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
          <TopBar />
          <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)_300px] grid-rows-[minmax(0,1fr)]">
            <LeftPicker />
            <main className="min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              <CenterCanvas />
            </main>
            <RightControls />
          </div>
        </div>
      </IconStoreProvider>
    </TooltipProvider>
  )
}

export default App
