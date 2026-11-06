# Watchsball

Game bola lawan bola: 30 bola berskill saling hajar di arena. Jagoin bolamu, menangkan koin, tarik bola baru di gacha.

## Main
- **Online:** https://watchsball.marlblue.workers.dev
- **Di PC (lokal):** jalankan `python -m http.server` di folder `public/`, lalu buka http://localhost:8000

## Deploy (Cloudflare Workers, gratis)
Jalankan dari folder `watchsball`:
```
npm run login     # sekali saja
npm run whoami    # cek akun
npm run deploy    # buat ulang sw.js (daftar file offline), lalu upload folder public/
```

## Render ulang sprite bola (Blender)
```
WB_NOFACE=1 "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python tools/render_balls.py -- public/assets/balls
```
Sprite di game dirender **tanpa wajah** (set `WB_NOFACE=1` sebelum menjalankan Blender), karena wajah anime digambar 2D di game oleh `drawFace` di `public/render.js` (atur mata, iris, mulut tiap bola di tabel `FACE`). Tambah argumen `api,es` di akhir untuk render bola tertentu saja. Hasilnya grid WebP 8x4 (32 frame putaran) per bola, cel-shading + garis luar. Laras/moncong selalu menghadap +X Blender, yang di game diputar ke arah gerak atau target (lihat `MODE` di `public/render.js`).

## Bangun ulang efek suara
Download paket CC0 (Kenney: Impact Sounds, Interface Sounds, Sci-fi Sounds, Music Jingles, Digital Audio, RPG Audio, Voiceover Pack: Fighter; OpenGameArt: dua paket musik Juhani Junkala), unzip, lalu:
```
node tools/build_sfx.mjs <folder1> [folder2 ...]
```
Daftar suara per kejadian ada di `MAP` di dalam script itu.

## Rilis versi baru
1. Tambah entri di paling atas `public/patches.js` (jenis: baru, buff, nerf, ubah, fix).
2. Naikkan `version` di `package.json`: bug kecil = x.y.**z**, fitur/bola baru = x.**y**.0, perubahan besar = **x**.0.0.
3. `npm run deploy`

## File
- `public/engine.js`: mesin battle (fisika, skill, damage). Angka balancing ada di objek `T`.
- `public/index.html`: tampilan, menu, gacha, koleksi, suara.
- `public/assets/balls/`: sprite bola 3D hasil render Blender.
- `public/render.js`: tampilan arena (arah hadap bola, efek benturan, partikel skill).
- `public/assets/fx/`: tekstur efek dari [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) (CC0).
- `public/patches.js`: catatan patch yang tampil di tombol PATCH.
- `public/assets/ui`, `fonts`: dari [Kenney UI Pack](https://kenney.nl/assets/ui-pack) (CC0).
- `public/assets/sfx`: dari paket audio Kenney (CC0): Impact, Interface, Sci-fi, Digital, RPG, Music Jingles, dan Voiceover Pack: Fighter. Dibangun oleh `tools/build_sfx.mjs`.
- `public/assets/music`: musik chiptune oleh Juhani Junkala (CC0), dari [5 Action Chiptunes](https://opengameart.org/content/5-chiptunes-action) dan [Chiptune Adventures](https://opengameart.org/content/4-chiptunes-adventure).
- `tools/render_balls.py`: script Blender untuk semua bola.
