#!/usr/bin/env node
/*
  同步 web/index.html 到 app/ 目录（打包前自动运行）
  每次更新 index.html 后，重新打包就会得到新版 exe。
*/
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'web');
const APP_DIR = path.join(__dirname, 'app');

fs.mkdirSync(APP_DIR, { recursive: true });

// 只同步应用本体和 PWA 文件（截图、文档不进 exe）
const SYNC_NAMES = ['index.html', 'manifest.json', 'sw.js'];
let count = 0;
for (const name of SYNC_NAMES) {
  const src = path.join(SRC_DIR, name);
  if (!fs.existsSync(src)) {
    console.error('没找到 web/' + name + (name === 'index.html' ? '，同步失败' : '（跳过）'));
    if (name === 'index.html') process.exit(1);
    continue;
  }
  const dest = path.join(APP_DIR, name);
  const stat = fs.statSync(src);
  fs.copyFileSync(src, dest);
  count++;
  console.log('同步：', name, '(' + (stat.size / 1024).toFixed(1) + ' KB)');
}
if (count === 0) {
  console.error('没找到 web/index.html，同步失败');
  process.exit(1);
}
