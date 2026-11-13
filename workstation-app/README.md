# 教师班主任工作台 · 桌面版打包说明

这个目录把 `web/index.html`（浏览器版同一个文件）打包成 Windows 桌面 exe。
你只需要维护 `../web/index.html`，这里的 `app/` 是打包前自动同步的产物，不用手改。

## 目录结构

```
workstation-app/
├── main.js          Electron 主进程（内置 AI 中转，监听 127.0.0.1:8787）
├── icon.js          应用图标生成器（node icon.js，产物在 build/icons/）
├── sync-assets.js   打包前把 ../web/ 的 index.html 等同步到 app/
├── pack-core.bat    核心打包脚本（同步 → 生成图标 → 打包 → 归档到 releases/）
├── pack.bat         双击手动打包（调用 pack-core.bat，带暂停窗口）
├── releases/        打好的 exe 归档目录（不进 git）
└── app/             同步出来的网页资源（打进 exe，不进 git）
```

## 日常发新版（推荐流程）

1. 改 `../web/index.html`（功能、界面、AI 提示词……随便改）。
2. 需要改版本号就打开 `package.json`，把 `version` 加一位（如 2.0.1 → 2.0.2）。
   版本号会写进 exe 文件名和「关于」页。
3. 提交代码：
   ```
   git add -A
   git commit -m "v2.0.2 说明这次改了什么"
   ```
   **提交时 post-commit 钩子会自动打包**（约 1-2 分钟），打好的 exe 归档到：
   ```
   workstation-app/releases/教师班主任工作台-desktop-2.0.2.exe
   ```
   把 releases 里的 exe 拷给同事即可（单文件、免安装，数据存在
   `%APPDATA%\teacher-workstation`，拷 exe 换个电脑也能接着用）。

不想自动打包时（比如只提交了个错别字）：

临时设置 `SKIP_PACK` 变量再提交即可跳过：
```
:: Windows cmd
set SKIP_PACK=1
git add -A
git commit -m "..."
set SKIP_PACK=

:: Git Bash / macOS / Linux
SKIP_PACK=1 git commit -m "..."
```
也可以每次提交后手动双击 `pack.bat` 补打。

## 手动打包（不经过 git）

双击 `pack.bat`，或直接运行：
```
cd workstation-app
pack-core.bat
```

## 第一次在新电脑上配置

需要 Node.js 18+（https://nodejs.org ）。然后：
```
cd workstation-app
npm install          （会自动走 .npmrc 里的国内镜像，下载 Electron 约 100MB）
```
之后每次打包都不再需要网络。

> 国内镜像配置在 `.npmrc`（electron / electron-builder 二进制都走 npmmirror），
> 所以 GitHub 下载不通也没关系。

## 上传 GitHub 自动打包（云端）

仓库已配置 `.github/workflows/build-desktop.yml`：
- 打 tag 推送：`git tag v2.0.2 && git push origin main v2.0.2`
  → GitHub Actions 自动构建 Windows / macOS / Linux 三个平台，
  并创建带下载附件的 GitHub Release。
- 没有 tag 时也可以手动触发：GitHub 页面 Actions → 构建桌面版 → Run workflow。
- 平时只提交 main（不带 v 前缀的改动）不会自动发 Release，只有 tag 会发。

## 版本说明

| 文件 | 作用 |
|---|---|
| `main.js` | Electron 壳 + 内置 AI 中转（127.0.0.1:8787，等价于 web 版的 ai-proxy.js，不用再单独开 node） |
| `icon.js` | 纯 Node 生成 ico/icns/png 图标，无第三方依赖 |
| `sync-assets.js` | 打包前同步 web/ → app/，保证 exe 里永远是最新的网页 |

## 常见问题

- **打包报 EBUSY/文件被占用**：正常现象，脚本内置了重试（换新目录再打）。
  也可以先把杀毒软件的实时扫描暂停一下。
- **releases 里 exe 打不开 / 被杀软报毒**：未签名的 Electron 程序常见误报，
  属正常。需要正式签名可配 win.sign（证书在 machine 上配置）。
- **exe 里的数据哪来的**：首次启动是空数据。把浏览器版数据带过去：
  浏览器版「设置 → 数据与备份 → 导出备份」，exe 版「欢迎页 → 从备份恢复」。
