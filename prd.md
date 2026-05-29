# IconKit — 设计规格书

> 一句话定位：给 Web 开发者用的"快速设计资源生成器"。第一版只做一件事并做到位——**设计一次图标，一键导出某个场景需要的整套文件 + 可直接粘贴的样板代码**。
>
> 工作标题 `IconKit`，正式名待定（不影响开发）。

---

## 1. 目标（Goal）

复刻 [ray.so/icon](https://ray.so/icon) 的"字形 + 渐变背景"图标生成体验，并针对 Web 开发者的真实痛点做一处关键升级：把导出后那一堆脏活（生成 favicon 全套、apple-touch-icon、各尺寸、manifest、`<head>` 标签）自动化掉。

核心使用场景：用 Claude Code 之类的工具起一个新项目时手头没有图标，需要在几秒内生成一个看起来还不错的占位图标，并立刻拿到能直接落地到项目里的文件和代码。**关键词是「快」和「能用」，不是「精美的设计工具」。**

成功标准：从打开页面到拿到一套可用的 favicon（含 `<head>` 片段），全程不超过 30 秒、零手动改尺寸、零写样板代码。

---

## 2. 范围（Scope）

### 2.1 v1 必做（In Scope）

1. 三栏编辑器（沿用 ray.so 布局）：左侧图标库、中间画布、右侧调参。
2. 左栏多图标库：Lucide（默认）、Tabler、Phosphor、Simple Icons（品牌 logo）、上传自定义 SVG。
3. 中间画布 + **多尺寸实时预览**（16 / 32 / 180 / 512），让用户出图前就看见小尺寸是否糊。
4. 右栏完整复刻 ray.so 的 Presets / Fill Styles / Background / Icon 四组控件，外加一组 **iOS 风格 squircle 背景预设**。
5. **导出 bundle**（核心功能），四个目标：Favicon（网站）、iOS App、浏览器插件、单张 PNG。每个目标产出对应文件 + 配套代码片段，打包为 `.zip` 下载。
6. 配套代码：**plain-HTML 片段为必做底线**（万能，任何项目可用）。
7. 极速入口：输入项目名 → 按关键词**确定性匹配**一个字形 + 随机一套配色 → 一键成图。
8. 全程纯前端、可静态部署。

### 2.2 锦上添花（Stretch，做不完可砍，不影响主流程）

- 框架感知的配套代码：Next.js app router 文件约定说明、Vite 专属说明。
- iOS `AppIcon.appiconset/Contents.json` 完整工程包（默认只给单张 1024）。

### 2.3 明确不做（Out of Scope）

- **自由画布式的宣传图编辑器**（Hero / Banner 的自由排版）。这是另一个产品，会把工具拖成"更难用的 Canva"。
- **模板化宣传图 / OG 图**（og:image、GitHub social 等）。属于规划中的 Phase B，本规格书不涵盖。
- **AI 生成图标像素**。理由：AI 位图图标在 favicon 尺寸下糊、不锐利，且"等生成"违背"秒出"初衷。极速入口用的是确定性关键词匹配，不是图像生成。
- **Android maskable 图标**（需 ~20% 安全边距）。正确但属边角，留到 v1.1。
- 后端、账号体系、云端保存。v1 不需要。

---

## 3. 架构（Architecture）

纯前端单页应用，无后端。

- 框架：Next.js（App Router）+ TypeScript + Tailwind CSS。
- 部署：静态导出，托管到 Vercel / Cloudflare Pages。
- 关键库：图标库各自的 npm 包或 CDN（lucide、@tabler/icons、phosphor-icons、simple-icons）；`JSZip` 打包；`.ico` 生成自己拼字节或引入轻量库。
- 状态：单一中心状态对象 `IconState`（见 §5），所有面板读写它；画布与各产物都是它的纯函数派生结果。
- 渲染基准：以一张 512×512 的"主 SVG"为唯一真相来源，所有 PNG / ICO / 各尺寸都从它派生，保证一致性。

无服务器调用意味着：没有成本、没有上传隐私问题、可离线工作。

---

## 4. 组件（Components）

### 4.1 顶栏（TopBar）
- 文件名输入框（默认 `icon.png`，可编辑）。
- Undo / Redo。
- "导出整套 ▾" 下拉，触发导出面板（见 §4.5）。
- 依赖：`IconState`、历史栈。

### 4.2 左栏 — 图标库选择器（IconPicker）
- 库切换标签：Lucide / Tabler / Phosphor / Simple Icons / 上传 SVG。
- 搜索框（按图标名模糊搜索）。
- 图标网格，点击选中即写入 `IconState.iconSource`。
- 上传 SVG：本地读取，做基本清洗（剥离 `<script>`、外链、事件属性），校验确为 SVG，限制体积。
- Simple Icons 选中时显示商标提示："品牌 logo 适合 demo / 占位，正式发布产品 logo 请注意商标风险"。
- 依赖：各图标库数据；写 `IconState`。

### 4.3 中栏 — 画布与预览（Canvas）
- 主预览：512 画布，棋盘格透明底，渲染当前主 SVG。
- 多尺寸预览条：16 / 32 / 180 / 512 同步渲染。
- 尺寸读数（如 `512 × 512`）。
- 小尺寸清晰度提示：当字形在 16px 下细节过密时给一句轻提醒（启发式，非强制）。
- 依赖：读 `IconState` → 主 SVG → 各尺寸 canvas。

### 4.4 右栏 — 调参面板（Controls）
完整复刻 ray.so，分组：
- **Presets**：渐变/纯色预设方块网格，点击套用整组 fill。
- **Fill Styles**：Fill Type（Linear / Radial / Solid）、Primary color、Secondary color、Angle。
- **Background**：Radial glare、Noise texture、Noise opacity、Radius、Stroke size、Stroke color。
- **Icon**：Color、Size、X Offset、Y Offset。
- **新增 — iOS 背景预设**：一组按 iOS 超椭圆（squircle）形状 + 典型配色生成的背景预设；选中后背景形状切换为 squircle（区别于普通圆角矩形）。
- 依赖：读写 `IconState`。

### 4.5 导出面板（ExportPanel）— 核心
- 目标选择器：`Favicon | iOS | Extension | Single`。
- 选中后展示将打包的文件清单 + 配套代码预览（可一键复制）。
- "下载 .zip" 按钮；Single 目标额外提供 复制图片 / 复制 SVG / 复制 dataURL。
- 各目标产物：

  | 目标 | 文件 | 配套代码 |
  |---|---|---|
  | Favicon | `favicon.ico`(32) · `icon.svg` · `apple-touch-icon.png`(180) · `icon-192.png` · `icon-512.png` · `manifest.webmanifest` | 4 行 `<head>` link + manifest 内容 |
  | iOS App | `AppIcon-1024.png`（方形、无 alpha、不预先圆角）；可选 appiconset | Xcode 拖入说明 |
  | Extension | `icon-16/32/48/128.png` | `manifest.json` 的 `icons` + `action.default_icon` |
  | Single | 一张 PNG（默认 512，可自定义尺寸） | 复制 图片 / SVG / dataURL |

- 正确性约束（写进实现验收）：iOS 1024 必须无透明通道、不自带圆角（系统负责倒角）；SVG favicon 为矢量；`.ico` 仅含 32；插件四尺寸严格为 16/32/48/128。
- 依赖：主 SVG → 渲染管线（§5）→ JSZip。

### 4.6 极速入口（QuickStart）
- 入口：首屏一个输入框"输入项目名 / 关键词"。
- 逻辑：关键词 → 在默认图标库里**确定性匹配**最贴近的字形（同义词表 + 名称匹配）；同时从配色预设里随机/按 hash 选一套。
- 产出：直接生成一个图标并进入编辑器，用户可继续微调或直接导出。
- 明确不调用任何图像生成模型。

---

## 5. 数据流（Data Flow）

### 5.1 中心状态对象

```ts
type IconState = {
  iconSource: {
    lib: 'lucide' | 'tabler' | 'phosphor' | 'simple' | 'upload';
    name: string;
    svg: string;            // 归一化后的字形 SVG（path 数据）
  };
  fill: {
    type: 'linear' | 'radial' | 'solid';
    primary: string;        // hex
    secondary: string;      // hex
    angle: number;          // 度
  };
  background: {
    shape: 'rounded' | 'squircle';
    radius: number;         // px
    radialGlare: boolean;
    noiseTexture: boolean;
    noiseOpacity: number;   // %
    strokeSize: number;     // px
    strokeColor: string;    // hex
  };
  icon: {
    color: string;          // hex
    size: number;           // px
    xOffset: number;        // px
    yOffset: number;        // px
  };
  meta: { filename: string };
};
```

### 5.2 渲染管线（单向、纯函数）

```
IconState
   │  buildMasterSVG()        // 唯一真相来源，512 viewBox：背景形状 + 渐变/noise/stroke + 居中偏移的字形
   ▼
主 SVG (string)
   ├─ serialize()        ───────────────▶  icon.svg（SVG favicon）
   ├─ rasterize(svg, N)  ─ canvas.toBlob ▶  各尺寸 PNG（16/32/48/128/180/192/512/1024）
   │                                         iOS 目标：去除 alpha、不加圆角
   └─ rasterize(svg, 32) → wrapAsICO()  ──▶  favicon.ico
                                         │
   生成 manifest.webmanifest / manifest.json / <head> 片段（按目标模板填充）
                                         ▼
                                   JSZip 打包 ─▶ 触发浏览器下载 .zip
```

- 所有面板编辑只改 `IconState`；画布与导出都是它的派生，互不耦合。
- 历史栈记录 `IconState` 快照，支撑 Undo / Redo。

---

## 6. 错误处理（Error Handling）

- **图标库加载失败**：库切换或图标加载异常时，回退到 Lucide 默认集并提示"该图标库暂不可用"。
- **上传 SVG 不合法 / 含脚本**：清洗后若仍非法或超体积上限，拒绝并提示原因，不写入状态。
- **颜色输入非法**：hex 校验失败时保留上一个有效值，输入框标红，不让非法值进入渲染。
- **`canvas.toBlob` 返回 null**：重试一次，仍失败则提示"该尺寸渲染失败，请重试"，不产出半成品 zip。
- **剪贴板不可用**（部分浏览器 / 非 HTTPS 下 `navigator.clipboard` 缺失）：复制类操作自动降级为下载文件，并提示已改为下载。
- **`.ico` 生成**：确保走 PNG-in-ICO；字节拼装后校验文件头，异常则在 zip 中省略 ico 并在说明里注明。
- **小尺寸清晰度**：仅提醒、不阻断（用户有权坚持导出）。

---

## 7. 测试方法（Testing）

- **单元测试**
  - `buildMasterSVG(state)` 对相同输入产出确定性、稳定的 SVG（快照）。
  - `wrapAsICO()` 产出的字节头符合 ICO 规范、可被系统识别为 32×32。
  - 生成的 `manifest.webmanifest` / `manifest.json` 为合法 JSON 且字段齐全。
  - 文件名 / 上传 SVG 清洗逻辑（XSS、非法字符）。
- **视觉快照**：各目标尺寸渲染出的 PNG 与基线对比，防回归。
- **正确性断言**（针对"别人做错我们做对"的点）
  - iOS 1024 PNG 无 alpha 通道、四角为方角（不自带圆角）。
  - 插件导出严格只有 16/32/48/128 四个文件。
  - Favicon 目标 zip 内文件名与 `<head>` 片段引用路径一致。
- **端到端（Playwright）**：选图标 → 套预设 → 选 Favicon → 导出，断言 zip 内文件清单完整、代码片段可复制。
- **跨浏览器**：在缺失剪贴板 API 的环境下验证下载降级路径。

---

## 8. 里程碑建议（非约束）

1. **M1 复刻**：三栏 + Lucide + 右栏全套控件 + 单张 PNG 导出。对齐 ray.so。
2. **M2 命门**：导出 bundle 四目标 + plain-HTML 配套代码 + JSZip 打包。
3. **M3 加料**：多图标库（Tabler/Phosphor/Simple Icons）+ 上传 SVG + iOS squircle 预设 + 多尺寸预览 + 极速入口。
4. **M4 锦上添花**：框架感知代码片段、appiconset、maskable。

到 M2 结束，产品就已经比 ray.so 对 Web 开发者更有用了。