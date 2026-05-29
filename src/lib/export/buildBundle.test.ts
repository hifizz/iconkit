import { beforeEach, describe, expect, it, vi } from "vitest"

import { defaultIconState } from "@/lib/types"

// Mock the browser-only rasterizer so bundle logic can be tested in node.
const rasterizeToBytes = vi.fn(
  async (_svg: string, size: number, _opts?: { background?: string }) => {
    // a fake "PNG" whose first bytes are the PNG signature so wrapAsICO validates
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, size & 0xff])
  },
)
vi.mock("@/lib/render/rasterize", () => ({
  rasterizeToBytes,
  rasterize: vi.fn(),
  RasterizeError: class extends Error {},
}))

const { buildBundle } = await import("./buildBundle")

beforeEach(() => rasterizeToBytes.mockClear())

describe("buildBundle", () => {
  it("favicon bundle contains the expected 6 files including a valid ico", async () => {
    const b = await buildBundle(defaultIconState, "favicon")
    const names = b.files.map((f) => f.name).sort()
    expect(names).toEqual(
      [
        "apple-touch-icon.png",
        "favicon.ico",
        "icon-192.png",
        "icon-512.png",
        "icon.svg",
        "manifest.webmanifest",
      ].sort(),
    )
  })

  it("favicon head snippet paths all exist in the file list", async () => {
    const b = await buildBundle(defaultIconState, "favicon")
    const names = new Set(b.files.map((f) => f.name))
    const headSnippet = b.snippets.find((s) => s.label === "<head>")!.code
    const refs = [...headSnippet.matchAll(/href="\/([^"]+)"/g)].map((m) => m[1])
    for (const ref of refs) {
      expect(names.has(ref)).toBe(true)
    }
  })

  it("extension bundle has exactly the four required files", async () => {
    const b = await buildBundle(defaultIconState, "extension")
    expect(b.files.map((f) => f.name)).toEqual([
      "icon-16.png",
      "icon-32.png",
      "icon-48.png",
      "icon-128.png",
    ])
  })

  it("ios bundle is a single 1024 png and flattens alpha onto an opaque bg", async () => {
    const b = await buildBundle(defaultIconState, "ios")
    expect(b.files.map((f) => f.name)).toEqual(["AppIcon-1024.png"])
    // rasterize was called at 1024 with an opaque background option
    const call = rasterizeToBytes.mock.calls.find((c) => c[1] === 1024)
    expect(call).toBeTruthy()
    expect(call![2]?.background).toBe(defaultIconState.fill.primary)
  })

  it("single bundle produces one png named from the filename", async () => {
    const b = await buildBundle(
      { ...defaultIconState, meta: { filename: "logo.png" } },
      "single",
      256,
    )
    expect(b.files.map((f) => f.name)).toEqual(["logo.png"])
  })
})
