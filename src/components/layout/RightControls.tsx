import { ColorField } from "@/components/controls/ColorField"
import { Segmented } from "@/components/controls/Segmented"
import { SliderField } from "@/components/controls/SliderField"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { FILL_PRESETS, IOS_PRESETS } from "@/lib/presets"
import type { BackgroundShape, FillType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePatch, useIconState } from "@/state/iconStore"

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium text-muted-foreground">{children}</h3>
  )
}

function previewStyle(p: { type: FillType; primary: string; secondary: string; angle: number }) {
  if (p.type === "solid") return { background: p.primary }
  if (p.type === "radial")
    return { background: `radial-gradient(circle, ${p.primary}, ${p.secondary})` }
  return { background: `linear-gradient(${p.angle}deg, ${p.primary}, ${p.secondary})` }
}

export function RightControls() {
  const state = useIconState()
  const patch = usePatch()

  return (
    <ScrollArea className="h-full border-l">
      <div className="flex flex-col gap-5 p-4">
        {/* Presets */}
        <div className="flex flex-col gap-2">
          <GroupLabel>Presets</GroupLabel>
          <div className="flex flex-wrap gap-1.5">
            {FILL_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.id}
                onClick={() =>
                  patch({
                    fill: {
                      type: p.type,
                      primary: p.primary,
                      secondary: p.secondary,
                      angle: p.angle,
                    },
                  })
                }
                className="size-6 rounded-md ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-ring"
                style={previewStyle(p)}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Fill Styles */}
        <div className="flex flex-col gap-3">
          <GroupLabel>Fill</GroupLabel>
          <Segmented<FillType>
            value={state.fill.type}
            onChange={(type) => patch({ fill: { type } })}
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
              { value: "solid", label: "Solid" },
            ]}
          />
          <ColorField
            label="Primary"
            value={state.fill.primary}
            onChange={(primary) => patch({ fill: { primary } })}
          />
          {state.fill.type !== "solid" && (
            <ColorField
              label="Secondary"
              value={state.fill.secondary}
              onChange={(secondary) => patch({ fill: { secondary } })}
            />
          )}
          {state.fill.type === "linear" && (
            <SliderField
              label="Angle"
              value={state.fill.angle}
              min={0}
              max={360}
              suffix="°"
              onChange={(angle) => patch({ fill: { angle } }, "fill.angle")}
            />
          )}
        </div>

        <Separator />

        {/* Background */}
        <div className="flex flex-col gap-3">
          <GroupLabel>Background</GroupLabel>
          <Segmented<BackgroundShape>
            value={state.background.shape}
            onChange={(shape) => patch({ background: { shape } })}
            options={[
              { value: "rounded", label: "Rounded" },
              { value: "squircle", label: "Squircle" },
            ]}
          />
          {state.background.shape === "rounded" && (
            <SliderField
              label="Radius"
              value={state.background.radius}
              min={0}
              max={256}
              suffix="px"
              onChange={(radius) => patch({ background: { radius } }, "bg.radius")}
            />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Radial glare</span>
            <Switch
              checked={state.background.radialGlare}
              onCheckedChange={(radialGlare) => patch({ background: { radialGlare } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Noise texture</span>
            <Switch
              checked={state.background.noiseTexture}
              onCheckedChange={(noiseTexture) => patch({ background: { noiseTexture } })}
            />
          </div>
          {state.background.noiseTexture && (
            <SliderField
              label="Noise opacity"
              value={state.background.noiseOpacity}
              min={0}
              max={100}
              suffix="%"
              onChange={(noiseOpacity) =>
                patch({ background: { noiseOpacity } }, "bg.noise")
              }
            />
          )}
          <SliderField
            label="Stroke size"
            value={state.background.strokeSize}
            min={0}
            max={32}
            suffix="px"
            onChange={(strokeSize) => patch({ background: { strokeSize } }, "bg.stroke")}
          />
          {state.background.strokeSize > 0 && (
            <ColorField
              label="Stroke color"
              value={state.background.strokeColor}
              onChange={(strokeColor) => patch({ background: { strokeColor } })}
            />
          )}
        </div>

        <Separator />

        {/* Icon */}
        <div className="flex flex-col gap-3">
          <GroupLabel>Icon</GroupLabel>
          <ColorField
            label="Color"
            value={state.icon.color}
            onChange={(color) => patch({ icon: { color } })}
          />
          <SliderField
            label="Size"
            value={state.icon.size}
            min={48}
            max={512}
            suffix="px"
            onChange={(size) => patch({ icon: { size } }, "icon.size")}
          />
          <SliderField
            label="X offset"
            value={state.icon.xOffset}
            min={-200}
            max={200}
            suffix="px"
            onChange={(xOffset) => patch({ icon: { xOffset } }, "icon.x")}
          />
          <SliderField
            label="Y offset"
            value={state.icon.yOffset}
            min={-200}
            max={200}
            suffix="px"
            onChange={(yOffset) => patch({ icon: { yOffset } }, "icon.y")}
          />
        </div>

        <Separator />

        {/* iOS background presets (new) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <GroupLabel>iOS 背景预设</GroupLabel>
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
              新
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {IOS_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                onClick={() =>
                  patch({
                    fill: {
                      type: p.type,
                      primary: p.primary,
                      secondary: p.secondary,
                      angle: p.angle,
                    },
                    background: { shape: "squircle" },
                  })
                }
                className={cn(
                  "size-7 ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-ring",
                )}
                style={{
                  ...previewStyle(p),
                  // hint at the squircle silhouette
                  borderRadius: "32%",
                }}
              />
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            选中后背景切换为 iOS 超椭圆（squircle）形状。
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
