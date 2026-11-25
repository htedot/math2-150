/*
  数二·150 工作台 — Service Worker

  1) 让浏览器判定为「可安装应用」（Chrome/Edge 的 WebAPK 安装要求页面有 fetch 处理器）
  2) 真正离线可用：断网也能打开

  更新策略：导航请求网络优先（拿到新版就顺带更新缓存），静态资源缓存优先。
  发新版时把 VERSION 加一，旧缓存会在 activate 时清掉。
  注意：本文件必须保持纯 ASCII 注释或用写工具以 UTF-8 保存，
        不要用 PowerShell 的 Get-Content | Set-Content 改写（会把中文打成乱码并吃掉换行）。
*/

const VERSION = 'v6';
const CACHE = 'math2-150-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon-16.png',
  './favicon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;

  // 页面导航：网络优先，失败回落到缓存（离线也能打开）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // 图标 / manifest 等：缓存优先
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});