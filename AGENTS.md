# 开发规范与注意事项

## 核心约定

- 回答和项目说明默认使用简体中文。
- 默认缩进为 4 个半角空格。
- 前端外观沿用 `VRChatAvatarLearn-Website` 的 Vite、原生 JavaScript、Material Design 3 Web Components 和应用壳风格。
- 后端 API 使用 Cloudflare Pages Functions / Workers 风格组织。

## 样式与主题

- `public/theme/` 下的主题文件视为 Material Theme Builder 导出产物，不手动修改。
- 可见 UI 颜色优先使用 `--md-sys-color-*` 等主题变量。
- 不使用外部 CDN，字体和图标通过 npm 依赖本地打包。

## Cloudflare 方向

- 前端页面只负责交互和展示，通过 `/api/*` 调用后端。
- 上传、鉴权、限频、R2 签名、转存等逻辑放在 `src/worker/`。
- `functions/api/[[path]].js` 只作为 Pages Functions 入口。
- 后续新增 D1、Queues、Durable Object 时，保持模块边界清晰。
