import { describe, expect, it } from "vitest"

import {
  extensionManifestSnippet,
  filenameStem,
  webManifest,
} from "./manifest"

describe("manifest builders", () => {
  it("strips the extension for the app name stem", () => {
    expect(filenameStem("my-app-icon.png")).toBe("my-app-icon")
    expect(filenameStem("icon")).toBe("icon")
    expect(filenameStem("")).toBe("app")
  })

  it("produces a valid webmanifest with both icon sizes", () => {
    const parsed = JSON.parse(webManifest("Acme"))
    expect(parsed.name).toBe("Acme")
    expect(parsed.icons.map((i: { sizes: string }) => i.sizes)).toEqual([
      "192x192",
      "512x512",
    ])
    expect(parsed.icons.every((i: { type: string }) => i.type === "image/png")).toBe(true)
  })

  it("extension manifest has exactly the four standard icon sizes", () => {
    const parsed = JSON.parse(extensionManifestSnippet())
    expect(Object.keys(parsed.icons)).toEqual(["16", "32", "48", "128"])
    expect(parsed.action.default_icon).toBeDefined()
  })
})
