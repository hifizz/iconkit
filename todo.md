# IconKit — TODO

> 纯前端图标生成器。Vite + React 19 + TS + Tailwind v4 + shadcn(base-ui)。
> 数据流：`IconState` → `buildMasterSVG()`(512 主SVG) → `rasterize`(各尺寸PNG) → `wrapAsICO`(favicon.ico) → manifest/片段 → JSZip 下载。

## ✅ M1 — 复刻 ray.so（已完成）

- [x] 依赖 + vitest 配置
- [x] `IconState` 类型 + 默认值
- [x] store：reducer + Context + undo/redo（slider coalesce）
- [x] Lucide 懒加载（`dynamicIconImports`）+ `iconNodeToInnerSvg`
- [x] `buildMasterSVG`：背景形状/渐变/glare/noise/stroke/字形（纯函数 + 快照/几何单测）
- [x] 配色/渐变预设、squircle 路径、hex 校验
- [x] shadcn UI 组件
- [x] 三栏布局：TopBar / LeftPicker / CenterCanvas(多尺寸预览) / RightControls(全套控件)
- [x] `rasterize` + Single 单张 PNG 导出 + 复制图片/SVG/dataURL

## ✅ M2 — 命门 / 导出 bundle（已完成）

- [x] `wrapAsICO`：PNG-in-ICO 字节（+ 头字节单测）
- [x] `manifest.ts`：webmanifest / manifest.json / `<head>` 片段（+ 合法性单测）
- [x] 四目标 `targets/{favicon,ios,extension,single}`（+ 文件清单/路径一致性单测）
- [x] `buildBundle` + `zip`：编排 + JSZip + 下载
- [x] `ExportPanel`：目标 tabs + 文件清单/代码预览 + 一键复制 + 下载 .zip
- [x] 错误处理：渲染重试、剪贴板降级、ico 校验、非法 hex 标红

## ✅ M3 — 加料（已完成）

- [x] 通用字形模型：`iconSource` 增 `viewBox` + `paint`(stroke/fill)，`buildMasterSVG` 按之缩放/上色
- [x] 多图标库 CDN 加载（jsDelivr）：Tabler(24 stroke) / Phosphor(256 fill) / Simple(24 fill 品牌)
  - 名称列表走 flat listing API（缓存 sessionStorage），缩略图用 `<img>`，选中拉取 + normalize
  - 加载失败回退提示；Simple Icons 商标提示
- [x] 上传 SVG：清洗(script/外链/事件属性/foreignObject) + 校验 + 100KB 上限 + normalize
- [x] 极速入口 QuickStart：关键词 → 确定性字形(同义词表+名称匹配) + hash 配色 → 一键生成（无图像生成）
- [x] iOS squircle 背景预设（M1 已含）
- [x] 单测：normalize/sanitize、quickstart matcher；浏览器 E2E 全流程通过（含五库切换/上传/导出）

**验收**：`pnpm test`(39 通过) · `typecheck` · `build` 均通过；浏览器端到端零控制台错误。

## ✅ M3.1 — 更多图标源（已完成）

- [x] 通用 currentColor 支持：`normalizeSvg` 全文扫描判定 stroke/fill；`buildMasterSVG`
      在字形组上加 `color`，让内部 `currentColor`（Iconify/Feather 等）解析为图标色
- [x] **Feather**（286，24 stroke）：jsDelivr CDN，复用 CDN_LIBS
- [x] **Iconify**（20 万+ 聚合）：搜索式 provider，search API + svg 缩略图 + 按需 normalize
- [x] **Untitled UI**（1179，24 stroke）：解析 `index.mjs` 取名、按需解析 `{Name}.mjs` 路径数据；
      无 SVG 端点 → 缩略图内联渲染（IntersectionObserver 懒加载）
- [x] provider 抽象统一多源；`searchNames` 大小写不敏感（修复 PascalCase 搜索）
- [x] 修复切库瞬间「旧库名错配新库 URL」导致的 404（names 按 provider 归属隔离）
- [x] 单测：iconifyUrl / parseUntitledComponent / searchNames；浏览器 E2E 七库切换 + 导出，零 404 零控制台错误

## 留作 M4（锦上添花，本轮不做）

- 框架感知配套代码（Next.js App Router 文件约定、Vite 专属说明）
- iOS `AppIcon.appiconset/Contents.json` 完整工程包
- Android maskable 图标（~20% 安全边距）
- 视觉快照回归 / Playwright E2E
- CDN 缩略图首屏加载较慢（jsDelivr 冷缓存 ~3s/图），可考虑预取名称或本地代理
