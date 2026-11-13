@echo off
chcp 65001 >nul
rem ============================================================
rem  教师班主任工作台 · 一键打包脚本
rem  用法：在本文件夹里双击本文件（或在本目录运行 pack.bat）
rem  前置：电脑装有 Node.js 18 以上
rem  产物：workstation-app\dist\教师班主任工作台-desktop-x.x.x.exe
rem ============================================================
setlocal
cd /d "%~dp0.."

echo [1/4] 检查 Node.js ...
where node >nul 2>nul
if errorlevel 1 (
  echo 没找到 Node.js，请先安装：https://nodejs.org
  pause
  exit /b 1
)

echo [2/4] 安装依赖（首次打包会下载 Electron，需要几分钟）...
cd workstation-app
rem 国内镜像：electron 和 electron-builder 的二进制都走国内源，避免 GitHub 下载失败
set ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://cdn.npmmirror.com/binaries/electron-builder-binaries/
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo 依赖安装失败
  pause
  exit /b 1
)

echo [3/4] 同步最新 index.html 并打包 ...
call npm run build
if errorlevel 1 (
  echo 打包失败
  pause
  exit /b 1
)

echo [4/4] 完成！
dir dist\*.exe 2>nul
echo.
echo 新 exe 在 workstation-app\dist 文件夹里。
echo 发新版时：改 index.html → 更新 package.json 里的 version → 再双击本脚本。
pause
