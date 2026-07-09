# Liquid Glass Design Skill

<p align="left">
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&logo=github&label=Stars"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&label=License"></a>
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-44cc11?style=for-the-badge"></a>
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.skill"><img alt="Download Skill" src="https://img.shields.io/github/v/release/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&label=Download%20Skill&color=2563eb"></a>
</p>

一套面向 AI Agent 的 Liquid Glass 设计与实现 Skill，用于生成、升级和审查高品质液态玻璃界面。它包含 CSS/SVG 折射、Canvas displacement map、React 组件模板、视觉 QA、打包脚本和可执行 smoke eval。

![Liquid Glass preview](https://raw.githubusercontent.com/xinlingfeiwu/liquid-glass-design-skill/gh-pages/preview/preview-latest.png)

在线 Demo：[Vanilla](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/vanilla/) | [React](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/react/) | [Web Component](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/web-component/)

## 加入 QQ 群

扫码加入 `liquid-glass-skill` 群聊。

<img src="docs/qq-group-qrcode-20260707.png" alt="liquid-glass-skill QQ 群二维码" width="320">

## 安装

克隆仓库：

```bash
git clone https://github.com/xinlingfeiwu/liquid-glass-design-skill.git
cd liquid-glass-design-skill
```

### Codex

```bash
mkdir -p ~/.codex/skills
ln -sf "$(pwd)/skills/liquid-glass-design" ~/.codex/skills/liquid-glass-design
```

推荐提示词：

```text
Use $liquid-glass-design to upgrade this existing UI into premium Liquid Glass without replacing the product context. Fix hierarchy, overlap, clipped rims, and dock/toolbar centering before tuning glass. Verify with screenshots plus browser geometry checks.
```

### Cowork / `.skill` 上传

可以直接下载最新 Release 资产：

- Full 包：[liquid-glass-design.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.skill)
- Lean 包：[liquid-glass-design.lean.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.lean.skill)

也可以本地打包：

```bash
node skills/liquid-glass-design/scripts/package-skill.mjs
node skills/liquid-glass-design/scripts/package-skill.mjs --lean
```

然后在 Cowork 设置中上传 `dist/liquid-glass-design.skill` 或 `dist/liquid-glass-design.lean.skill`。Full 包保留 eval/dev 资源；Lean 包会剔除 `evals/`、`agents/openai.yaml`、研究记录、模板 lockfile 和 eval-only 脚本。

### Claude Code / Plugin

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)/skills/liquid-glass-design" ~/.claude/skills/liquid-glass-design
```

也可以使用 Claude Code 插件/marketplace 方式安装。本仓库已经提供真实目录结构的 `.claude-plugin/` 和 `.codex-plugin/` 元数据，不依赖 symlink 或 `../` 逃逸路径：

```bash
claude plugin validate --strict .
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin marketplace add "$(pwd)" --scope user
claude plugin install liquid-glass-design@liquid-glass-design-skill
```

如果机器上没有全局 `claude` 命令，可以用仓库脚本执行隔离安装烟测：

```bash
npm run plugin:claude:install-smoke
```

该脚本会在临时 Claude home 中添加本仓库 marketplace、安装 `liquid-glass-design@liquid-glass-design-skill`，并通过 `plugin list` 验证安装结果。`skills/liquid-glass-design/LICENSE` 会随 skill 文件夹一起分发。

### NPM 包

如果要把能力集成进真实产品，可以复制模板目录，也可以在 release 发布后安装 npm 包：

```bash
npm install liquid-glass-core @liquid-glass-design/react
```

发布前可先检查包内容：

```bash
npm pack --dry-run ./packages/liquid-glass-core
npm pack --dry-run ./packages/react-liquid-glass
```

`liquid-glass-core` 暴露 displacement pixels、自适应 tint、浏览器能力检测等共享能力；`@liquid-glass-design/react` 暴露 `<LiquidGlass>` 组件、CSS 和类型声明。打 tag 后 release workflow 会在存在 `NPM_TOKEN` 或启用 GitHub Actions Trusted Publishing 且设置 `NPM_PUBLISH_ENABLED=1` 时执行 `npm run npm:publish`，并开启 provenance；已经存在的版本会自动跳过。

## 使用方式

- 新建高品质界面：先选 `design-recipes.md` 中的构图配方，再按 `golden-glass-style.md` 选择 production 或 showcase 默认值。
- 升级现有产品：先修层级、重叠、裁切、Dock 居中，再调折射、边缘光、色差和 glare。
- 做 React 组件：使用 `assets/templates/react-liquid-glass/`，保持 props、类型声明和 SSR fallback。
- 做跨框架组件：使用 `assets/templates/web-component-liquid-glass/`，直接提供可移植的 `<liquid-glass>` custom element。
- 做 Electron 集成：读取 `references/electron.md`，先处理窗口、拖拽区、renderer 缓存和平台 fallback。
- 做视觉验收：使用 `check-visual-geometry.mjs` 检查重叠、居中、viewport containment、fallback、contrast 和 committed baseline 像素回归。

## 模板可移植性

三个模板目录都是可独立拷贝的：`vanilla-liquid-glass/`、`web-component-liquid-glass/`、`react-liquid-glass/` 内部都带有由共享 core 生成的 `liquid-glass-core.js`，复制模板目录时不需要再额外复制 `assets/core/`。

维护本仓库时，只修改 `skills/liquid-glass-design/assets/core/liquid-glass-core.js`，然后执行：

```bash
npm run sync:templates
```

不要直接改模板目录里的生成版 `liquid-glass-core.js`；CI 会运行 `npm run sync:templates:check` 检查漂移。

## 运行 Demo

Vanilla：

```bash
npm run dev:vanilla
```

打开 `http://127.0.0.1:4173/`。

