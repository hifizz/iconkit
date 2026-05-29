import JSZip from "jszip"

import { triggerDownload } from "@/lib/download"
import { filenameStem } from "./manifest"
import type { Bundle } from "./buildBundle"

/** Zip a bundle's files and trigger a download. */
export async function downloadBundleZip(bundle: Bundle, baseName: string): Promise<void> {
  const zip = new JSZip()
  for (const file of bundle.files) {
    zip.file(file.name, file.data)
  }
  // include companion code as a README so it ships with the files
  if (bundle.snippets.length || bundle.notes.length) {
    const readme = [
      `# ${bundle.target} bundle`,
      "",
      ...bundle.notes.map((n) => `- ${n}`),
      "",
      ...bundle.snippets.flatMap((s) => [
        `## ${s.label}`,
        "",
        "```" + s.language,
        s.code,
        "```",
        "",
      ]),
    ].join("\n")
    zip.file("README.md", readme)
  }
  const blob = await zip.generateAsync({ type: "blob" })
  triggerDownload(blob, `${filenameStem(baseName)}-${bundle.target}.zip`)
}
