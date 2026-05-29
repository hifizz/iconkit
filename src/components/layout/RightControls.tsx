import { ColorField } from "@/components/controls/ColorField"
import { Segmented } from "@/components/controls/Segmented"
import { SliderField } from "@/components/controls/SliderField"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { FILL_PRESETS, IOS_PRESETS } from "@/lib/presets"
import { MASTER_SIZE } from "@/lib/render/buildMasterSVG"
import type { BackgroundShape, FillType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePatch, useIconState } from "@/state/iconStore"

// Control ranges derive from the canvas size so they scale if MASTER_SIZE changes.
const RADIUS_MAX = MASTER_SIZE / 2
const STROKE_MAX = Math.round(MASTER_SIZE / 16)
const ICON_MIN = Math.round(MASTER_SIZE / 12)
const OFFSET_MAX = Math.round(MASTER_SIZE * 0.4)

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
    <div className="h-full min-h-0 overflow-y-auto border-l scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
      <div className="flex flex-col gap-5 p-4">
        {/* Presets */}
        <div className="flex flex-col gap-2">
          <GroupLabel>Presets</GroupLabel>
          <div className="flex flex-wrap gap-1.5">
            {FILL_PRESETS.map((p) => {
              const active =
                state.fill.type === p.type &&
                state.fill.primary.toUpperCase() === p.primary.toUpperCase() &&
                (p.type === "solid" ||
                  state.fill.secondary.toUpperCase() === p.secondary.toUpperCase())
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.id}
                  aria-pressed={active}
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
                  className={cn(
                    "size-6 rounded-md ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-ring",
                    active && "ring-2 ring-foreground",
                  )}
                  style={previewStyle(p)}
                />
              )
            })}
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
              max={RADIUS_MAX}
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
            max={STROKE_MAX}
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
            min={ICON_MIN}
            max={MASTER_SIZE}
            suffix="px"
            onChange={(size) => patch({ icon: { size } }, "icon.size")}
          />
          <SliderField
            label="X offset"
            value={state.icon.xOffset}
            min={-OFFSET_MAX}
            max={OFFSET_MAX}
            suffix="px"
            onChange={(xOffset) => patch({ icon: { xOffset } }, "icon.x")}
          />
          <SliderField
            label="Y offset"
            value={state.icon.yOffset}
            min={-OFFSET_MAX}
            max={OFFSET_MAX}
            suffix="px"
            onChange={(yOffset) => patch({ icon: { yOffset } }, "icon.y")}
          />
        </div>

        <Separator />

        {/* iOS background presets (new) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <GroupLabel>iOS Background Presets</GroupLabel>
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
              New
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
            When selected, the background switches to the iOS squircle shape.
          </p>
        </div>
      </div>
    </div>
  )
}
