// オフラインでも起動できるようにするための Service Worker（Web 版のみ。Android アプリでは使わない）
// ・ページ本体（index.html）は「通信を優先し、つながらないときは保存済みのものを使う」。
//   通信できるときは常に最新版が表示され、更新のたびにこのファイルを書き換える必要はない。
// ・アイコンなどの小さなファイルは「保存済みを優先」。
// ・別のサイトへの通信（更新の確認で使う GitHub の API など）には関与しない。
const CACHE = 'gdt-drill-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isPage) {
    // 通信を優先。取得できたら保存し直す。つながらないときは保存済みのページを返す
    e.respondWith(fetch(req.url, {cache: 'no-store', credentials: 'same-origin'})
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        return res;
      })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  // それ以外：保存済みを優先し、なければ取得して保存する
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
