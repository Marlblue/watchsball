# Watchsball

Game hero bola: 50 hero berskill saling hajar di arena. Jagoin heromu, naik rank, panjat tower, pasang taruhan di Royale, dan tarik hero baru di gacha banner.

## Main
- **Online:** https://watchsball.marlblue.workers.dev
- **Di PC (lokal):** jalankan `python -m http.server` di folder `public/`, lalu buka http://localhost:8000

## Mode
- **Rank:** Perunggu, Perak, Emas, Platinum, Berlian, Master, Mythic. Lawan dipilih sistem, makin tinggi tier makin kuat (bintang + darah ekstra). Angka tier ada di `TIERS` di `public/index.html`.
- **Royale + taruhan:** 8 hero, sisa 1. Pemain bisa ikut main atau nonton saja, lalu pasang koin ke calon juara. Pengali tiap hero ada di `public/odds.js` (dibuat dari simulasi, lihat di bawah).
- **Tower:** 50 lantai, tiap lantai bertema satu role, bos tiap 5 lantai (hadiah tiket). Lihat `towerFloor()` di `public/index.html`.
- **Misi harian:** 3 misi acak per hari dari daftar `MISSIONS`, bonus 1 tiket kalau semua diklaim.
- **Gacha banner:** tidak ada rarity. 3 hero banner berganti tiap minggu, peluang 50%, pity 20 tarikan. 1 tiket = 1 tarikan.
- **Latihan:** pilih lawan bebas, hadiah kecil.

## Deploy (Cloudflare Workers, gratis)
Jalankan dari folder `watchsball`:
```
npm run login     # sekali saja
npm run whoami    # cek akun
npm run deploy    # buat ulang sw.js (daftar file offline), lalu upload folder public/
```

## Balancing
```
node tools/sim.mjs 4 600            # duel semua pasangan (4x) + 600 royale, cetak win rate per hero dan per role
node tools/sim.mjs 0 3000 --odds    # hitung ulang pengali taruhan Royale ke public/odds.js
node tools/render_test.mjs          # jalankan battle semua hero lewat render.js tanpa browser, untuk menangkap error
```
Angka skill ada di objek `T` di `public/engine.js`. Target: tiap hero menang 35-65% di duel, rata-rata tiap role sekitar 50%. Setelah mengubah angka, jalankan ulang `--odds` supaya taruhan Royale tetap adil.

## Render ulang sprite hero (Blender)
```
WB_NOFACE=1 "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python tools/render_balls.py -- public/assets/balls
```
Tiap hero dibangun oleh fungsi `h_<id>()` di `tools/render_balls.py` dari potongan umum (`helmet`, `hood`, `brim_hat`, `wizard_hat`, `side_blade`, `gun`, dll). Aturannya: wajah anime digambar 2D di game (`drawFace` dan tabel `FACE` di `public/render.js`), jadi topi/helm ditaruh di atas-belakang kepala dan senjata di samping. Tambah argumen `ksatria,ninja` di akhir untuk render hero tertentu saja. Hasilnya grid WebP 8x4 (32 frame putaran) per hero, plus `samurai_blade.webp` untuk katana. Pratinjau semua hero disimpan di folder temp (`watchsball_preview.png`).

## Bangun ulang efek suara
Download paket CC0 (Kenney: Impact Sounds, Interface Sounds, Sci-fi Sounds, Music Jingles, Digital Audio, RPG Audio, Voiceover Pack: Fighter; OpenGameArt: dua paket musik Juhani Junkala), unzip, lalu:
```
node tools/build_sfx.mjs <folder1> [folder2 ...]
```
Daftar suara per kejadian ada di `MAP` di dalam script itu.

## Rilis versi baru
1. Tambah entri di paling atas `public/patches.js` (jenis: baru, buff, nerf, ubah, fix).
2. Naikkan `version` di `package.json`: bug kecil = x.y.**z**, fitur/hero baru = x.**y**.0, perubahan besar = **x**.0.0.
3. `npm run deploy`

## File
- `public/engine.js`: mesin battle (fisika, skill, damage, status). Data hero di `TYPES`, role di `ROLES`, angka balancing di `T`.
- `public/render.js`: tampilan arena (arah hadap, wajah anime, teriakan skill di `SKILLS`, efek partikel).
- `public/index.html`: tampilan, menu, rank, royale, tower, misi, gacha, koleksi, suara, save (`watchsball-v4` di localStorage; save versi lama otomatis dipindah dan koleksinya ditukar jadi tiket).
- `public/odds.js`: pengali taruhan Royale (dibuat otomatis).
- `public/patches.js`: catatan patch yang tampil di tombol PATCH.
- `public/assets/balls/`: sprite hero hasil render Blender.
- `public/assets/fx/`: tekstur efek dari [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) (CC0).
- `public/assets/ui`, `fonts`: dari [Kenney UI Pack](https://kenney.nl/assets/ui-pack) (CC0).
- `public/assets/sfx`: dari paket audio Kenney (CC0). Dibangun oleh `tools/build_sfx.mjs`.
- `public/assets/music`: musik chiptune oleh Juhani Junkala (CC0), dari [5 Action Chiptunes](https://opengameart.org/content/5-chiptunes-action) dan [Chiptune Adventures](https://opengameart.org/content/4-chiptunes-adventure).
- `tools/render_balls.py`: script Blender untuk semua hero. `tools/sim.mjs`: simulasi balancing. `tools/render_test.mjs`: tes render tanpa browser.