React：

```bash
cd skills/liquid-glass-design/assets/templates/react-liquid-glass
npm install
npm run dev
```

Web Component：

```bash
npm run dev:web-component
```

打开 `http://127.0.0.1:4174/`。

任意 HTML/框架里可直接使用：

```html
<script type="module" src="./liquid-glass-element.js"></script>

<liquid-glass radius="34" profile="prominent" strength="142" dispersion="0.035" adaptive interactive>
  Controls
</liquid-glass>
```

## 自适应玻璃

当控件会跨越亮色媒体、暗色面板、饱和渐变或复杂产品内容时，开启自适应玻璃。运行时会低频采样表面背后的亮度，并自动写入 tint、border、saturate、brightness、contrast 相关 CSS 变量：

```html
<button
  class="lg-surface lg-button"
  data-lg-refraction
  data-lg-adaptive
  data-lg-adaptive-inset="0.18"
  data-lg-adaptive-throttle="160"
>
  Play
</button>
```

```jsx
<LiquidGlass adaptive={{ sampleInset: 0.18, throttleMs: 160 }} interactive>
  Play
</LiquidGlass>
```

调试时可查看 `data-lg-adaptive-mode="bright|balanced|dark"` 和 `data-lg-adaptive-luminance`。它通过节流控制器在挂载、resize、scroll 和主动切换背景时更新，离屏表面会通过 `IntersectionObserver` 暂停采样，不会每帧采样。

自适应采样可以读取 CSS 颜色/渐变，以及同源 `<img>`、`<video>`、`<canvas>` 像素。没有 CORS 的跨域媒体和不透明 CSS `url()` 背景会回退到 `fallbackLuminance`，关键文字区域仍建议保留明确 tint。

## 视觉 QA

```bash
npm i -D playwright && npx playwright install chromium
node skills/liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/ \
  --screenshot-dir ./shots \
  --adaptive \
  --contrast \
  --min-contrast 4.5
```

像素回归默认对比仓库内提交的 ROI 裁剪 baseline：

QA 脚本会检查重叠、居中、viewport containment、SVG/filter fallback、自适应 tint 是否同步、adaptive mode 是否在亮暗背景中切换、对比度和像素 baseline。

```bash
node skills/liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/ \
  --baseline-dir skills/liquid-glass-design/evals/baselines \
  --full-page \
  --pixel-channel-threshold 24 \
  --roi-roles dock,focus \
  --roi-baseline-only \
  --roi-pixel-threshold 0.08
```

只有视觉变化是有意的，才更新 baseline：

```bash
npm run qa:vanilla:update-baseline
git diff -- skills/liquid-glass-design/evals/baselines
```

验证 fallback：

```bash
npm run qa:vanilla:fallback
npm run qa:vanilla:webkit-detect
npm run qa:vanilla:reduced-motion
```

仓库里的 baseline PNG 只用于 CI 视觉回归，不会进入 full/lean `.skill` 分发包。CI 会一次性发布 GitHub Pages bundle，里面同时包含 `preview/preview-latest.png`、`demo/vanilla/`、`demo/react/` 和 `demo/web-component/`，因此预览图和在线 Demo 不会互相覆盖。

## 校验

需要 Node 20 或更新版本。CI、release 和 nightly behavior eval 会固定使用 Node 24，以保证浏览器截图和发布链路可复现。

```bash
npm test
```

React 模板：

```bash
cd skills/liquid-glass-design/assets/templates/react-liquid-glass
npm ci
npm run build
```

## 关键原则

- `golden-glass-style.md` 是唯一默认参数来源。
- Production 和 Showcase 两档要先选清楚。
- 先做构图，再调玻璃。
- 只在控制层、导航层、浮层使用玻璃，不把内容层整屏玻璃化。
- 使用测量过的 `feDisplacementMap` scale，不猜参数。
- 禁止 `background-attachment: fixed` 背景克隆，禁止 `feOffset` 整通道色偏。
- 交付前必须有截图或可测量 QA 结果。

## License

MIT
