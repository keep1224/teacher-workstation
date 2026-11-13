# 教师班主任工作台

给班主任 / 任课老师的工作台：课表、考勤、全科成绩、作业、学生档案、值日表、AI 助手。
单文件应用（`web/index.html`），数据只存在你自己电脑上，不上传任何服务器。

- 使用说明：[web/README.md](web/README.md)
- 更新日志：[web/CHANGELOG.md](web/CHANGELOG.md)
- 开源协议（非商业）：[web/LICENSE](web/LICENSE)

## 目录结构

```
web/                应用本体（单文件 index.html）+ PWA 文件（manifest.json / sw.js）+ 文档 + 截图
workstation-app/    Electron 桌面版（Windows 便携 exe / macOS dmg / Linux AppImage）
.github/workflows/  CI：打 tag 自动出三平台 Release
```

## 手机浏览器版（PWA）

`web/` 里的 `index.html`、`manifest.json`、`sw.js` 放到任意 http(s) 地址，手机浏览器打开并「安装到主屏幕」即可。
电脑上快速预览：

```bash
npx serve web
# 手机连同一局域网访问 http://<电脑IP>:3000
```

## 桌面版

### 本地打包（Windows）

需要 Node.js 18 以上，在 `workstation-app/` 下双击 `pack.bat`（或手动 `npm run build`），
产物在 `workstation-app/dist/`。

### 自动打包（GitHub Actions）

推 tag 即出 Release：

```bash
git tag v2.1.0 && git push origin v2.1.0
```

三平台产物（Windows portable exe / macOS dmg / Linux AppImage）自动附在 Release 页。

## 发新版流程

1. 改 `web/index.html`
2. 更新 `web/CHANGELOG.md`
3. 改 `workstation-app/package.json` 里的 `version`
4. 提交 → 打 tag → 推 tag

桌面版内置 AI 中转（等价于 `web/ai-proxy.js`），打包时 `sync-assets.js` 会把 `web/` 的最新文件同步进 `workstation-app/app/`。

---

Developed by @赛博老爸
