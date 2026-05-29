export class RasterizeError extends Error {}

export type RasterizeOptions = {
  /** When set, paint this solid color first (flattens alpha — used for iOS). */
  background?: string
}

function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

/**
 * Force the master SVG's intrinsic size (the <svg> tag's width/height) to `n`,
 * leaving viewBox untouched. This makes the browser rasterize the SVG natively
 * at `n` px instead of at its baked-in 512 then letting canvas downscale —
 * which is the main source of aliasing at small export sizes.
 */
export function withSvgSize(svg: string, n: number): string {
  return svg.replace(
    /<svg([^>]*)>/,
    (_m, attrs: string) =>
      `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} width="${n}" height="${n}">`,
  )
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  if (img.decode) {
    return img
      .decode()
      .then(() => img)
      .catch(
        () =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img)
            img.onerror = () => reject(new RasterizeError("Failed to load SVG image"))
          }),
      )
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = () => reject(new RasterizeError("Failed to load SVG image"))
  })
}

function toBlobWithRetry(canvas: HTMLCanvasElement): Promise<Blob> {
  const attempt = () =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  return attempt().then((blob) => {
    if (blob) return blob
    return attempt().then((retry) => {
      if (retry) return retry
      throw new RasterizeError("canvas.toBlob returned null")
    })
  })
}

/**
 * Rasterize a master SVG string to a PNG Blob at the given pixel size.
 *
 * The SVG is sized to the exact target via `withSvgSize` so the browser's SVG
 * rasterizer renders it natively at that size — its analytic anti-aliasing is
 * sharper at every size than rasterizing at 512 and letting canvas downscale.
 * Drawing is 1:1 (no canvas resampling), which keeps edges crisp; supersampling
 * + downscale was tried and only added softness.
 */
export async function rasterize(
  svg: string,
  size: number,
  opts: RasterizeOptions = {},
): Promise<Blob> {
  const img = await loadImage(svgToDataUrl(withSvgSize(svg, size)))
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new RasterizeError("2d context unavailable")
  if (opts.background) {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, size, size)
  }
  ctx.drawImage(img, 0, 0, size, size) // 1:1 — img intrinsic size === target
  return toBlobWithRetry(canvas)
}

export async function rasterizeToBytes(
  svg: string,
  size: number,
  opts: RasterizeOptions = {},
): Promise<Uint8Array> {
  const blob = await rasterize(svg, size, opts)
  return new Uint8Array(await blob.arrayBuffer())
}
