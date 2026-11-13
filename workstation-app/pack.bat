@echo off
chcp 65001 >nul
rem ============================================================
rem  教师班主任工作台 · 手动打包（双击本文件即可）
rem  产出：workstation-app\dist_N\教师班主任工作台-desktop-x.x.x.exe
rem  发新版前：先改 index.html，并把 package.json 里的 version +0.1
rem ============================================================
setlocal
call "%~dp0pack-core.bat"
if errorlevel 1 (
  echo.
  echo 打包失败，请查看上方日志。
) else (
  echo.
  echo 完成！最新的 exe 见上方 "output dir"。
)
echo.
pause
