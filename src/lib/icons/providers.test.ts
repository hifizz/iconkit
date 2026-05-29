import { describe, expect, it } from "vitest"

import { collectionNames, iconifyUrl } from "./iconify"
import { searchNames } from "./registry"
import { parseUntitledComponent } from "./untitled"

describe("searchNames", () => {
  it("matches case-insensitively (PascalCase names too)", () => {
    expect(searchNames(["Star01", "Hexagon01", "Activity"], "star")).toEqual([
      "Star01",
    ])
  })
  it("returns the full list (capped) for an empty query", () => {
    expect(searchNames(["a", "b", "c"], "")).toEqual(["a", "b", "c"])
  })
})

describe("iconifyUrl", () => {
  it("builds the svg url from a prefix:name id", () => {
    expect(iconifyUrl("mdi:home")).toBe("https://api.iconify.design/mdi/home.svg")
    expect(iconifyUrl("feather:rocket")).toBe(
      "https://api.iconify.design/feather/rocket.svg",
    )
    expect(iconifyUrl("material-symbols:home-rounded")).toBe(
      "https://api.iconify.design/material-symbols/home-rounded.svg",
    )
  })
})

describe("collectionNames", () => {
  it("flattens uncategorized + categories, de-dupes and sorts", () => {
    const out = collectionNames({
      uncategorized: ["home", "star"],
      categories: { Action: ["star", "settings"], AV: ["play"] },
    })
    expect(out).toEqual(["home", "play", "settings", "star"])
  })
  it("handles a collection with only categories", () => {
    expect(collectionNames({ categories: { A: ["b", "a"] } })).toEqual(["a", "b"])
  })
  it("handles an empty response", () => {
    expect(collectionNames({})).toEqual([])
  })
})

describe("parseUntitledComponent", () => {
  const src =
    'import*as o from"react";const i=({size:r=24,color:t="currentColor",...e})=>' +
    'o.createElement("svg",{viewBox:"0 0 24 24",width:r,height:r,stroke:t,strokeWidth:"2",fill:"none",' +
    'strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",...e},' +
    'o.createElement("path",{d:"M22 12h-4l-3 9L9 3l-3 9H2"}));i.displayName="Activity";export{i as Activity};'

  it("extracts inner path markup and drops the svg wrapper", () => {
    const inner = parseUntitledComponent(src)
    expect(inner).toBe('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>')
    expect(inner).not.toContain("<svg")
    expect(inner).not.toContain("strokeWidth")
  })

  it("handles multiple shapes including circles", () => {
    const multi =
      'o.createElement("svg",{viewBox:"0 0 24 24"},' +
      'o.createElement("path",{d:"M1 2"}),' +
      'o.createElement("circle",{cx:"12",cy:"12",r:"3"}))'
    const inner = parseUntitledComponent(multi)
    expect(inner).toContain('<path d="M1 2"/>')
    expect(inner).toContain('<circle cx="12" cy="12" r="3"/>')
  })
})
