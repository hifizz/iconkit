# IconKit — TODO（M1 + M2 核心闭环）

> 纯前端图标生成器。Vite + React 19 + TS + Tailwind v4 + shadcn(base-ui)。
> 数据流：`IconState` → `buildMasterSVG()`(512 主SVG) → `rasterize`(各尺寸PNG) → `wrapAsICO`(favicon.ico) → manifest/片段 → JSZip 下载。

## M1 — 复刻 ray.so

- [ ] 1. 安装依赖：`jszip`(运行时)、`vitest`+`jsdom`(开发)；配置 vitest（`vite.config.ts` 加 `test` 块 + `package.json` 加 `test` 脚本）。
- [ ] 2. `src/lib/types.ts`：`IconState` 类型 + `defaultIconState`（见 prd.md §5.1）。
- [ ] 3. `src/state/iconStore.tsx`：`useReducer` + Context + undo/redo 历史（patch 深合并、slider coalesce、past 上限）。
- [ ] 4. `src/lib/icons/lucide.ts`：`dynamicIconImports` 懒加载 + `iconNodeToInnerSvg`（+ 单测）。
- [ ] 5. `src/lib/render/buildMasterSVG.ts`：纯主 SVG（背景形状/渐变/glare/noise/stroke/字形）（+ 快照 & 几何单测）。
- [ ] 6. `src/lib/presets.ts` + `src/lib/color.ts`：配色/渐变预设、squircle 路径常量、hex 校验。
- [ ] 7. 新增 `src/components/ui/*`：slider / tabs / dialog(or popover) / switch / input / label / separator / tooltip / toggle-group / scroll-area。
- [ ] 8. `src/components/layout/*`：TopBar / LeftPicker / CenterCanvas(多尺寸预览) / RightControls(全套控件) 接入 store。
- [ ] 9. `src/lib/render/rasterize.ts` + Single 目标单张 PNG 导出 + 复制图片/SVG/dataURL。**对齐 ray.so。**

## M2 — 命门（导出 bundle）

- [ ] 10. `src/lib/render/wrapAsICO.ts`：PNG-in-ICO 字节（+ 头字节单测）。
- [ ] 11. `src/lib/export/manifest.ts`：`manifest.webmanifest` / `manifest.json` / `<head>` 片段模板（+ JSON 合法性单测）。
- [ ] 12. `src/lib/export/targets/{favicon,ios,extension,single}.ts`（+ 文件清单 & 路径一致性单测）。
- [ ] 13. `src/lib/export/buildBundle.ts` + `src/lib/export/zip.ts`：编排 + JSZip + 触发下载。
- [ ] 14. `src/components/layout/ExportPanel.tsx`：目标选择 tabs + 文件清单/代码预览 + 一键复制 + 下载 .zip。
- [ ] 15. 错误处理收口（prd.md §6）：渲染失败重试、剪贴板降级下载、ico 校验、非法 hex 标红保留上值。

## 验收

- [ ] 单测通过：`buildMasterSVG` 快照/几何、`wrapAsICO` 头字节、manifest 合法、Extension 恰 4 文件、iOS radius0+无alpha。
- [ ] 端到端：选图标 → 套预设 → Favicon 导出 → zip 6 文件齐全、`<head>` 路径一致、可复制。
- [ ] `pnpm typecheck` + `pnpm build` + `pnpm preview` 通过。

## 留作 M3+（本轮不做）

多图标库(Tabler/Phosphor/Simple) · 上传 SVG · iOS squircle 预设 · 极速入口 · 框架感知代码片段 · appiconset · 视觉快照 / Playwright E2E。
