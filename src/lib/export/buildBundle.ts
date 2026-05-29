import { buildMasterSVG } from "@/lib/render/buildMasterSVG"
import { rasterizeToBytes } from "@/lib/render/rasterize"
import { isValidICO, wrapAsICO } from "@/lib/render/wrapAsICO"
import type { IconState } from "@/lib/types"

import {
  FAVICON_HEAD_SNIPPET,
  IOS_INSTRUCTIONS,
  extensionManifestSnippet,
  filenameStem,
  webManifest,
} from "./manifest"

export type ExportTarget = "favicon" | "ios" | "extension" | "single"

export type BundleFile = { name: string; data: Uint8Array | string }
export type Snippet = { label: string; language: string; code: string }

export type Bundle = {
  target: ExportTarget
  files: BundleFile[]
  snippets: Snippet[]
  notes: string[]
}

/** Opaque fill color used to flatten alpha for the iOS target. */
function opaqueFill(state: IconState): string {
  return state.fill.primary
}

export async function buildBundle(
  state: IconState,
  target: ExportTarget,
  singleSize = 512,
): Promise<Bundle> {
  const master = buildMasterSVG(state)
  const notes: string[] = []

  switch (target) {
    case "favicon": {
      const [p32, p180, p192, p512] = await Promise.all([
        rasterizeToBytes(master, 32),
        rasterizeToBytes(master, 180),
        rasterizeToBytes(master, 192),
        rasterizeToBytes(master, 512),
      ])
      const files: BundleFile[] = [
        { name: "icon.svg", data: master },
        { name: "apple-touch-icon.png", data: p180 },
        { name: "icon-192.png", data: p192 },
        { name: "icon-512.png", data: p512 },
        { name: "manifest.webmanifest", data: webManifest(filenameStem(state.meta.filename)) },
      ]
      const ico = wrapAsICO(p32, 32)
      if (isValidICO(ico)) {
        files.unshift({ name: "favicon.ico", data: ico })
      } else {
        notes.push("favicon.ico failed validation and was omitted from the bundle.")
      }
      return {
        target,
        files,
        snippets: [
          { label: "<head>", language: "html", code: FAVICON_HEAD_SNIPPET },
          {
            label: "manifest.webmanifest",
            language: "json",
            code: webManifest(filenameStem(state.meta.filename)),
          },
        ],
        notes,
      }
    }

    case "ios": {
      // Square (radius 0), opaque background, no rounding — system masks it.
      const squareMaster = buildMasterSVG({
        ...state,
        background: { ...state.background, shape: "rounded", radius: 0, strokeSize: 0 },
      })
      const png1024 = await rasterizeToBytes(squareMaster, 1024, {
        background: opaqueFill(state),
      })
      return {
        target,
        files: [{ name: "AppIcon-1024.png", data: png1024 }],
        snippets: [{ label: "Xcode", language: "text", code: IOS_INSTRUCTIONS }],
        notes: ["1024×1024, no alpha channel, square corners (iOS applies the mask)."],
      }
    }

    case "extension": {
      const sizes = [16, 32, 48, 128] as const
      const pngs = await Promise.all(sizes.map((s) => rasterizeToBytes(master, s)))
      return {
        target,
        files: sizes.map((s, i) => ({ name: `icon-${s}.png`, data: pngs[i] })),
        snippets: [
          { label: "manifest.json", language: "json", code: extensionManifestSnippet() },
        ],
        notes: [],
      }
    }

    case "single": {
      const png = await rasterizeToBytes(master, singleSize)
      const name = state.meta.filename.endsWith(".png")
        ? state.meta.filename
        : `${filenameStem(state.meta.filename)}.png`
      return {
        target,
        files: [{ name, data: png }],
        snippets: [],
        notes: [`${singleSize}×${singleSize} PNG.`],
      }
    }
  }
}
