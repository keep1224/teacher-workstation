@echo off
setlocal
rem ============================================================
rem  pack-core.bat (no pause) - shared build routine
rem  Used by pack.bat (manual) and git post-commit (auto).
rem  Each retry uses a FRESH numbered dist_N dir so Windows
rem  Defender real-time scan never locks app.asar mid-build.
rem  After success the portable exe is archived to releases\.
rem ============================================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [FAIL] Node.js not found. Install from https://nodejs.org
  exit /b 1
)

rem first run / missing deps - install from CN mirror
if not exist node_modules\electron\package.json (
  echo [dep] installing dependencies from CN mirror, first run...
  npm install --no-fund --no-audit --registry=https://registry.npmmirror.com
  if errorlevel 1 (
    echo [FAIL] npm install failed
    exit /b 1
  )
)

rem build tools are pre-seeded in the electron-builder cache;
rem point the binaries mirror at CN CDN in case anything still needs it
set ELECTRON_BUILDER_BINARIES_MIRROR=https://cdn.npmmirror.com/binaries/electron-builder-binaries/
set SZA_PATH=node_modules\7zip-bin\win\x64\7za.exe

rem sync the latest index.html into the app bundle
node sync-assets.js
if errorlevel 1 (
  echo [FAIL] sync-assets failed
  exit /b 1
)

rem Defender real-time scan can lock the freshly written asar for a while.
rem Wait before each attempt, use a fresh numbered dir, retry up to 6 times.
set /a N=0
:retry
set /a N+=1
if %N% GTR 6 exit /b 1
set OUT=dist_%N%
rmdir /s /q %OUT% 2>nul
if exist %OUT% (
  echo [retry] %OUT% cannot be removed yet, waiting...
  ping -n 9 127.0.0.1 >nul
) else (
  ping -n 5 127.0.0.1 >nul
)
node node_modules\electron-builder\cli.js --win portable -c.directories.output=%OUT%
if not errorlevel 1 goto ok
echo [retry %N%] output may be locked by Defender, waiting longer...
ping -n 9 127.0.0.1 >nul
goto retry

:ok
echo BUILD OK  output dir = %OUT%
if not exist releases mkdir releases
rem only the top-level portable exe is matched; helper exes live in subdirs
copy /y "%OUT%\*.exe" releases\ >nul 2>nul
echo archived to releases\:
dir /b releases\*.exe
exit /b 0
