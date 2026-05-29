# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

IconKit is a **pure front-end** (no backend, statically deployable) icon generator for web developers: design an app icon from a glyph + gradient background, then one-click export the full set of files for a target (favicon set, iOS app icon, browser-extension icons, single PNG) plus ready-to-paste boilerplate. Inspired by ray.so/icon, with the export bundle as the differentiating feature.

`prd.md` is the authoritative product/architecture spec (written in Chinese). `README.md` is the stale Vite/shadcn starter template — ignore it except that shadcn UI components are added via `npx shadcn@latest add <name>`.

## Commands

- `npm run dev` — Vite dev server (the app is at `http://localhost:5173`, or the next free port)
- `npm run build` — `tsc -b && vite build` (type-checks the whole project, then bundles)
- `npm run typecheck` — `tsc --noEmit` (faster check without emitting)
- `npm run lint` — ESLint over the repo
- `npm run format` — Prettier write (`prettier-plugin-tailwindcss` sorts class names)
- `npm run test` — Vitest run once
- Single test file: `npx vitest run src/lib/render/buildMasterSVG.test.ts`
- Single test by name: `npx vitest run -t "wrapAsICO"`
- Update render snapshots after an intentional change: `npx vitest run -u`

Tests run in the **node** environment (see `vite.config.ts` `test.environment`), and only `src/**/*.test.ts` is collected (note: `.ts`, not `.tsx`). Tests cover pure logic — the render pipeline, ICO bytes, manifest JSON, SVG normalization/sanitization, keyword matching — there are no component/DOM tests.

## Architecture

Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4. UI primitives are shadcn-style components in `src/components/ui/` built on `@base-ui/react`. `@/` is an import alias for `src/`.

Two ideas hold the whole app together:

**1. One central state object, `IconState` (`src/lib/types.ts`).** Every panel reads and writes this single object; the canvas and every export artifact are pure derivations of it. It lives in a reducer store at `src/state/iconStore.tsx`:
- Access via hooks: `useIconState()`, `usePatch()` (deep-partial merge patch), `useIconDispatch()`, `useHistory()`.
- Undo/redo is a `{ past, present, future }` history; rapid same-key edits (e.g. slider drags) coalesce into one entry via the `coalesceKey` arg to `usePatch`.
- The **entire history is persisted to `localStorage`** (`iconkit:history:v1`) and rehydrated on load, so a refresh restores both the current icon and the undo/redo stacks. New `IconState` fields must be added to `defaultIconState` so old persisted state still hydrates (it is `deepMerge`d over the defaults).

**2. A single 512×512 "master SVG" is the rendering source of truth.** `buildMasterSVG(state)` (`src/lib/render/buildMasterSVG.ts`, `MASTER_SIZE = 512`) composes background shape + gradient/glare/noise/stroke + the centered glyph into one SVG string. Everything downstream derives from it:
- `rasterize` / `rasterizeToBytes(svg, size)` → PNGs at any size (via canvas)
- `wrapAsICO(png, 32)` → `favicon.ico`
- `buildBundle(state, target)` (`src/lib/export/buildBundle.ts`) assembles files + code snippets per `ExportTarget` (`"favicon" | "ios" | "extension" | "single"`); `downloadBundleZip` (`src/lib/export/zip.ts`) packs them with JSZip. `src/lib/export/manifest.ts` builds the web/extension manifests.

Export **correctness invariants** (from `prd.md` §4.5/§7 — these are the "we do it right" points, keep them when touching export): iOS 1024 PNG has **no alpha and square corners** (the OS rounds it); extension exports are **exactly** 16/32/48/128; the favicon `.ico` contains **only** 32px; clipboard actions degrade to a file download when `navigator.clipboard` is unavailable.

**Icon sources** are unified behind a `Provider` interface and the `PROVIDERS` registry in `src/lib/icons/providers.ts`. Backends:
- `lucide.ts` — bundled via `lucide-react` (the default library)
- `registry.ts` — jsDelivr-CDN libraries (Tabler, Phosphor, Simple Icons, Feather): fetch the flat file listing, then SVGs by URL
- `iconify.ts` — the Iconify API; `iconifySetProvider(id, prefix, label, note)` wraps a single Iconify collection (Material, Heroicons, Bootstrap, Remix, Solar, Carbon, MDI, Octicons) as a first-class browsable library, and the `iconify` provider itself is remote keyword search across 200k+ icons
- `untitled.ts` — Untitled UI (parsed, inline-rendered thumbnails)

Every glyph is run through `normalizeSvg` (`src/lib/icons/normalize.ts`) into a `NormalizedGlyph { svg, viewBox, paint }` (stroke vs fill auto-detected) before entering `IconState`. Uploaded SVGs additionally go through `sanitizeUploadedSvg` (strips scripts/external refs/event handlers). Local libraries' name lists are cached in `sessionStorage`.

**Layout** (`src/App.tsx`): a three-column grid — `LeftPicker` (icon library + search), `CenterCanvas` (master-SVG preview + multi-size strip), `RightControls` (fill/background/icon controls) — with `TopBar` above and the `QuickStart` overlay (opened on demand from the top bar, not auto-shown).

In `LeftPicker`, the **"All" tab** searches across all local libraries at once and renders results grouped by library; single-library tabs use a virtualized grid (`@tanstack/react-virtual`) so a 7000-icon set (e.g. Solar/MDI) mounts only the visible rows. Remote Iconify and the upload tab are excluded from the "All" search.
