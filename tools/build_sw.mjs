// Buat public/sw.js: service worker yang menyimpan semua file game supaya bisa dimainkan offline.
// Dijalankan otomatis oleh `npm run deploy`. Nama cache memakai versi di package.json,
// jadi setiap rilis baru, HP pemain mengunduh ulang file yang berubah lalu menghapus cache lama.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");
const { version } = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f !== "sw.js" && !/\.txt$/i.test(f)) files.push(relative(pub, p).split("\\").join("/"));
  }
})(pub);
files.sort();

// hash isi file supaya perubahan tanpa naik versi pun tetap memicu update
const h = createHash("sha1");
for (const f of files) h.update(f).update(readFileSync(join(pub, f)));
const cacheName = `watchsball-${version}-${h.digest("hex").slice(0, 8)}`;

const sw = `// Dibuat otomatis oleh tools/build_sw.mjs. Jangan diedit manual.
const CACHE = ${JSON.stringify(cacheName)};
const FILES = ${JSON.stringify(["./", ...files], null, 0)};

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
`;
writeFileSync(join(pub, "sw.js"), sw);
console.log(`sw.js: ${cacheName}, ${files.length + 1} file disimpan untuk offline`);
