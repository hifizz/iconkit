/** Strip extension from a filename to get a stem usable as an app name. */
export function filenameStem(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "")
  return base.trim() || "app"
}

export function webManifest(name: string): string {
  return JSON.stringify(
    {
      name,
      short_name: name,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  )
}

export const FAVICON_HEAD_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />`

export function extensionManifestSnippet(): string {
  return JSON.stringify(
    {
      icons: {
        "16": "icon-16.png",
        "32": "icon-32.png",
        "48": "icon-48.png",
        "128": "icon-128.png",
      },
      action: {
        default_icon: { "16": "icon-16.png", "32": "icon-32.png" },
      },
    },
    null,
    2,
  )
}

export const IOS_INSTRUCTIONS = `Open Xcode → Assets.xcassets → AppIcon, then drag AppIcon-1024.png
into the single 1024pt slot. Do not pre-round the corners — iOS applies
the squircle mask automatically. The PNG has no alpha channel, as required.`
