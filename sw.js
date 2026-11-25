/* 鏁颁簩路150 宸ヤ綔鍙?鈥?Service Worker
   浣滅敤鏈変簩锛?   1) 璁╂祻瑙堝櫒鍒ゅ畾涓恒€屽彲瀹夎搴旂敤銆嶏紙Chrome/Edge 鐨?WebAPK 瀹夎瑕佹眰椤甸潰鏈?fetch 澶勭悊鍣級锛?   2) 鐪熸绂荤嚎鍙敤锛氭柇缃戜篃鑳芥墦寮€銆?   鏇存柊绛栫暐锛氬鑸姹傝蛋缃戠粶浼樺厛锛堟嬁鍒版柊鐗堝氨椤哄甫鏇存柊缂撳瓨锛夛紝闈欐€佽祫婧愯蛋缂撳瓨浼樺厛銆?   鍙戞柊鐗堟椂鎶?VERSION 鍔犱竴锛屾棫鐨勭紦瀛樹細鍦?activate 鏃舵竻鎺夈€?*/

const VERSION = 'v3';
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

  // 椤甸潰瀵艰埅锛氱綉缁滀紭鍏堬紝澶辫触鍥炶惤鍒扮紦瀛橈紙绂荤嚎鍙墦寮€锛?  if (req.mode === 'navigate') {
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

  // 鍥炬爣 / manifest 绛夛細缂撳瓨浼樺厛
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
