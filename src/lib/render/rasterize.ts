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

/** Supersample factor: render small sizes larger, then downscale for AA. */
function supersample(size: number): number {
  if (size <= 64) return 3
  if (size <= 384) return 2
  return 1
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
 * Two anti-aliasing measures: (1) the SVG is rasterized natively at the
 * (supersampled) target size rather than at 512-then-downscaled; (2) small
 * sizes render at 2–3× and are downsampled with high smoothing quality.
 */
export async function rasterize(
  svg: string,
  size: number,
  opts: RasterizeOptions = {},
): Promise<Blob> {
  const ss = supersample(size)
  const renderSize = size * ss
  const img = await loadImage(svgToDataUrl(withSvgSize(svg, renderSize)))
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new RasterizeError("2d context unavailable")
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  if (opts.background) {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, size, size)
  }
  // ss === 1 → 1:1 native render (no canvas scaling); ss > 1 → HQ downsample
  ctx.drawImage(img, 0, 0, size, size)
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
