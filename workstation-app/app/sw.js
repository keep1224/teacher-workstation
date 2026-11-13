/*
  教师班主任工作台 · PWA Service Worker
  - 离线时直接打开（index.html 单文件应用，数据存浏览器本地）
  - 支持「安装到主屏幕 / 添加到主屏幕」
  数据只存在本机，本文件不缓存任何用户数据。
*/
const CACHE = 'teacher-workstation-v1';
const CORE = ['index.html', 'manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // AI 接口等跨域请求不走缓存
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          if (res.ok && url.pathname.endsWith('.html')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('index.html'));
    })
  );
});
