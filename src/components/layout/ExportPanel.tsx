import { useEffect, useState } from "react"
import { Check, Copy, Download, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { copyImageOrDownload, copyTextOrDownload, triggerDownload } from "@/lib/download"
import {
  buildBundle,
  type Bundle,
  type ExportTarget,
} from "@/lib/export/buildBundle"
import { downloadBundleZip } from "@/lib/export/zip"
import { buildMasterSVG } from "@/lib/render/buildMasterSVG"
import { rasterize } from "@/lib/render/rasterize"
import { useIconState } from "@/state/iconStore"

const TARGETS: { id: ExportTarget; label: string; desc: string }[] = [
  { id: "favicon", label: "Favicon", desc: "Full site favicon set + manifest + <head>" },
  { id: "ios", label: "iOS App", desc: "1024 square, no alpha, no pre-rounded corners" },
  { id: "extension", label: "Extension", desc: "16/32/48/128 + manifest.json" },
  { id: "single", label: "Single", desc: "Single PNG; copy image / SVG / dataURL" },
]

export function ExportPanel({ trigger }: { trigger: React.ReactElement }) {
  const state = useIconState()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<ExportTarget>("favicon")
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // rebuild the bundle preview whenever the dialog opens / target / state changes
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setBusy(true)
    setError(null)
    buildBundle(state, target)
      .then((b) => !cancelled && setBundle(b))
      .catch((e) => !cancelled && setError(String(e?.message ?? e)))
      .finally(() => !cancelled && setBusy(false))
    return () => {
      cancelled = true
    }
  }, [open, target, state])

  async function flash(label: string, p: Promise<unknown>) {
    await p
    setCopied(label)
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500)
  }

  async function onCopySnippet(label: string, code: string) {
    await flash(label, copyTextOrDownload(code, `${label}.txt`))
  }

  async function onDownloadZip() {
    if (!bundle) return
    setBusy(true)
    try {
      await downloadBundleZip(bundle, state.meta.filename)
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    } finally {
      setBusy(false)
    }
  }

  // Single-target convenience actions
  async function onCopyImage() {
    const blob = await rasterize(buildMasterSVG(state), 512)
    await flash("image", copyImageOrDownload(blob, "icon.png"))
  }
  async function onCopySvg() {
    await flash("svg", copyTextOrDownload(buildMasterSVG(state), "icon.svg"))
  }
  async function onCopyDataUrl() {
    const blob = await rasterize(buildMasterSVG(state), 512)
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((res) => {
      reader.onload = () => res(reader.result as string)
      reader.readAsDataURL(blob)
    })
    await flash("dataurl", copyTextOrDownload(dataUrl, "icon-dataurl.txt"))
  }
  async function onDownloadSingle() {
    const blob = await rasterize(buildMasterSVG(state), 512)
    triggerDownload(blob, state.meta.filename.endsWith(".png") ? state.meta.filename : "icon.png")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-2xl sm:max-w-2xl [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Export All</DialogTitle>
          <DialogDescription>
            Pick a target, then download the packaged files + ready-to-paste code.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={target} onValueChange={(v) => setTarget(v as ExportTarget)}>
          <TabsList className="w-full">
            {TARGETS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="flex-1">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          {TARGETS.find((t) => t.id === target)?.desc}
        </p>

        {error && <p className="text-xs text-destructive">Export failed: {error}</p>}

        {/* file list */}
        <div className="rounded-lg border">
          <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
            Files to be packaged
          </div>
          <ul className="max-h-32 overflow-auto p-2 text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            {busy && !bundle ? (
              <li className="px-1 py-0.5 text-muted-foreground">Generating…</li>
            ) : (
              bundle?.files.map((f) => (
                <li key={f.name} className="flex items-center gap-2 px-1 py-0.5">
                  <FileText className="size-3 text-muted-foreground" />
                  <span className="font-mono">{f.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* notes */}
        {bundle?.notes.map((n) => (
          <p key={n} className="text-[11px] text-muted-foreground">
            ⓘ {n}
          </p>
        ))}

        {/* snippets */}
        {bundle?.snippets.map((s) => (
          <div key={s.label} className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="font-mono text-xs">{s.label}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopySnippet(s.label, s.code)}
              >
                {copied === s.label ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </Button>
            </div>
            <pre className="max-h-40 overflow-auto p-3 text-[11px] leading-relaxed break-words whitespace-pre-wrap scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              <code>{s.code}</code>
            </pre>
          </div>
        ))}

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2">
          {target === "single" ? (
            <>
              <Button onClick={onDownloadSingle}>
                <Download className="size-4" /> Download PNG
              </Button>
              <Button variant="outline" onClick={onCopyImage}>
                {copied === "image" ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy image
              </Button>
              <Button variant="outline" onClick={onCopySvg}>
                {copied === "svg" ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy SVG
              </Button>
              <Button variant="outline" onClick={onCopyDataUrl}>
                {copied === "dataurl" ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                Copy dataURL
              </Button>
            </>
          ) : (
            <Button onClick={onDownloadZip} disabled={busy || !bundle}>
              <Download className="size-4" /> Download .zip
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
