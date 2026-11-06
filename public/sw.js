// Dibuat otomatis oleh tools/build_sw.mjs. Jangan diedit manual.
const CACHE = "watchsball-3.0.0-55938455";
const FILES = ["./","assets/apple-touch-icon.png","assets/balls/angin.webp","assets/balls/api.webp","assets/balls/batu.webp","assets/balls/bayangan.webp","assets/balls/bintang.webp","assets/balls/bom.webp","assets/balls/bunga.webp","assets/balls/cermin.webp","assets/balls/duri.webp","assets/balls/es.webp","assets/balls/gelembung.webp","assets/balls/hantu.webp","assets/balls/jamur.webp","assets/balls/karet.webp","assets/balls/kembar.webp","assets/balls/laser.webp","assets/balls/lubang.webp","assets/balls/magnet.webp","assets/balls/matahari.webp","assets/balls/meriam.webp","assets/balls/meteor.webp","assets/balls/naga.webp","assets/balls/pedang.webp","assets/balls/pedang_blade.webp","assets/balls/petasan.webp","assets/balls/petir.webp","assets/balls/portal.webp","assets/balls/racun.webp","assets/balls/raksasa.webp","assets/balls/tawon.webp","assets/balls/vampir.webp","assets/fonts/kenney-future-narrow.ttf","assets/fonts/kenney-future.ttf","assets/fx/circle_02.webp","assets/fx/circle_04.webp","assets/fx/dirt_01.webp","assets/fx/fire_01.webp","assets/fx/flame_02.webp","assets/fx/flare_01.webp","assets/fx/light_01.webp","assets/fx/magic_01.webp","assets/fx/magic_03.webp","assets/fx/muzzle_01.webp","assets/fx/scorch_01.webp","assets/fx/slash_02.webp","assets/fx/smoke_02.webp","assets/fx/smoke_07.webp","assets/fx/spark_01.webp","assets/fx/spark_04.webp","assets/fx/star_04.webp","assets/fx/star_07.webp","assets/fx/symbol_01.webp","assets/fx/trace_01.webp","assets/fx/twirl_01.webp","assets/icon-192.png","assets/icon-512.png","assets/music/battle1.mp3","assets/music/battle2.mp3","assets/music/battle3.mp3","assets/music/battle4.mp3","assets/music/battle5.mp3","assets/music/boss.mp3","assets/music/menu.mp3","assets/sfx/blade-0.mp3","assets/sfx/blade-1.mp3","assets/sfx/boom-0.mp3","assets/sfx/boom-1.mp3","assets/sfx/callout.mp3","assets/sfx/charge.mp3","assets/sfx/click.mp3","assets/sfx/coin-0.mp3","assets/sfx/coin-1.mp3","assets/sfx/count.mp3","assets/sfx/crit-0.mp3","assets/sfx/crit-1.mp3","assets/sfx/dash-0.mp3","assets/sfx/dash-1.mp3","assets/sfx/fight.mp3","assets/sfx/flame.mp3","assets/sfx/flawless.mp3","assets/sfx/freeze-0.mp3","assets/sfx/freeze-1.mp3","assets/sfx/ghost.mp3","assets/sfx/go.mp3","assets/sfx/heal.mp3","assets/sfx/heavy-0.mp3","assets/sfx/heavy-1.mp3","assets/sfx/hit-0.mp3","assets/sfx/hit-1.mp3","assets/sfx/hit-2.mp3","assets/sfx/hit-3.mp3","assets/sfx/hole.mp3","assets/sfx/ko.mp3","assets/sfx/laser-0.mp3","assets/sfx/laser-1.mp3","assets/sfx/launch.mp3","assets/sfx/legend.mp3","assets/sfx/lose.mp3","assets/sfx/meteorfall.mp3","assets/sfx/meteorhit-0.mp3","assets/sfx/meteorhit-1.mp3","assets/sfx/multikill.mp3","assets/sfx/nova.mp3","assets/sfx/petal-0.mp3","assets/sfx/petal-1.mp3","assets/sfx/pop-0.mp3","assets/sfx/pop-1.mp3","assets/sfx/portal-0.mp3","assets/sfx/portal-1.mp3","assets/sfx/pull.mp3","assets/sfx/reflect-0.mp3","assets/sfx/reflect-1.mp3","assets/sfx/reveal.mp3","assets/sfx/sfx.json","assets/sfx/shieldup.mp3","assets/sfx/shot.mp3","assets/sfx/split.mp3","assets/sfx/sting-0.mp3","assets/sfx/sting-1.mp3","assets/sfx/suddendeath.mp3","assets/sfx/v1.mp3","assets/sfx/v2.mp3","assets/sfx/v3.mp3","assets/sfx/whoosh-0.mp3","assets/sfx/whoosh-1.mp3","assets/sfx/win.mp3","assets/sfx/winner.mp3","assets/sfx/youlose.mp3","assets/sfx/youwin.mp3","assets/sfx/zap-0.mp3","assets/sfx/zap-1.mp3","assets/ui/btn-blue-down.png","assets/ui/btn-blue.png","assets/ui/btn-green-down.png","assets/ui/btn-green.png","assets/ui/btn-grey-down.png","assets/ui/btn-grey.png","assets/ui/btn-red-down.png","assets/ui/btn-red.png","assets/ui/btn-yellow-down.png","assets/ui/btn-yellow.png","assets/ui/card-blue.png","assets/ui/card-red.png","assets/ui/card.png","assets/ui/panel.png","assets/ui/star-empty.png","assets/ui/star.png","engine.js","index.html","manifest.webmanifest","patches.js","render.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("watchsball-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// halaman memanggil ini saat pemain menekan "Update"
self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

// ambil dari cache dulu (jalan offline), kalau tidak ada baru ke internet
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => (req.mode === "navigate" ? caches.match("./") : Response.error())))
  );
});
