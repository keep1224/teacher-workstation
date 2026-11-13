/*
  教师班主任工作台 · Electron 桌面版主进程
  - 加载 app/index.html（由 sync-assets.js 从 web/ 目录同步过来）
  - 内置 AI 中转（功能与 ai-proxy.js 相同），监听 127.0.0.1:8787，无需单独装 Node 跑代理
  - 支持 window.open 打印（打印值日表 / 课表）：打印直接发送到系统默认打印机
  - 备份、CSV、日历导出等下载行为保持原样，保存到系统「下载」文件夹

  数据位置：Electron 独立存储，在 %APPDATA%\teacher-workstation
  （与浏览器里的 localStorage 相互独立；两边迁移请用应用内的「导出备份 / 从备份恢复」）

  Developed by @赛博老爸
*/
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PROXY_PORT = 8787;

// ---------- AI 中转（内置版，与 ai-proxy.js 行为一致）----------
const SKIP = { host: 1, origin: 1, referer: 1, connection: 1, 'content-length': 1 };

function startAiProxy() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const target = decodeURIComponent(req.url.slice(1));
    if (!/^https?:\/\//.test(target)) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('AI 中转运行中（内置于桌面版）。请在工作台把接口地址改成：http://127.0.0.1:' + PROXY_PORT + '/ + 原地址，例如 http://127.0.0.1:' + PROXY_PORT + '/https://api.deepseek.com');
      return;
    }
    let u;
    try { u = new URL(target); } catch (e) { res.writeHead(400); res.end('地址格式不对'); return; }

    const headers = {};
    Object.keys(req.headers).forEach((k) => { if (!SKIP[k]) headers[k] = req.headers[k]; });
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (body.length) headers['content-length'] = body.length;
      const lib = u.protocol === 'https:' ? https : http;
      const up = lib.request(u, { method: req.method, headers }, (r) => {
        const h = {};
        Object.keys(r.headers).forEach((k) => { if (k.indexOf('access-control-') !== 0) h[k] = r.headers[k]; });
        h['Access-Control-Allow-Origin'] = '*';
        res.writeHead(r.statusCode || 502, h);
        r.pipe(res);
      });
      up.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('中转失败：' + e.message);
      });
      up.end(body);
    });
  });

  server.on('error', (e) => {
    // 端口被占用（比如用户自己还在跑 node ai-proxy.js）时不影响主程序
    console.log('AI 中转启动失败：', e.message);
  });
  server.listen(PROXY_PORT, '127.0.0.1');
}

// ---------- 窗口 ----------
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    title: '教师班主任工作台',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icons', 'teacher-workstation.png')
  });
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // 页面用 window.open('') 开打印窗口（值日表 / 课表打印）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url || url === 'about:blank') {
      // 打印子窗口：稍大一点，打印完由页面自己 win.close()
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 820, height: 900, title: '打印预览', show: true, autoHideMenuBar: true
        }
      };
    }
    return { action: 'allow' };
  });

  // 页面里的 window.print() 在 Electron 里直接发往系统默认打印机
  mainWindow.webContents.on('render-process-gone', () => {});

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startAiProxy();

  // 下载（备份 JSON、CSV、.ics、Word 等）走系统默认下载文件夹，保持原有行为
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(true));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
