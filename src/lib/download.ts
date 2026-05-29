/** Trigger a browser download for a Blob (no external dep). */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // revoke on next tick so the click has a chance to start
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type CopyResult = "copied" | "downloaded"

/** Copy text to the clipboard; fall back to a download if unavailable. */
export async function copyTextOrDownload(
  text: string,
  fallbackName: string,
): Promise<CopyResult> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return "copied"
    }
  } catch {
    // fall through to download
  }
  triggerDownload(new Blob([text], { type: "text/plain" }), fallbackName)
  return "downloaded"
}

/** Copy an image Blob to the clipboard; fall back to a download if unavailable. */
export async function copyImageOrDownload(
  blob: Blob,
  fallbackName: string,
): Promise<CopyResult> {
  try {
    if (navigator.clipboard && "write" in navigator.clipboard && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return "copied"
    }
  } catch {
    // fall through to download
  }
  triggerDownload(blob, fallbackName)
  return "downloaded"
}
