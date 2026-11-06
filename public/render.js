// Watchsball - tampilan arena: sprite bola, arah hadap, efek partikel bertekstur (Kenney Particle Pack, CC0).
(function (root) {
  "use strict";
  let E, IMG, sfx, TYPES;

  const FRAMES = 32, COLS = 8, SPR = 192, SPR_SCALE = 3;
  const TAU = Math.PI * 2;
  const MAX_PARTS = 520;

  // nama tekstur efek -> file di assets/fx
  const FX = {
    smoke: "smoke_02", cloud: "smoke_07", blast: "fire_01", wisp: "flame_02", bolt: "spark_01", boltS: "spark_04",
    streak: "trace_01", point: "flare_01", sparkle: "star_04", star: "star_07", glow: "light_01", ring: "circle_02",
    ringSoft: "circle_04", rune: "magic_01", target: "magic_03", swirl: "twirl_01", slash: "slash_02", burst: "scorch_01",
    flame: "muzzle_01", debris: "dirt_01", heart: "symbol_01",
  };

  // Semua model 3D punya "depan" (wajah/laras/moncong) di arah +X Blender, jadi FEATURE = 0.
  const FEATURE = {};
  // cara bola menghadap: "aim" = ke target skill, "move" = ke arah gerak, "spin" = berputar terus
  const MODE = { koboi: "aim", sniper: "aim", sihirapi: "aim", gunner: "aim" };

  // teriakan nama skill ala anime + kapan skill berikutnya siap (nama field di E.T)
  const SKILLS = {
    ksatria: { call: "PERISAI PULIH!", label: "Hantaman Perisai", every: "bashEvery", cd: 5 },
    ksatriaHantam: { call: "HANTAMAN PERISAI!", cd: 4 },
    ksatriaTangkis: { call: "TANGKIS!", cd: 3 },
    golem: { call: "PILAR BATU!", label: "Pilar Batu", every: "pillarEvery", cd: 5 },
    viking: { call: "AMARAH VIKING!", label: "Lompatan Kapak", every: "leapEvery" },
    vikingLompat: { call: "LOMPATAN KAPAK!", cd: 4 },
    vikingInjak: { call: null },
    gladiator: { call: null, label: "Jaring Arena", every: "prisonEvery" },
    gladiatorTiup: { call: null },
    gladiatorPenjara: { call: "TERJERAT!", cd: 3 },
    sumo: { call: "DORONGAN PERUT!", label: "Tarik & Dorong", every: "poleTime", cd: 4 },
    sumoTarik: { call: null },
    sumoCuri: { call: "REBUT PELURU!", cd: 3 },
    samurai: { call: null, label: "Katana Bumerang", every: "throwEvery" },
    samuraiUp: { call: "KATANA MAKIN TAJAM!" },
    samuraiLempar: { call: "LEMPAR KATANA!", cd: 4 },
    silat: { call: null, label: "Jurus Segitiga", every: "dashEvery" },
    silatTaruh: { call: null },
    silatRasi: { call: "JURUS SEGITIGA!", big: true, cd: 3 },
    berserker: { call: "LEDAKAN AMARAH!", label: "Jejak Amarah", every: "eruptEvery", cd: 4 },
    biksu: { call: "TENDANGAN PUYUH!", label: "Tendangan Puyuh", every: "tornadoEvery" },
    biksuTangkap: { call: null },
    biksuLempar: { call: "TERBANG KE TEMBOK!", cd: 3 },
    valkyrie: { call: "TOMBAK LANGIT!", label: "Tombak Langit", every: "meteorEvery", big: true },
    ninja: { call: "KAGE BUNSHIN!", label: "Kawat Kloning", big: true },
    ninjaBenang: { call: null },
    bayangan: { call: "SERANGAN BAYANGAN!", label: "Curi Bayangan", every: "shadowEvery" },
    bayanganCuri: { call: "SKILL TERKUNCI!", cd: 3 },
    pencuri: { call: "MASUK KARUNG!", label: "Karung Culik", every: "trapEvery" },
    pencuriJatuh: { call: "JATUH DARI LANGIT!", big: true, cd: 3 },
    pemburu: { call: "ELANG PERAK!", label: "Elang Perak", every: "batEvery", cd: 5 },
    pemburuDarah: { call: "SERAP DARAH!", cd: 4 },
    penari: { call: "TARIAN KILAT!", label: "Selendang" },
    penariTali: { call: null },
    sihirapi: { call: "SEMBURAN API!", label: "Semburan Api", every: "breathEvery", big: true },
    sihires: { call: "BOLA SALJU!", label: "Bola Salju", every: "snowEvery", cd: 4 },
    dukun: { call: "SANTET!", label: "Santet", every: "ghostEvery", big: true },
    dukunTembus: { call: "WUJUD GAIB!" },
    dukunKeluar: { call: null },
    necro: { call: "SERBU, TENGKORAK!", label: "Pasukan Tengkorak", every: "beeLaunchEvery", cd: 4 },
    necroTambah: { call: null },
    ahlipetir: { call: "AWAN BADAI!", label: "Awan Badai", every: "cloudEvery" },
    pemanah: { call: "HUJAN PANAH!", label: "Hujan Panah", every: "flowerEvery" },
    pemanahPaku: { call: "TERPAKU!", cd: 3 },
    koboi: { call: "DOR!", label: "Peluru Pantul", every: "shotEvery", cd: 3 },
    sniper: { call: "TEMBAKAN JITU!", label: "Sinar Jitu", every: "laserEvery" },
    bajaklaut: { call: "TONG MESIU!", label: "Tong Mesiu", every: "bombEvery", cd: 4 },
    bajaklautTempel: { call: null },
    bajaklautPindah: { call: "OPER TONG!", cd: 1.5 },
    grenadier: { call: "GRANAT!", label: "Granat", every: "rocketEvery" },
    pendeta: { call: "CAHAYA SUCI!", label: "Cahaya Suci", every: "sunNovaEvery", big: true },
    bard: { call: "LAGU SUMBANG!", label: "Lagu Sumbang", every: "gasEvery", cd: 5 },
    bardMax: { call: "JOGET MAUT!", cd: 4 },
    druid: { call: null, label: "Kebun Jamur", every: "shroomEvery" },
    druidTanam: { call: null },
    druidMakan: { call: "NYAM NYAM!", cd: 3 },
    mekanik: { call: null, label: "Menara Tembak", every: "cactusEvery" },
    mekanikTanam: { call: "PASANG MENARA!", cd: 5 },
    paladin: { call: "PALU SUCI!", label: "Palu Suci", every: "hammerEvery", cd: 3 },
    barong: { call: "RAUNGAN BARONG!", label: "Raungan", every: "roarEvery", big: true },
    juggernaut: { call: "SERUDUK!", label: "Seruduk", every: "chargeEvery", cd: 3 },
    juggernautTabrak: { call: null },
    petinju: { call: "UPPERCUT!", label: "Combo Tinju", cd: 2.5 },
    petinjuJab: { call: null },
    jawara: { call: "GOLOK BERPUTAR!", label: "Panas Jawara", big: true },
    ronin: { call: "TEBASAN KILAT!", label: "Tebasan Kilat", every: "roninEvery", cd: 3 },
    roninTebas: { call: null },
    pembunuh: { call: null, label: "Tikaman Gaib", every: "stealthEvery" },
    pembunuhTikam: { call: "TIKAMAN MAUT!", big: true, cd: 3 },
    kunoichi: { call: "KUNAI BERACUN!", label: "Kunai Beracun", every: "kunaiEvery", cd: 4 },
    penjebak: { call: null, label: "Ranjau", every: "mineEvery" },
    penjebakTanam: { call: null },
    waktu: { call: "WAKTU MELAMBAT!", label: "Zona Waktu", every: "slowFieldEvery", cd: 4 },
    waktuMundur: { call: "PUTAR BALIK WAKTU!", big: true, cd: 4 },
    kosmos: { call: "LUBANG HITAM!", label: "Lubang Hitam", every: "holeEvery", big: true },
    kosmosMakan: { call: "NYAM!", cd: 3 },
    alkemis: { call: "RAMUAN ASAM!", label: "Ramuan Asam", every: "potionEvery", cd: 4 },
    pawang: { call: "HUJAN DERAS!", label: "Hujan Deras", every: "rainEvery", cd: 4 },
    nelayan: { call: null, label: "Kail Penarik", every: "hookEvery" },
    nelayanTarik: { call: "KENA KAIL!", cd: 3 },
    gunner: { call: "DOR DOR!", label: "Senapan Tabur", every: "pelletEvery", cd: 4 },
    sumpitTiup: { call: null },
    sumpit: { call: null, label: "Sumpit Tidur", every: "dartEvery" },
    sumpitTidur: { call: "TIDUR PULAS!", cd: 3 },
    tabib: { call: null, label: "Jamu Pahit", every: "bitterEvery" },
    tabibJamu: { call: "MINUM JAMU!", cd: 4 },
    dalang: { call: "WAYANG MAJU!", label: "Panggil Wayang", every: "puppetEvery", cd: 4 },
    totem: { call: "TOTEM TANCAP!", label: "Totem", every: "totemEvery", cd: 5 },
    gong: { call: "GONG!", label: "Gelombang Gong", every: "gongEvery", cd: 4 },
    peramal: { call: "KARTU MERAH!", label: "Kartu Takdir", every: "cardEvery", cd: 2 },
    peramalEmas: { call: "KARTU EMAS!", big: true, cd: 3 },
    peramalBiru: { call: "KARTU BIRU!", cd: 2 },
    peramalUngu: { call: "KARTU UNGU!", cd: 2 },
    peramalHijau: { call: "KARTU HIJAU!", cd: 2 },
    peramalKunci: { call: "SKILL TERKUNCI!", cd: 3 },
  };

  function init(opts) {
    E = opts.E; IMG = opts.IMG; sfx = opts.sfx || function () {}; TYPES = E.TYPES;
  }

  // ---------------- tekstur berwarna (di-cache) ----------------
  const tintCache = {};
  function tex(key, color) {
    const id = key + "|" + (color || "");
    if (tintCache[id]) return tintCache[id];
    const im = IMG["fx_" + key];
    if (!im) return null;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0, 128, 128);
    if (color) {
      g.globalCompositeOperation = "source-in";
      g.fillStyle = color;
      g.fillRect(0, 0, 128, 128);
    }
    tintCache[id] = c;
    return c;
  }
  function drawTex(ctx, key, color, x, y, size, rot, alpha, add, sx) {
    const t = tex(key, color);
    if (!t || alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    if (add) ctx.globalCompositeOperation = "lighter";
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (sx && sx !== 1) ctx.scale(sx, 1);
    ctx.drawImage(t, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // ---------------- sprite bola ----------------
  function drawSprite(ctx, type, x, y, r, frame) {
    const im = IMG[type];
    const size = r * SPR_SCALE;
    if (im) {
      const f = ((Math.round(frame) % FRAMES) + FRAMES) % FRAMES;
      ctx.drawImage(im, (f % COLS) * SPR, Math.floor(f / COLS) * SPR, SPR, SPR, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = TYPES[type].color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  // sudut hadap layar (kanvas) -> frame sprite. Frame f = model diputar 360*f/32 berlawanan jarum jam.
  function frameFor(type, face) {
    const theta = -face - (FEATURE[type] || 0);
    return (theta / TAU) * FRAMES;
  }

  // ---------------- wajah anime (digambar 2D di atas sprite) ----------------
  // eye: bentuk mata, iris: warna iris, mouth: bentuk mulut, pupil: bentuk pupil, blush: pipi merah
  const FACE = {
    ksatria: { eye: "normal", iris: "#2a5cc8", mouth: "smile", brow: 0.3 },
    golem: { eye: "sleepy", iris: "#6b4a2a", mouth: "flat" },
    viking: { eye: "sharp", iris: "#3a6aa8", mouth: "grin", brow: 0.6 },
    gladiator: { eye: "sharp", iris: "#b02020", mouth: "grin", brow: 0.6 },
    sumo: { eye: "happy", iris: "#c04060", mouth: "grin", blush: true },
    samurai: { eye: "sharp", iris: "#e01e2e", mouth: "flat", brow: 0.6 },
    silat: { eye: "sharp", iris: "#1a8a5a", mouth: "flat", brow: 0.5 },
    berserker: { eye: "sharp", iris: "#ff3a1a", mouth: "fang", brow: 0.8 },
    biksu: { eye: "happy", iris: "#c07a10", mouth: "smile" },
    valkyrie: { eye: "round", iris: "#2a7cff", mouth: "smile", brow: 0.3, pupil: "star" },
    ninja: { eye: "cool", iris: "#4a2ab8", mouth: "none", brow: 0.4 },
    bayangan: { eye: "glow", iris: "#ff5aff", mouth: "none" },
    pencuri: { eye: "sly", iris: "#c08a2a", mouth: "cat" },
    pemburu: { eye: "sharp", iris: "#c0a030", mouth: "flat", brow: 0.5, pupil: "slit" },
    penari: { eye: "round", iris: "#ff3d8b", mouth: "cat", blush: true, pupil: "heart" },
    sihirapi: { eye: "sharp", iris: "#ffcc00", mouth: "grin", brow: 0.55, pupil: "slit" },
    sihires: { eye: "round", iris: "#2f8cff", mouth: "small", blush: true, pupil: "snow" },
    dukun: { eye: "sly", iris: "#7a2a9a", mouth: "smirk", brow: 0.3, pupil: "spiral" },
    necro: { eye: "glow", iris: "#5fff9a", mouth: "fang" },
    ahlipetir: { eye: "sharp", iris: "#ffcc00", mouth: "grin", brow: 0.4, pupil: "bolt" },
    pemanah: { eye: "cool", iris: "#3a8a20", mouth: "smirk" },
    koboi: { eye: "sharp", iris: "#ff8a1a", mouth: "grin", brow: 0.6 },
    sniper: { eye: "cool", iris: "#ff2e88", mouth: "smirk", pupil: "ring" },
    bajaklaut: { eye: "sharp", iris: "#1a4a8a", mouth: "grin", brow: 0.4 },
    grenadier: { eye: "sharp", iris: "#4a6a1a", mouth: "grin", brow: 0.5 },
    pendeta: { eye: "happy", iris: "#ff9a00", mouth: "smile", blush: true },
    bard: { eye: "happy", iris: "#c03ab0", mouth: "cat", blush: true },
    druid: { eye: "sleepy", iris: "#3a9a2a", mouth: "smile", blush: true },
    mekanik: { eye: "round", iris: "#ff8a1a", mouth: "grin", pupil: "ring" },
    peramal: { eye: "sly", iris: "#9a5cff", mouth: "smirk", pupil: "star" },
    paladin: { eye: "normal", iris: "#c08a1a", mouth: "smile", brow: 0.35 },
    barong: { eye: "sharp", iris: "#ffcc00", mouth: "fang", brow: 0.7, pupil: "slit" },
    juggernaut: { eye: "sharp", iris: "#ff3a1a", mouth: "flat", brow: 0.8 },
    petinju: { eye: "sharp", iris: "#c02a1a", mouth: "grin", brow: 0.6 },
    jawara: { eye: "sharp", iris: "#2a1a0a", mouth: "smirk", brow: 0.6 },
    ronin: { eye: "cool", iris: "#3a4a8a", mouth: "flat", brow: 0.5 },
    pembunuh: { eye: "glow", iris: "#ff3a5a", mouth: "none" },
    kunoichi: { eye: "sly", iris: "#d0205a", mouth: "none", pupil: "slit" },
    penjebak: { eye: "sly", iris: "#6a5a1a", mouth: "smirk" },
    waktu: { eye: "round", iris: "#1a9aa8", mouth: "small", pupil: "ring" },
    kosmos: { eye: "round", iris: "#c9a8ff", mouth: "o", pupil: "spiral" },
    alkemis: { eye: "round", iris: "#6aa010", mouth: "grin", pupil: "spiral" },
    pawang: { eye: "sleepy", iris: "#2a6ab0", mouth: "smile" },
    nelayan: { eye: "happy", iris: "#1a7ab0", mouth: "grin", blush: true },
    gunner: { eye: "sharp", iris: "#6a4a1a", mouth: "smirk", brow: 0.5 },
    sumpit: { eye: "sharp", iris: "#3a7a1a", mouth: "flat", brow: 0.4 },
    tabib: { eye: "happy", iris: "#9a6a2a", mouth: "smile", blush: true },
    dalang: { eye: "sly", iris: "#8a5a1a", mouth: "smile", brow: 0.3 },
    totem: { eye: "sharp", iris: "#a0401a", mouth: "flat", brow: 0.4 },
    gong: { eye: "happy", iris: "#b0800a", mouth: "grin", blush: true },
  };

  function faceState(view, b, t) {
    if (b.sleep > 0 || b.frozen > 0) return "closed";
    if (b.possessedBy) return "possessed";
    if (b.drunk > 0 || b.stun > 0) return "dizzy";
    if (b.trapped > 0) return "panic";
    if (view.hurt[b.id] > 0) return "hurt";
    if (view.cast[b.id] > 0) return "shout";
    if (b.silence > 0) return "silent";
    // kedip sesekali
    const ph = (t * 0.35 + b.id * 0.37) % 1;
    if (ph < 0.025) return "blink";
    return "normal";
  }

  function drawFace(ctx, b, x, y, r, face, st) {
    const F = FACE[b.type];
    if (!F) return;
    st = st || "normal";
    const lowHp = b.hp < b.maxHp * 0.3;
    // wajah bergeser sedikit ke arah hadap supaya kelihatan menoleh
    const lx = Math.cos(face), ly = Math.sin(face);
    const cx = x + lx * r * 0.2, cy = y + r * 0.12 + ly * r * 0.1;
    const ex = r * 0.34, ey = cy - r * 0.06;
    const ew = r * (F.eye === "sharp" || F.eye === "sly" ? 0.27 : 0.25), eh = r * ({ round: 0.36, normal: 0.32, sharp: 0.24, sly: 0.2, sleepy: 0.16, cool: 0.2, happy: 0.3, ghost: 0.38, glow: 0.18 }[F.eye] || 0.3);
    const lw = Math.max(1.2, r * 0.06);
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1020";

    // pipi merah
    if (F.blush || st === "hurt" || st === "panic") {
      ctx.fillStyle = "rgba(255,90,130,0.38)";
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * ex * 1.25, ey + eh * 0.95, r * 0.13, r * 0.07, 0, 0, TAU); ctx.fill(); }
    }

    for (const s of [-1, 1]) {
      const px = cx + s * ex, py = ey;
      if (st === "closed" || st === "blink" || (F.eye === "happy" && st === "normal")) {
        // mata tertutup / senyum tertutup ^ ^
        ctx.lineWidth = lw * 1.2;
        ctx.beginPath();
        if (F.eye === "happy" && st === "normal") ctx.arc(px, py + eh * 0.25, ew * 0.8, Math.PI * 1.15, Math.PI * 1.85);
        else ctx.arc(px, py - eh * 0.1, ew * 0.85, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        continue;
      }
      if (st === "hurt") { // > <
        ctx.lineWidth = lw * 1.3;
        ctx.beginPath(); ctx.moveTo(px - s * ew * 0.8, py - eh * 0.5); ctx.lineTo(px + s * ew * 0.6, py); ctx.lineTo(px - s * ew * 0.8, py + eh * 0.5); ctx.stroke();
        continue;
      }
      if (st === "dizzy" || st === "possessed") { // mata spiral
        ctx.lineWidth = lw * 0.9;
        ctx.strokeStyle = st === "possessed" ? "#7a4cff" : "#1a1020";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(px, py, ew, eh * 1.05, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 26; i++) { const a = i * 0.55 + performance.now() / 120 * s, rr = (i / 26) * ew * 0.85; ctx.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * (eh / ew)); }
        ctx.stroke();
        ctx.strokeStyle = "#1a1020";
        continue;
      }
      if (F.eye === "glow") { // mata menyala (bayangan)
        drawTex(ctx, "glow", F.iris, px, py, ew * 4, 0, 0.9, true);
        ctx.fillStyle = "#ffe0ff";
        ctx.beginPath(); ctx.ellipse(px, py, ew * 0.9, eh, s * -0.3, 0, TAU); ctx.fill();
        continue;
      }
      const H = st === "panic" ? eh * 1.15 : st === "shout" ? eh * 0.9 : eh;
      // putih mata
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.ellipse(px, py, ew, H, 0, 0, TAU); ctx.fill();
      // iris (menatap ke arah hadap)
      const ix = px + lx * ew * 0.25, iy = py + ly * H * 0.18;
      const iw = st === "panic" ? ew * 0.35 : ew * 0.72, ih = st === "panic" ? H * 0.35 : H * 0.8;
      if (F.eye !== "ghost") {
        const g = ctx.createLinearGradient(ix, iy - ih, ix, iy + ih);
        g.addColorStop(0, shade(F.iris, -0.45)); g.addColorStop(0.6, F.iris); g.addColorStop(1, shade(F.iris, 0.35));
        ctx.fillStyle = g;
      } else ctx.fillStyle = F.iris;
      ctx.beginPath(); ctx.ellipse(ix, iy, iw, ih, 0, 0, TAU); ctx.fill();
      // pupil
      ctx.fillStyle = "#120a18";
      const pu = F.pupil;
      if (st === "panic") { /* pupil kecil saja */ }
      else if (pu === "slit") { ctx.beginPath(); ctx.ellipse(ix, iy, iw * 0.18, ih * 0.75, 0, 0, TAU); ctx.fill(); }
      else if (pu === "heart") { ctx.fillStyle = "#ff3b6b"; heart(ctx, ix, iy, iw * 0.55); }
      else if (pu === "star") { ctx.fillStyle = "#fff6c0"; starShape(ctx, ix, iy, iw * 0.6); }
      else if (pu === "spiral") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = lw * 0.6; ctx.beginPath(); for (let i = 0; i < 18; i++) { const a = i * 0.7, rr = (i / 18) * iw * 0.7; ctx.lineTo(ix + Math.cos(a) * rr, iy + Math.sin(a) * rr); } ctx.stroke(); ctx.strokeStyle = "#1a1020"; }
      else if (pu === "ring") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.arc(ix, iy, iw * 0.45, 0, TAU); ctx.stroke(); ctx.strokeStyle = "#1a1020"; }
      else if (pu === "bolt") { ctx.fillStyle = "#fff6a0"; ctx.beginPath(); ctx.moveTo(ix + iw * 0.2, iy - ih * 0.6); ctx.lineTo(ix - iw * 0.3, iy + ih * 0.1); ctx.lineTo(ix + iw * 0.05, iy + ih * 0.1); ctx.lineTo(ix - iw * 0.2, iy + ih * 0.6); ctx.lineTo(ix + iw * 0.35, iy - ih * 0.1); ctx.lineTo(ix, iy - ih * 0.1); ctx.closePath(); ctx.fill(); }
      else if (pu === "snow") { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = lw * 0.5; for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(ix - Math.cos(a) * iw * 0.45, iy - Math.sin(a) * iw * 0.45); ctx.lineTo(ix + Math.cos(a) * iw * 0.45, iy + Math.sin(a) * iw * 0.45); ctx.stroke(); } ctx.strokeStyle = "#1a1020"; }
      else { ctx.beginPath(); ctx.ellipse(ix, iy, iw * 0.42, ih * 0.5, 0, 0, TAU); ctx.fill(); }
      // kilau anime
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(ix - iw * 0.35, iy - ih * 0.42, iw * 0.3, ih * 0.26, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(ix + iw * 0.3, iy + ih * 0.35, iw * 0.13, 0, TAU); ctx.fill();
      // garis mata tebal di atas (bulu mata)
      ctx.lineWidth = lw * 1.5;
      ctx.beginPath(); ctx.ellipse(px, py, ew * 1.02, H * 1.02, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath(); ctx.ellipse(px, py, ew, H, 0, 0, TAU); ctx.stroke();
      if (F.eye === "sharp" || F.eye === "sly" || F.eye === "sleepy" || F.eye === "cool") { // kelopak setengah turun
        ctx.fillStyle = shade(TYPES[b.type].color, -0.25);
        ctx.beginPath(); ctx.ellipse(px, py, ew * 1.05, H * 1.05, 0, Math.PI, TAU);
        ctx.lineTo(px + ew, py - H * (F.eye === "sleepy" ? 0.1 : 0.45)); ctx.closePath();
        ctx.save(); ctx.globalAlpha = 0.0; ctx.restore();
      }
    }

    // alis
    const angry = st === "shout" || st === "hurt" ? 0.5 : F.brow || 0;
    if (angry > 0 || lowHp || st === "panic") {
      ctx.lineWidth = lw * 1.3;
      for (const s of [-1, 1]) {
        const bx = cx + s * ex, by = ey - eh - r * 0.1;
        const tilt = lowHp && !angry ? -0.35 : angry;
        ctx.beginPath();
        ctx.moveTo(bx - s * ew * 0.9, by - ew * tilt * 0.6 * -1);
        ctx.lineTo(bx + s * ew * 0.9, by - ew * tilt * 0.6);
        ctx.stroke();
      }
    }

    // mulut
    const my = cy + r * 0.3, mw = r * 0.14;
    ctx.lineWidth = lw * 1.1;
    let m = F.mouth;
    if (st === "shout") m = "shout";
    else if (st === "hurt" || st === "dizzy") m = "wavy";
    else if (st === "panic") m = "o";
    else if (st === "silent") m = "zip";
    else if (st === "closed" && b.sleep > 0) m = "o";
    if (m === "cat") {
      ctx.beginPath(); ctx.arc(cx - mw * 0.5, my - mw * 0.1, mw * 0.5, 0.1, Math.PI - 0.1); ctx.arc(cx + mw * 0.5, my - mw * 0.1, mw * 0.5, 0.1, Math.PI - 0.1); ctx.stroke();
    } else if (m === "smile") {
      ctx.beginPath(); ctx.arc(cx, my - mw * 0.6, mw, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
    } else if (m === "grin") {
      ctx.fillStyle = "#5a0a14";
      ctx.beginPath(); ctx.moveTo(cx - mw * 1.1, my - mw * 0.3); ctx.quadraticCurveTo(cx, my + mw * 1.2, cx + mw * 1.1, my - mw * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(cx - mw * 0.7, my - mw * 0.3, mw * 1.4, mw * 0.3);
    } else if (m === "fang") {
      ctx.beginPath(); ctx.arc(cx, my - mw * 0.7, mw, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
      ctx.fillStyle = "#ffffff";
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * mw * 0.55, my - mw * 0.05); ctx.lineTo(cx + s * mw * 0.3, my - mw * 0.05); ctx.lineTo(cx + s * mw * 0.42, my + mw * 0.45); ctx.closePath(); ctx.fill(); }
    } else if (m === "o") {
      ctx.fillStyle = "#5a0a14";
      ctx.beginPath(); ctx.ellipse(cx, my, mw * 0.4, mw * 0.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (m === "smirk") {
      ctx.beginPath(); ctx.moveTo(cx - mw * 0.8, my); ctx.quadraticCurveTo(cx + mw * 0.2, my + mw * 0.5, cx + mw, my - mw * 0.4); ctx.stroke();
    } else if (m === "flat") {
      ctx.beginPath(); ctx.moveTo(cx - mw * 0.7, my); ctx.lineTo(cx + mw * 0.7, my); ctx.stroke();
    } else if (m === "small") {
      ctx.beginPath(); ctx.arc(cx, my - mw * 0.3, mw * 0.5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    } else if (m === "shout") {
      ctx.fillStyle = "#5a0a14";
      ctx.beginPath(); ctx.ellipse(cx, my + mw * 0.2, mw * 0.85, mw * 0.75, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff6b8a";
      ctx.beginPath(); ctx.ellipse(cx, my + mw * 0.55, mw * 0.5, mw * 0.3, 0, 0, TAU); ctx.fill();
    } else if (m === "wavy") {
      ctx.beginPath(); ctx.moveTo(cx - mw, my);
      for (let i = 1; i <= 4; i++) ctx.lineTo(cx - mw + (i * mw) / 2, my + (i % 2 ? -mw * 0.3 : mw * 0.3));
      ctx.stroke();
    } else if (m === "zip") {
      ctx.beginPath(); ctx.moveTo(cx - mw, my); ctx.lineTo(cx + mw, my); ctx.stroke();
      ctx.lineWidth = lw * 0.7;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * mw * 0.4, my - mw * 0.25); ctx.lineTo(cx + i * mw * 0.4, my + mw * 0.25); ctx.stroke(); }
    }

    // keringat saat darah tipis / panik
    if (lowHp || st === "panic") {
      ctx.fillStyle = "rgba(150,210,255,0.95)";
      const sx = cx + ex * 1.7, sy = ey - eh * 0.6 + Math.sin(performance.now() / 200) * 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy - r * 0.16); ctx.quadraticCurveTo(sx + r * 0.1, sy, sx, sy + r * 0.06); ctx.quadraticCurveTo(sx - r * 0.1, sy, sx, sy - r * 0.16); ctx.fill();
    }
    ctx.restore();
  }

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.8);
    ctx.bezierCurveTo(x - s * 1.2, y, x - s * 0.6, y - s * 0.9, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 0.9, x + s * 1.2, y, x, y + s * 0.8);
    ctx.fill();
  }
  function starShape(ctx, x, y, s) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.45 : s; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
  }
  // tinggi lompatan raksasa (melayang ke atas layar)
  function lift(b) {
    if (!(b.air > 0)) return 0;
    const k = 1 - b.air / E.T.leapTime;
    return Math.sin(k * Math.PI) * 70;
  }

  function drawBlade(ctx, x, y, r, ang) {
    const k = E.T.bladeLen / (1.95 + 0.78);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (IMG.blade) ctx.drawImage(IMG.blade, r - 1.22 * k, -0.5 * k, 4 * k, k);
    ctx.restore();
  }

  // angka darah di label kecil di bawah bola (supaya wajah bola tidak tertutup)
  function drawHp(ctx, x, y, r, hp, color) {
    ctx.save();
    const fs = Math.max(11, Math.round(r * 0.42));
    ctx.font = fs + "px 'Kenney Future', 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = ctx.measureText(hp).width + 12, h = fs + 6, py = y + r + 4 + h / 2;
    ctx.fillStyle = "rgba(15,20,40,0.85)";
    roundRect(ctx, x - w / 2, py - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = color || "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText(hp, x, py + 1);
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }


  // tong mesiu bajak laut
  function drawBarrel(ctx, x, y, r, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#7a4a22"; ctx.strokeStyle = "#2a160a"; ctx.lineWidth = 1.5;
    roundRect(ctx, -r * 0.8, -r, r * 1.6, r * 2, r * 0.45); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3a3a42";
    ctx.fillRect(-r * 0.8, -r * 0.55, r * 1.6, r * 0.22); ctx.fillRect(-r * 0.8, r * 0.33, r * 1.6, r * 0.22);
    ctx.strokeStyle = "#e8d0a0"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.5, -r * 1.5, r * 0.3, -r * 1.8); ctx.stroke();
    ctx.restore();
    if (t != null) drawTex(ctx, "sparkle", "#ffcf66", x + r * 0.3, y - r * 1.8, 16, t * 10, 0.9, true);
  }
  // tombak cahaya valkyrie
  function drawSpear(ctx, x, y, ang, len) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = "#fff4c0"; ctx.strokeStyle = "#c8a030"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-4, -6); ctx.lineTo(-1, 0); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // tengkorak necromancer
  function drawSkull(ctx, x, y, s, ang) {
    ctx.save(); ctx.translate(x, y); if (ang) ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = "#eef0e0"; ctx.strokeStyle = "#2a3020"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -s * 0.1, s, Math.PI * 0.9, Math.PI * 2.1); ctx.lineTo(s * 0.55, s * 0.75); ctx.lineTo(-s * 0.55, s * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1a2a1a";
    ctx.beginPath(); ctx.arc(-s * 0.38, 0, s * 0.27, 0, TAU); ctx.arc(s * 0.38, 0, s * 0.27, 0, TAU); ctx.fill();
    ctx.fillStyle = "#5fff9a";
    ctx.beginPath(); ctx.arc(-s * 0.38, 0, s * 0.1, 0, TAU); ctx.arc(s * 0.38, 0, s * 0.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function ballIcon(type, cssSize) {
    const cv = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = cv.height = Math.round(cssSize * dpr);
    cv.style.width = cv.style.height = cssSize + "px";
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    // ikon: bagian depan bola sedikit menghadap kanan-bawah supaya fitur 3D-nya kelihatan
    // ikon: wajah menghadap ke depan (ke bawah layar), sedikit miring supaya kelihatan 3D
    const rr = (cssSize / SPR_SCALE) * 1.05;
    drawSprite(ctx, type, cssSize / 2, cssSize / 2, rr, frameFor(type, Math.PI / 2 - 0.25));
    drawFace(ctx, { type, hp: 1, maxHp: 1 }, cssSize / 2, cssSize / 2, rr, Math.PI / 2, "normal");
    return cv;
  }

  // ---------------- view state ----------------
  function makeView() {
    return {
      texts: [], parts: [], decals: [], shake: 0, time: 0, hitstop: 0, face: {}, squash: {}, recoil: {}, frozenSeen: {}, emitT: {}, byId: {},
      callouts: [], lastCall: {}, lastCallAll: -9, focus: [], impact: 0, zoom: null, trails: {}, calloutFilter: null,
      hurt: {}, cast: {}, blink: {},
    };
  }

  // teriakan nama skill: spanduk miring ala anime + garis fokus di sekitar bola
  function callout(view, type, b, S) {
    const sk = SKILLS[type];
    if (!sk || !sk.call || !b) return;
    if (view.calloutFilter && !view.calloutFilter(b, sk)) return;
    const key = b.id + ":" + type;
    const cd = sk.cd || 1.6;
    if (view.time - (view.lastCall[key] || -99) < cd) return;
    if (view.time - view.lastCallAll < 0.45) return; // jangan bertumpuk
    view.lastCall[key] = view.time;
    view.lastCallAll = view.time;
    const color = TYPES[b.type].color;
    view.callouts.push({ text: sk.call, type: b.type, color, life: 1.15, max: 1.15, side: view.callouts.length % 2 });
    if (view.callouts.length > 2) view.callouts.shift();
    view.focus.push({ x: b.x, y: b.y, r: b.r, color, life: 0.32, max: 0.32, seed: Math.random() * 100 });
    if (sk.big) {
      view.impact = 0.09; // impact frame hitam-putih
      view.zoom = { x: b.x, y: b.y, t: 0.35, max: 0.35, amt: 0.08 };
    }
    S("callout");
  }

  function P(view, o) {
    if (view.parts.length >= MAX_PARTS) view.parts.shift();
    const p = Object.assign({ vx: 0, vy: 0, rot: Math.random() * TAU, vr: 0, add: true, drag: 0.92, a0: 1, color: "#ffffff" }, o);
    p.max = p.life;
    if (p.s1 == null) p.s1 = p.s0;
    view.parts.push(p);
  }
  function burstParts(view, x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = (o.spd || 150) * (0.4 + Math.random() * 0.8);
      P(view, Object.assign({}, o, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vr: (Math.random() - 0.5) * 6 }));
    }
  }
  function decal(view, key, color, x, y, s, life) {
    view.decals.push({ key, color, x, y, s, life, max: life, rot: Math.random() * TAU });
    if (view.decals.length > 24) view.decals.shift();
  }
  function squash(view, id, nx, ny, amt) { view.squash[id] = { t: 0.16, nx, ny, amt: amt || 1 }; }

  // ---------------- event dari mesin -> efek ----------------
  const SKILL_SFX = {
    ksatria: "shieldup", ksatriaHantam: "heavy", golem: "heavy", viking: "heavy", vikingLompat: "whoosh", vikingInjak: "heavy",
    gladiatorTiup: "whoosh", gladiatorPenjara: "shieldup", sumo: "nova", sumoTarik: "charge", sumoCuri: "zap",
    samuraiLempar: "blade", samuraiUp: "charge", silat: "dash", silatTaruh: "charge", silatRasi: "zap", berserker: "flame",
    biksu: "whoosh", biksuLempar: "whoosh", valkyrie: "meteorfall", ninja: "split", bayangan: "ghost", bayanganCuri: "ghost",
    pencuri: "portal", pencuriJatuh: "portal", pemburu: "whoosh", penari: "dash", penariTali: "petal",
    sihirapi: "flame", sihires: "freeze", dukun: "ghost", dukunTembus: "ghost", dukunKeluar: "ghost", necro: "sting", necroTambah: "charge",
    ahlipetir: "zap", pemanah: "petal", pemanahPaku: "blade", koboi: "shot", sniper: "laser", bajaklaut: "launch",
    bajaklautTempel: "charge", bajaklautPindah: "pop", grenadier: "launch", pendeta: "nova", bard: "sting", bardMax: "sting",
    druidTanam: "pop", druidMakan: "heal", mekanikTanam: "charge", peramal: "petal", peramalEmas: "legend", peramalBiru: "freeze",
    peramalUngu: "ghost", peramalHijau: "heal", peramalKunci: "ghost",
    paladin: "heavy", barong: "nova", juggernaut: "dash", juggernautTabrak: "heavy", petinju: "heavy", petinjuJab: "hit", jawara: "blade",
    ronin: "blade", roninTebas: "blade", pembunuh: "ghost", pembunuhTikam: "crit", kunoichi: "blade", penjebakTanam: "charge",
    waktu: "portal", waktuMundur: "portal", kosmos: "hole", kosmosMakan: "pop", alkemis: "launch", pawang: "freeze",
    nelayan: "whoosh", nelayanTarik: "whoosh", gunner: "shot", sumpitTiup: "petal", sumpitTidur: "shieldup", tabib: "launch",
    tabibJamu: "heal", dalang: "split", totem: "heavy", gong: "nova",
  };

  function consumeEvents(w, view, withSound) {
    const S = withSound ? sfx : function () {};
    const by = view.byId;
    for (const b of w.balls) by[b.id] = b;
    for (const ev of w.events) {
      switch (ev.kind) {
        case "dmg":
          if (ev.id != null) view.hurt[ev.id] = 0.3;
          view.texts.push({ x: ev.x + (Math.random() * 16 - 8), y: ev.y, txt: ev.crit ? ev.amt + "!" : "-" + ev.amt, color: ev.crit ? "#ffd23c" : "#fff", crit: ev.crit, life: ev.crit ? 0.9 : 0.7, max: ev.crit ? 0.9 : 0.7 });
          if (view.texts.length > 12) view.texts.shift(); // jangan sampai arena penuh angka
          if (ev.crit) {
            view.shake = Math.max(view.shake, 8);
            view.hitstop = Math.max(view.hitstop, 0.07);
            P(view, { key: "slash", color: "#ffe066", x: ev.x, y: ev.y + 10, s0: 40, s1: 90, life: 0.3, rot: Math.random() * TAU, vr: 0 });
            P(view, { key: "star", color: "#fff6c0", x: ev.x, y: ev.y + 10, s0: 70, s1: 20, life: 0.25 });
            S("crit");
          }
          break;
        case "hit": {
          if (ev.a != null) {
            squash(view, ev.a, ev.nx, ev.ny);
            squash(view, ev.b, -ev.nx, -ev.ny);
          }
          P(view, { key: "burst", color: "#fff4d6", x: ev.x, y: ev.y, s0: 18, s1: 56, life: 0.22, a0: 0.9 });
          burstParts(view, ev.x, ev.y, 4, { key: "sparkle", color: "#fff", s0: 14, s1: 4, life: 0.35, spd: 220 });
          S("hit");
          break;
        }
        case "wall": {
          const b = by[ev.id];
          if (!b) break;
          squash(view, ev.id, ev.nx, ev.ny, 0.7);
          if (Math.random() < 0.6) P(view, { key: "smoke", color: "#b9c6e6", add: false, x: b.x - ev.nx * b.r, y: b.y - ev.ny * b.r, s0: 16, s1: 46, life: 0.4, a0: 0.35, vx: ev.nx * 30, vy: ev.ny * 30 });
          break;
        }
        case "thunder":
          P(view, { key: "burst", color: "#fff27a", x: ev.x, y: ev.y, s0: 20, s1: 70, life: 0.25 });
          decal(view, "burst", "#1a1508", ev.x, ev.y, 40, 2);
          view.shake = Math.max(view.shake, 3);
          S("zap");
          break;
        case "slam":
          P(view, { key: "ring", color: "#ffffff", x: ev.x, y: ev.y, s0: 30, s1: ev.big ? 170 : 110, life: 0.35 });
          burstParts(view, ev.x, ev.y, ev.big ? 10 : 6, { key: "smoke", color: "#c9c3bb", add: false, s0: 24, s1: 60, life: 0.7, a0: 0.5, spd: 140 });
          burstParts(view, ev.x, ev.y, 6, { key: "star", color: "#fff6a0", s0: 26, s1: 6, life: 0.6, spd: 120 });
          view.shake = Math.max(view.shake, ev.big ? 12 : 7);
          view.hitstop = Math.max(view.hitstop, 0.05);
          S("heavy");
          break;
        case "snap": {
          const mx = (ev.x1 + ev.x2) / 2, my = (ev.y1 + ev.y2) / 2;
          burstParts(view, ev.x, ev.y, 8, { key: "sparkle", color: "#ff7ab8", s0: 18, s1: 4, life: 0.4, spd: 260 });
          P(view, { key: "slash", color: "#ff5fa2", x: ev.x, y: ev.y, s0: 60, s1: 120, life: 0.25, rot: Math.atan2(ev.y2 - ev.y1, ev.x2 - ev.x1), vr: 0 });
          P(view, { key: "point", color: "#ffb3d6", x: mx, y: my, s0: 30, s1: 4, life: 0.3 });
          view.shake = Math.max(view.shake, 5);
          S("hit");
          break;
        }
        case "ricochet":
          burstParts(view, ev.x, ev.y, 5, { key: "sparkle", color: "#ffd27a", s0: 14, s1: 3, life: 0.3, spd: 200 });
          break;
        case "pillarHit":
          burstParts(view, ev.x, ev.y, 5, { key: "debris", color: "#7a6a5a", add: false, s0: 16, s1: 8, life: 0.5, spd: 180 });
          S("hit");
          break;
        case "pillarBreak":
          burstParts(view, ev.x, ev.y, 10, { key: "debris", color: "#8a7a68", add: false, s0: 22, s1: 10, life: 0.7, spd: 220, drag: 0.9 });
          burstParts(view, ev.x, ev.y, 4, { key: "cloud", color: "#a89c8c", add: false, s0: 30, s1: 70, life: 0.8, a0: 0.5, spd: 60 });
          S("heavy");
          break;
        case "trapClose":
          P(view, { key: "swirl", color: "#e0b070", x: ev.x, y: ev.y, s0: 100, s1: 10, life: 0.35, vr: -14 });
          break;
        case "spore":
          burstParts(view, ev.x, ev.y, 7, { key: "cloud", color: "#d86a5a", add: false, s0: 20, s1: 60, life: 0.8, a0: 0.55, spd: 90 });
          burstParts(view, ev.x, ev.y, 6, { key: "sparkle", color: "#ffe0a0", s0: 14, s1: 3, life: 0.6, spd: 140 });
          S("pop");
          break;
        case "impact":
          if (ev.skin === "snow") {
            burstParts(view, ev.x, ev.y, 10, { key: "sparkle", color: "#ffffff", s0: 18, s1: 4, life: 0.5, spd: 200 });
            P(view, { key: "cloud", color: "#e8f8ff", add: false, x: ev.x, y: ev.y, s0: 30, s1: (ev.r || 10) * 5, life: 0.5, a0: 0.7 });
          } else if (ev.skin === "glass") {
            burstParts(view, ev.x, ev.y, 7, { key: "sparkle", color: "#eaf4ff", s0: 16, s1: 3, life: 0.4, spd: 220 });
          } else if (ev.skin === "star") {
            P(view, { key: "star", color: "#ffe066", x: ev.x, y: ev.y, s0: 70, s1: 20, life: 0.25 });
            burstParts(view, ev.x, ev.y, 4, { key: "sparkle", color: "#fff1a0", s0: 16, s1: 3, life: 0.4, spd: 200 });
          } else if (ev.skin === "net") {
            P(view, { key: "ring", color: "#bff0ff", x: ev.x, y: ev.y, s0: 30, s1: 90, life: 0.3 });
          } else if (ev.skin === "spark" || ev.skin === "needle" || ev.skin === "bee" || ev.skin === "kunai" || ev.skin === "dart" || ev.skin === "pellet" || ev.skin === "hook" || ev.skin === "card" || ev.skin === "jamu") {
            burstParts(view, ev.x, ev.y, 3, { key: "sparkle", color: ev.color || "#fff", s0: 12, s1: 3, life: 0.3, spd: 150 });
          } else if (ev.skin === "arrow") burstParts(view, ev.x, ev.y, 5, { key: "sparkle", color: "#e8ffb0", s0: 16, s1: 4, life: 0.4, spd: 160 });
          else if (ev.skin === "orb") {
            P(view, { key: "burst", color: ev.color || "#fff", x: ev.x, y: ev.y, s0: 18, s1: 60, life: 0.25 });
            burstParts(view, ev.x, ev.y, 4, { key: "sparkle", color: ev.color || "#fff", s0: 14, s1: 3, life: 0.35, spd: 170 });
          } else if (ev.skin === "shadow") {
            P(view, { key: "burst", color: "#b06bff", x: ev.x, y: ev.y, s0: 20, s1: 80, life: 0.3 });
            burstParts(view, ev.x, ev.y, 4, { key: "wisp", color: "#7a3cff", s0: 30, s1: 60, life: 0.5, spd: 80 });
          } else {
            P(view, { key: "burst", color: "#ffb35c", x: ev.x, y: ev.y, s0: 24, s1: 70, life: 0.25 });
            burstParts(view, ev.x, ev.y, 3, { key: "smoke", color: "#8a8f9e", add: false, s0: 20, s1: 50, life: 0.6, a0: 0.5, spd: 60 });
            view.shake = Math.max(view.shake, 4);
          }
          S("hit");
          break;
        case "firework": {
          const c1 = "hsl(" + ev.hue + ",100%,62%)", c2 = "hsl(" + ((ev.hue + 50) % 360) + ",100%,70%)";
          P(view, { key: "star", color: "#fff", x: ev.x, y: ev.y, s0: 120, s1: 30, life: 0.3 });
          P(view, { key: "ring", color: c1, x: ev.x, y: ev.y, s0: 20, s1: 2.2 * E.T.rocketR, life: 0.45, a0: 0.8 });
          burstParts(view, ev.x, ev.y, 18, { key: "sparkle", color: c1, s0: 18, s1: 3, life: 0.9, spd: 260, drag: 0.94 });
          burstParts(view, ev.x, ev.y, 12, { key: "point", color: c2, s0: 26, s1: 6, life: 1.1, spd: 200, drag: 0.95 });
          view.shake = Math.max(view.shake, 5);
          S("boom");
          break;
        }
        case "valkyrieHit":
          P(view, { key: "blast", color: "#ff8a2a", x: ev.x, y: ev.y, s0: 60, s1: 2.6 * E.T.meteorR, life: 0.5 });
          P(view, { key: "star", color: "#fff1c4", x: ev.x, y: ev.y, s0: 200, s1: 40, life: 0.25 });
          P(view, { key: "ring", color: "#ffb05c", x: ev.x, y: ev.y, s0: 30, s1: 2.4 * E.T.meteorR, life: 0.4 });
          burstParts(view, ev.x, ev.y, 10, { key: "debris", color: "#6b4a34", add: false, s0: 26, s1: 14, life: 0.8, spd: 260, drag: 0.9 });
          burstParts(view, ev.x, ev.y, 6, { key: "cloud", color: "#5b5560", add: false, s0: 40, s1: 110, life: 1.4, a0: 0.55, spd: 60 });
          decal(view, "burst", "#1a0f0a", ev.x, ev.y, 2.2 * E.T.meteorR, 5);
          view.shake = Math.max(view.shake, 14);
          view.hitstop = Math.max(view.hitstop, 0.06);
          view.impact = 0.07;
          view.zoom = { x: ev.x, y: ev.y, t: 0.3, max: 0.3, amt: 0.07 };
          S("meteorhit");
          break;
        case "reflect":
          callout(view, "ksatriaTangkis", by[ev.id], S);
          P(view, { key: "ring", color: "#e6f0ff", x: ev.x, y: ev.y, s0: 40, s1: 120, life: 0.3 });
          P(view, { key: "star", color: "#ffffff", x: ev.x, y: ev.y, s0: 90, s1: 20, life: 0.3 });
          P(view, { key: "sparkle", color: "#cfe0ff", x: ev.tx, y: ev.ty, s0: 60, s1: 10, life: 0.35 });
          S("reflect");
          break;
        case "shieldHit":
          P(view, { key: "ringSoft", color: "#9fe6ff", x: ev.x, y: ev.y, s0: 90, s1: 110, life: 0.2, a0: 0.8 });
          break;
        case "pop":
          P(view, { key: "ring", color: "#bff0ff", x: ev.x, y: ev.y, s0: 80, s1: 170, life: 0.35 });
          burstParts(view, ev.x, ev.y, 12, { key: "sparkle", color: "#bff0ff", s0: 16, s1: 3, life: 0.5, spd: 260 });
          S("pop");
          break;
        case "heal":
          if (by[ev.id] && by[ev.id].type === "pemburu") callout(view, "pemburuDarah", by[ev.id], S);
          if (ev.quiet && Math.random() < 0.7) break;
          P(view, { key: "heart", color: "#ff3b6b", x: ev.x + (Math.random() - 0.5) * 30, y: ev.y - 20, vy: -60, s0: 16, s1: 26, life: 0.8, rot: 0, add: false, drag: 0.98 });
          if (Math.random() < 0.5) S("heal");
          break;
        case "splash":
          P(view, { key: "burst", color: "#c8ff4a", x: ev.x, y: ev.y, s0: 30, s1: 2.4 * E.T.potionR, life: 0.35 });
          burstParts(view, ev.x, ev.y, 12, { key: "sparkle", color: "#b6ff5a", s0: 16, s1: 3, life: 0.5, spd: 220 });
          burstParts(view, ev.x, ev.y, 5, { key: "cloud", color: "#8ad03a", add: false, s0: 24, s1: 60, life: 0.8, a0: 0.5, spd: 60 });
          S("pop");
          break;
        case "boom":
          view.shake = Math.max(view.shake, 11);
          S("boom");
          break;
        case "ko":
          view.shake = Math.max(view.shake, 10);
          view.hitstop = Math.max(view.hitstop, 0.12);
          view.kos = (view.kos || []).filter((t) => view.time - t < 1.2).concat([view.time]);
          if (view.onKo) view.onKo(view.kos.length);
          S("ko");
          break;
        case "skill": {
          const b = by[ev.id];
          if (SKILL_SFX[ev.type]) S(SKILL_SFX[ev.type]);
          if (!b) break;
          callout(view, ev.type, b, S);
          if (SKILLS[ev.type] && SKILLS[ev.type].call) view.cast[b.id] = 0.6;
          if (ev.r) {
            const c = TYPES[b.type].color;
            P(view, { key: "ring", color: c, x: b.x, y: b.y, s0: 30, s1: ev.r * 2.2, life: 0.4 });
            P(view, { key: "ringSoft", color: c, x: b.x, y: b.y, s0: 40, s1: ev.r * 2.3, life: 0.45, a0: 0.7 });
            burstParts(view, b.x, b.y, 8, { key: "sparkle", color: c, s0: 18, s1: 4, life: 0.45, spd: ev.r * 2 });
            view.shake = Math.max(view.shake, ev.type === "gempa" ? 7 : 3);
          }
          skillFx(view, ev.type, b, ev);
          break;
        }
      }
    }
    w.events.length = 0;
  }

  function skillFx(view, type, b, ev) {
    if (type === "petinjuJab" || type === "petinju") {
      const big = type === "petinju";
      P(view, { key: "burst", color: big ? "#ffd23c" : "#ffffff", x: ev.x, y: ev.y, s0: 20, s1: big ? 90 : 50, life: 0.2 });
      if (big) { view.shake = Math.max(view.shake, 7); burstParts(view, ev.x, ev.y, 6, { key: "star", color: "#fff6a0", s0: 22, s1: 6, life: 0.5, spd: 160 }); }
      return;
    }
    if (type === "roninTebas" || type === "pembunuhTikam" || type === "juggernautTabrak") {
      P(view, { key: "slash", color: type === "roninTebas" ? "#bcd0ff" : type === "juggernautTabrak" ? "#ffffff" : "#ff5a7a", x: ev.x, y: ev.y, s0: 50, s1: 120, life: 0.25, rot: Math.random() * TAU, vr: 0 });
      view.shake = Math.max(view.shake, type === "pembunuhTikam" ? 8 : 5);
      return;
    }
    if (type === "pembunuh") { burstParts(view, b.x, b.y, 8, { key: "smoke", color: "#4a3a5a", add: false, s0: 24, s1: 60, life: 0.6, a0: 0.6, spd: 90 }); return; }
    if (type === "waktuMundur") { P(view, { key: "swirl", color: "#7af0ff", x: b.x, y: b.y, s0: 40, s1: 150, life: 0.5, vr: -10 }); return; }
    if (type === "gong") { P(view, { key: "ring", color: "#ffd25a", x: b.x, y: b.y, s0: 30, s1: 90, life: 0.25 }); view.shake = Math.max(view.shake, 4); return; }
    if (type === "dalang" || type === "totem" || type === "tabibJamu") { burstParts(view, b.x, b.y, 8, { key: "sparkle", color: TYPES[b.type].color, s0: 18, s1: 4, life: 0.5, spd: 140 }); return; }
    if (type === "vikingInjak") {
      decal(view, "burst", "#0e1a0a", b.x, b.y, b.r * 4, 4);
      burstParts(view, b.x, b.y, 10, { key: "debris", color: "#5a4a3a", add: false, s0: 22, s1: 10, life: 0.7, spd: 260, drag: 0.9 });
      view.shake = Math.max(view.shake, 13);
      view.hitstop = Math.max(view.hitstop, 0.06);
    } else if (type === "vikingLompat") {
      burstParts(view, b.x, b.y, 6, { key: "smoke", color: "#c9c3bb", add: false, s0: 20, s1: 50, life: 0.6, a0: 0.5, spd: 90 });
    } else if (type === "berserker") {
      view.shake = Math.max(view.shake, 5);
    } else if (type === "ahlipetir") {
      P(view, { key: "glow", color: "#ffe766", x: b.x, y: b.y, s0: 140, s1: 60, life: 0.25, a0: 0.8 });
    } else if (type === "sihires") {
      burstParts(view, b.x, b.y, 6, { key: "sparkle", color: "#dff8ff", s0: 16, s1: 4, life: 0.4, spd: 140 });
    } else if (type === "dukunKeluar" || type === "dukunTembus") {
      burstParts(view, b.x, b.y, 6, { key: "cloud", color: "#d8dcff", s0: 30, s1: 80, life: 0.7, a0: 0.5, spd: 60 });
    } else if (type === "pencuri") {
      P(view, { key: "swirl", color: "#e0b070", x: b.x, y: b.y, s0: 90, s1: 20, life: 0.35, vr: 14 });
    } else if (type === "silatTaruh") {
      P(view, { key: "star", color: "#fff1a0", x: b.x, y: b.y, s0: 90, s1: 30, life: 0.3 });
    } else if (type === "druidMakan") {
      burstParts(view, b.x, b.y, 6, { key: "sparkle", color: "#7dff9a", s0: 16, s1: 4, life: 0.6, spd: 120 });
    } else if (type === "sumoCuri") {
      P(view, { key: "ring", color: "#ff5a6a", x: b.x, y: b.y, s0: 20, s1: 90, life: 0.25 });
    } else if (type === "koboi") {
      view.recoil[b.id] = 0.2;
      const a = b.aim || 0, tx = b.x + Math.cos(a) * (b.r + 18), ty = b.y + Math.sin(a) * (b.r + 18);
      P(view, { key: "flame", color: "#ffb44a", x: tx, y: ty, s0: 50, s1: 70, life: 0.14, rot: a + Math.PI / 2, vr: 0 });
      P(view, { key: "star", color: "#fff1c0", x: tx, y: ty, s0: 60, s1: 10, life: 0.15 });
      burstParts(view, tx, ty, 3, { key: "smoke", color: "#9aa0ad", add: false, s0: 16, s1: 44, life: 0.6, a0: 0.5, spd: 50 });
      view.shake = Math.max(view.shake, 3);
    } else if (type === "sniper") {
      P(view, { key: "star", color: "#ff7ab8", x: b.x, y: b.y, s0: 120, s1: 30, life: 0.25 });
    } else if (type === "ahlipetir") {
      P(view, { key: "glow", color: "#ffe766", x: b.x, y: b.y, s0: 140, s1: 60, life: 0.25, a0: 0.8 });
    } else if (type === "kosmos") {
      P(view, { key: "ring", color: "#9b6bff", x: b.x, y: b.y, s0: 30, s1: E.T.holeR * 2.2, life: 0.5 });
    } else if (type.startsWith("peramal")) {
      P(view, { key: "star", color: "#e0c8ff", x: b.x, y: b.y, s0: 90, s1: 20, life: 0.25 });
    } else if (type === "dukun") {
      burstParts(view, b.x, b.y, 6, { key: "cloud", color: "#d8dcff", s0: 30, s1: 80, life: 0.7, a0: 0.5, spd: 60 });
    } else if (type === "pemanah") {
      burstParts(view, b.x, b.y, 10, { key: "sparkle", color: "#ffa6d5", s0: 18, s1: 4, life: 0.5, spd: 180 });
      P(view, { key: "ringSoft", color: "#ff9fd0", x: b.x, y: b.y, s0: 60, s1: 150, life: 0.35, a0: 0.7 });
    } else if (type === "biksu") {
      P(view, { key: "ringSoft", color: "#e8fbff", x: b.x, y: b.y, s0: 60, s1: E.T.tornadoR * 3, life: 0.4, a0: 0.9 });
      P(view, { key: "swirl", color: "#ffffff", x: b.x, y: b.y, s0: 80, s1: E.T.tornadoR * 2.5, life: 0.4, vr: 10, a0: 0.7 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        P(view, { key: "wisp", color: "#e8fbff", x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, s0: 30, s1: 70, life: 0.4, a0: 0.6, drag: 0.9 });
      }
      view.shake = Math.max(view.shake, 4);
    } else if (type === "gladiator") {
      P(view, { key: "ringSoft", color: "#9fe6ff", x: b.x, y: b.y, s0: 20, s1: b.r * 2.8, life: 0.35 });
    } else if (type === "silat") {
      P(view, { key: "star", color: "#fff1a0", x: b.x, y: b.y, s0: 160, s1: 30, life: 0.3 });
    } else if (type === "sihirapi") {
      view.shake = Math.max(view.shake, 3);
    } else if (type === "bayangan") {
      burstParts(view, b.x, b.y, 5, { key: "wisp", color: "#7a3cff", s0: 30, s1: 70, life: 0.6, a0: 0.8, spd: 70 });
    } else if (type === "grenadier") {
      burstParts(view, b.x, b.y, 3, { key: "smoke", color: "#c9c3bb", add: false, s0: 16, s1: 40, life: 0.6, a0: 0.5, spd: 50 });
    } else if (type === "pendeta") {
      P(view, { key: "glow", color: "#ffd25a", x: b.x, y: b.y, s0: 120, s1: E.T.sunNovaR * 2.6, life: 0.45 });
      P(view, { key: "ring", color: "#ffb21a", x: b.x, y: b.y, s0: 40, s1: E.T.sunNovaR * 2.3, life: 0.45 });
      P(view, { key: "star", color: "#fff4c2", x: b.x, y: b.y, s0: 260, s1: 60, life: 0.3 });
      view.shake = Math.max(view.shake, 10);
      view.hitstop = Math.max(view.hitstop, 0.05);
    } else if (type === "samurai") {
      const t = E.bladeTip(b);
      burstParts(view, t.bx, t.by, 4, { key: "sparkle", color: "#fff", s0: 16, s1: 4, life: 0.3, spd: 200 });
    }
  }

  // efek dari w.fx yang baru muncul (ledakan bom, KO, portal, kembar)
  function popParticles(w, view) {
    for (const f of w.fx) {
      if (f.spawned) continue;
      f.spawned = true;
      if (f.kind === "pop") {
        P(view, { key: "blast", color: f.color, x: f.x, y: f.y, s0: 40, s1: 170, life: 0.5 });
        P(view, { key: "ring", color: "#ffffff", x: f.x, y: f.y, s0: 30, s1: 160, life: 0.35 });
        burstParts(view, f.x, f.y, 14, { key: "sparkle", color: f.color, s0: 22, s1: 4, life: 0.7, spd: 300 });
        burstParts(view, f.x, f.y, 6, { key: "cloud", color: "#6d7488", add: false, s0: 30, s1: 90, life: 1.0, a0: 0.45, spd: 70 });
      } else if (f.kind === "boom") {
        P(view, { key: "blast", color: "#ff9a3a", x: f.x, y: f.y, s0: 40, s1: f.r * 2.4, life: 0.5 });
        P(view, { key: "star", color: "#fff1c4", x: f.x, y: f.y, s0: 180, s1: 40, life: 0.22 });
        P(view, { key: "ringSoft", color: "#ffc070", x: f.x, y: f.y, s0: 30, s1: f.r * 2.3, life: 0.35 });
        burstParts(view, f.x, f.y, 8, { key: "debris", color: "#3b3333", add: false, s0: 22, s1: 12, life: 0.7, spd: 240, drag: 0.9 });
        burstParts(view, f.x, f.y, 6, { key: "cloud", color: "#55505a", add: false, s0: 40, s1: 110, life: 1.3, a0: 0.5, spd: 50 });
        decal(view, "burst", "#120c0a", f.x, f.y, f.r * 1.8, 4);
      } else if (f.kind === "ring" && f.color === TYPES.pencuri.color) {
        P(view, { key: "swirl", color: "#e0b070", x: f.x, y: f.y, s0: 100, s1: 20, life: 0.4, vr: -14 });
        P(view, { key: "glow", color: "#a0784a", x: f.x, y: f.y, s0: 110, s1: 40, life: 0.35 });
      } else if (f.kind === "ring") {
        P(view, { key: "ring", color: f.color, x: f.x, y: f.y, s0: 30, s1: 140, life: 0.4 });
        burstParts(view, f.x, f.y, 8, { key: "sparkle", color: f.color, s0: 18, s1: 4, life: 0.5, spd: 200 });
      } else if (f.kind === "bolt") {
        P(view, { key: "bolt", color: f.color || "#fff27a", x: f.x2, y: f.y2, s0: 90, s1: 60, life: 0.25 });
        burstParts(view, f.x2, f.y2, 5, { key: "sparkle", color: f.color || "#fff27a", s0: 16, s1: 3, life: 0.35, spd: 220 });
      } else if (f.kind === "beam") {
        for (let j = 0; j < f.pts.length - 1; j++) {
          const a = f.pts[j], c = f.pts[j + 1];
          for (let i = 1; i <= 5; i++) {
            const k = i / 5;
            P(view, { key: "sparkle", color: "#ff7ab8", x: a.x + (c.x - a.x) * k, y: a.y + (c.y - a.y) * k, s0: 20, s1: 4, life: 0.4, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80 });
          }
          P(view, { key: "burst", color: "#ff5aa0", x: c.x, y: c.y, s0: 30, s1: 80, life: 0.3 });
        }
      }
    }
  }

  // ---------------- update tiap frame ----------------
  function every(view, key, period, dt) {
    view.emitT[key] = (view.emitT[key] || 0) + dt;
    if (view.emitT[key] >= period) { view.emitT[key] = 0; return true; }
    return false;
  }

  function updateView(view, w, dt) {
    view.time += dt;
    view.shake = Math.max(0, view.shake - dt * 30);
    for (const p of view.parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d; p.vy *= d;
      p.rot += p.vr * dt;
      p.life -= dt;
    }
    view.parts = view.parts.filter((p) => p.life > 0);
    for (const t of view.texts) { t.y -= 45 * dt; t.life -= dt; }
    view.texts = view.texts.filter((t) => t.life > 0);
    for (const d of view.decals) d.life -= dt;
    view.decals = view.decals.filter((d) => d.life > 0);
    for (const id in view.squash) { view.squash[id].t -= dt; if (view.squash[id].t <= 0) delete view.squash[id]; }
    for (const id in view.recoil) { view.recoil[id] -= dt; if (view.recoil[id] <= 0) delete view.recoil[id]; }
    for (const id in view.hurt) { view.hurt[id] -= dt; if (view.hurt[id] <= 0) delete view.hurt[id]; }
    for (const id in view.cast) { view.cast[id] -= dt; if (view.cast[id] <= 0) delete view.cast[id]; }
    if (dt <= 0) return;

    for (const b of w.balls) {
      if (!b.alive) continue;
      const id = b.id;
      // ---- arah hadap ----
      const mode = MODE[b.type] || "move";
      let f = view.face[id];
      if (f == null) f = view.face[id] = mode === "spin" ? id * 1.7 : Math.atan2(b.vy, b.vx);
      if (b.frozen <= 0) {
        if (mode === "blade") f = b.blade.angle;
        else if (mode === "drone") f = b.droneAngle;
        else if (mode === "spin") {
          let rate = (Math.hypot(b.vx, b.vy) / b.r) * 0.45;
          if (b.type === "pencuri") rate = 5;
          if (b.type === "peramal") rate = 1.2;
          if (b.type === "pendeta") rate = 0.7;
          if (b.type === "silat" && b.dash > 0) rate *= 2.5;
          f += (id % 2 ? 1 : -1) * rate * dt;
        } else {
          const want = mode === "aim" && b.aim != null ? b.aim : Math.atan2(b.vy, b.vx);
          let d = want - f;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          const turn = 10 * dt;
          f += Math.max(-turn, Math.min(turn, d));
        }
      }
      view.face[id] = f;

      // ---- jejak bayangan saat ngebut ----
      const fast = (b.type === "silat" && b.dash > 0) || b.charge > 0 || b.rdash > 0 || Math.hypot(b.vx, b.vy) > 420;
      const tr = view.trails[id] || (view.trails[id] = []);
      if (fast && every(view, "trl" + id, 0.035, dt)) { tr.push({ x: b.x, y: b.y, f: view.face[id], life: 0.22 }); if (tr.length > 6) tr.shift(); }
      for (const p of tr) p.life -= dt;
      view.trails[id] = tr.filter((p) => p.life > 0);

      // ---- efek berkelanjutan ----
      if (b.frozen > 0 && !view.frozenSeen[id]) {
        view.frozenSeen[id] = true;
        burstParts(view, b.x, b.y, 8, { key: "sparkle", color: "#bff4ff", s0: 18, s1: 4, life: 0.5, spd: 160 });
        P(view, { key: "ring", color: "#bff4ff", x: b.x, y: b.y, s0: 30, s1: b.r * 3, life: 0.3 });
      } else if (b.frozen <= 0) view.frozenSeen[id] = false;

      if (b.poison > 0 && every(view, "poi" + id, 0.18, dt)) {
        P(view, { key: "smoke", color: "#8be04a", x: b.x + (Math.random() - 0.5) * b.r, y: b.y - b.r * 0.5, vy: -50, s0: 10, s1: 26, life: 0.7, a0: 0.6 });
      }
      if (b.sleep > 0 && every(view, "zz" + id, 0.45, dt)) {
        view.texts.push({ x: b.x + b.r * 0.6, y: b.y - b.r * 0.8, txt: "Z", color: "#bfe0ff", life: 0.9, max: 0.9, small: true });
      }
      if (b.possessedBy && every(view, "pos" + id, 0.05, dt)) {
        P(view, { key: "wisp", color: "#b9a6ff", x: b.x + (Math.random() - 0.5) * b.r, y: b.y + (Math.random() - 0.5) * b.r, vy: -40, s0: 26, s1: 50, life: 0.5, a0: 0.6 });
      }
      if (b.flung > 0 && every(view, "fl" + id, 0.03, dt)) {
        P(view, { key: "streak", color: "#e8fbff", x: b.x, y: b.y, s0: 60, s1: 30, life: 0.25, rot: Math.atan2(b.vy, b.vx) + Math.PI / 2, vr: 0, a0: 0.6 });
      }
      if (b.type === "sihirapi" && b.breath > 0) {
        const a = b.aim, sx = b.x + Math.cos(a) * b.r * 1.1, sy = b.y + Math.sin(a) * b.r * 1.1;
        for (let i = 0; i < 3; i++) {
          const sa = a + (Math.random() - 0.5) * 2 * E.T.breathAngle, sp = 330 + Math.random() * 120;
          P(view, { key: Math.random() < 0.6 ? "flame" : "blast", color: Math.random() < 0.5 ? "#ff8a1e" : "#ffd04a", x: sx, y: sy, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp, s0: 18, s1: 70, life: 0.42, drag: 0.94, rot: sa + Math.PI / 2, vr: (Math.random() - 0.5) * 4 });
        }
        if (every(view, "nsm" + id, 0.08, dt)) P(view, { key: "smoke", color: "#5a4a44", add: false, x: sx + Math.cos(a) * 120, y: sy + Math.sin(a) * 120, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, s0: 30, s1: 80, life: 0.8, a0: 0.35 });
      }
      if (b.type === "silat" && b.dash > 0) {
        P(view, { key: "sparkle", color: "#ffe066", x: b.x + (Math.random() - 0.5) * b.r, y: b.y + (Math.random() - 0.5) * b.r, s0: 24, s1: 4, life: 0.45, rot: 0 });
        if (every(view, "bst" + id, 0.04, dt)) P(view, { key: "glow", color: "#ffcc33", x: b.x, y: b.y, s0: b.r * 2.6, s1: b.r * 1.6, life: 0.25, a0: 0.5 });
      }
      if (b.type === "necro" && every(view, "taw" + id, 0.06, dt)) {
        for (const p of E.dronePositions(b)) P(view, { key: "point", color: "#ffd166", x: p.x, y: p.y, s0: 14, s1: 4, life: 0.3, a0: 0.8 });
      }
      if (b.bleed > 0 && every(view, "bld" + id, 0.15, dt)) {
        P(view, { key: "point", color: "#e0102a", add: false, x: b.x + (Math.random() - 0.5) * b.r, y: b.y + b.r * 0.3, vy: 60, s0: 10, s1: 6, life: 0.5, a0: 0.9, drag: 0.97 });
      }
      if (b.fear > 0 && every(view, "fear" + id, 0.35, dt)) {
        view.texts.push({ x: b.x, y: b.y - b.r - 6, txt: "!", color: "#ff7aff", life: 0.5, max: 0.5, small: true });
      }
      if (b.slow > 0 && every(view, "slw" + id, 0.2, dt)) {
        P(view, { key: "sparkle", color: "#8ad8ff", x: b.x + (Math.random() - 0.5) * b.r * 1.4, y: b.y + (Math.random() - 0.5) * b.r, s0: 12, s1: 3, life: 0.5 });
      }
      if (b.type === "berserker" && every(view, "berserker" + id, 0.07, dt)) {
        P(view, { key: "flame", color: "#ff9a2a", x: b.x - b.vx * 0.05, y: b.y - b.vy * 0.05, vx: -b.vx * 0.15, vy: -b.vy * 0.15 - 30, s0: 26, s1: 44, life: 0.35, rot: Math.atan2(-b.vy, -b.vx) + Math.PI / 2, vr: 0 });
      }
      if (b.type === "ksatria" && every(view, "cer" + id, 0.5, dt)) {
        P(view, { key: "sparkle", color: "#ffffff", x: b.x + (Math.random() - 0.5) * b.r * 1.2, y: b.y + (Math.random() - 0.5) * b.r * 1.2, s0: 4, s1: 26, life: 0.35, rot: 0 });
      }
    }

    // ---- efek dari benda di arena ----
    for (const h of w.hazards) {
      if (h.kind === "shot" && h.skin === "shadow" && Math.random() < dt * 40) {
        P(view, { key: "wisp", color: "#6a32e0", x: h.x, y: h.y, s0: 26, s1: 50, life: 0.45, a0: 0.7 });
      } else if (h.kind === "shot" && h.skin === "orb" && Math.random() < dt * 25) {
        P(view, { key: "sparkle", color: h.color, x: h.x, y: h.y, s0: h.r * 2, s1: 2, life: 0.3 });
      } else if (h.kind === "shot" && !h.skin && Math.random() < dt * 30) {
        P(view, { key: "smoke", color: "#a7adb8", add: false, x: h.x, y: h.y, s0: 10, s1: 26, life: 0.5, a0: 0.45 });
      } else if (h.kind === "rocket") {
        P(view, { key: "point", color: "hsl(" + h.hue + ",100%,65%)", x: h.x, y: h.y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, s0: 18, s1: 4, life: 0.4 });
        if (Math.random() < dt * 25) P(view, { key: "smoke", color: "#d6d0c8", add: false, x: h.x, y: h.y, s0: 12, s1: 34, life: 0.7, a0: 0.4 });
      } else if (h.kind === "hole" && Math.random() < dt * 30) {
        const a = Math.random() * TAU, rr = h.r * (0.8 + Math.random() * 0.2);
        P(view, { key: "point", color: "#c9a8ff", x: h.x + Math.cos(a) * rr, y: h.y + Math.sin(a) * rr, vx: -Math.cos(a) * rr * 2, vy: -Math.sin(a) * rr * 2, s0: 14, s1: 4, life: 0.5, drag: 1 });
      } else if (h.kind === "bomb" && Math.random() < dt * 25) {
        P(view, { key: "sparkle", color: "#ffcf66", x: h.x + 4, y: h.y - 10, vy: -40, s0: 12, s1: 3, life: 0.3 });
      } else if (h.kind === "fire" && h.erupt > 0 && Math.random() < dt * 20) {
        P(view, { key: "flame", color: "#ffcf4a", x: h.x, y: h.y, vy: -160, s0: 30, s1: 60, life: 0.35, rot: 0, vr: 0 });
      } else if (h.kind === "tornado" && Math.random() < dt * 40) {
        const a = Math.random() * TAU;
        P(view, { key: "smoke", color: "#d8eef5", add: false, x: h.x + Math.cos(a) * h.r, y: h.y + Math.sin(a) * h.r, vx: -Math.sin(a) * 200, vy: Math.cos(a) * 200, s0: 16, s1: 36, life: 0.4, a0: 0.5 });
      } else if (h.kind === "rain" && Math.random() < dt * 60) {
        const a = Math.random() * TAU, rr = Math.random() * h.r;
        P(view, { key: "streak", color: "#9fd4ff", x: h.x + Math.cos(a) * rr, y: h.y + Math.sin(a) * rr * 0.7 - 30, vy: 260, s0: 22, s1: 12, life: 0.15, rot: 0, vr: 0, a0: 0.7 });
      } else if (h.kind === "acid" && Math.random() < dt * 10) {
        P(view, { key: "point", color: "#c8ff4a", x: h.x + (Math.random() - 0.5) * h.r, y: h.y + (Math.random() - 0.5) * h.r * 0.7, vy: -30, s0: 10, s1: 4, life: 0.5 });
      } else if (h.kind === "potion" && Math.random() < dt * 30) {
        P(view, { key: "point", color: "#b6ff5a", x: h.x, y: h.y, s0: 12, s1: 3, life: 0.3 });
      } else if (h.kind === "crater" && Math.random() < dt * 8) {
        P(view, { key: "flame", color: "#ff7a1a", x: h.x + (Math.random() - 0.5) * h.r, y: h.y + (Math.random() - 0.5) * h.r, vy: -60, s0: 20, s1: 30, life: 0.4, rot: 0, vr: 0 });
      }
    }
  }

  // ---------------- gambar ----------------
  function drawArena(ctx, w, view, px, opts) {
    opts = opts || {};
    const A = E.ARENA, s = px / A, T = E.T, t = view.time;
    ctx.save();
    ctx.clearRect(0, 0, px, px);
    // waktu nyata (tetap jalan saat hit-stop) untuk efek layar
    const nowMs = performance.now();
    const rdt = Math.min(0.05, view.lastDraw ? (nowMs - view.lastDraw) / 1000 : 0);
    view.lastDraw = nowMs;
    view.impact = Math.max(0, view.impact - rdt);
    for (const c of view.callouts) c.life -= rdt;
    view.callouts = view.callouts.filter((c) => c.life > 0);
    for (const f of view.focus) f.life -= rdt;
    view.focus = view.focus.filter((f) => f.life > 0);
    if (view.zoom) { view.zoom.t -= rdt; if (view.zoom.t <= 0) view.zoom = null; }

    if (view.shake > 0) ctx.translate((Math.random() - 0.5) * view.shake, (Math.random() - 0.5) * view.shake);
    ctx.scale(s, s);
    if (view.zoom) {
      const z = view.zoom, k = Math.sin((1 - z.t / z.max) * Math.PI) * z.amt;
      ctx.translate(z.x, z.y); ctx.scale(1 + k, 1 + k); ctx.translate(-z.x, -z.y);
    }

    // lantai
    ctx.fillStyle = "#182543";
    ctx.fillRect(0, 0, A, A);
    ctx.fillStyle = "#1c2b4d";
    const tile = 42;
    for (let yy = 0; yy < A; yy += tile) for (let xx = 0; xx < A; xx += tile) if (((xx + yy) / tile) % 2 === 0) ctx.fillRect(xx, yy, tile, tile);
    const ot = w.t >= E.OVERTIME_AT;
    ctx.strokeStyle = ot ? "rgba(255,90,90," + (0.6 + Math.sin(t * 8) * 0.3) + ")" : "rgba(120,190,255,0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, A - 6, A - 6);

    // bekas hangus
    for (const d of view.decals) drawTex(ctx, d.key, d.color, d.x, d.y, d.s, d.rot, 0.6 * Math.min(1, d.life / 1.5), false);

    // benda di lantai
    for (const h of w.hazards) {
      if (h.kind === "fire") {
        const k = h.life / h.max;
        drawTex(ctx, "glow", "#ff6a10", h.x, h.y, h.r * 4, 0, 0.35 * k, true);
        drawTex(ctx, "flame", k > 0.5 ? "#ffb23a" : "#ff6a1a", h.x, h.y - 6 * k, h.r * (2.2 + Math.sin(t * 20 + h.x) * 0.3) * (0.5 + k * 0.6), Math.sin(t * 7 + h.y) * 0.2, 0.85 * k, true);
      } else if (h.kind === "bomb") {
        const k = h.fuse / h.max;
        ctx.save();
        ctx.strokeStyle = "rgba(255,80,90," + (0.15 + (1 - k) * 0.45) + ")";
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(h.x, h.y, T.bombR, 0, TAU); ctx.stroke();
        ctx.restore();
        drawTex(ctx, "glow", "#ff3b4e", h.x, h.y, 40 + (1 - k) * 30, 0, Math.sin(t * (10 + (1 - k) * 30)) > 0 ? 0.7 : 0.2, true);
        drawBarrel(ctx, h.x, h.y, 11, t);
      } else if (h.kind === "hole") {
        const k = Math.min(1, (h.life / h.max) * 2.5, (h.max - h.life) * 5);
        drawTex(ctx, "glow", "#3b1590", h.x, h.y, h.r * 2.4, 0, 0.8 * k, false);
        drawTex(ctx, "swirl", "#8a5cff", h.x, h.y, h.r * 2.2, t * 4, 0.8 * k, true);
        drawTex(ctx, "swirl", "#c9a8ff", h.x, h.y, h.r * 1.5, -t * 6 + 1, 0.7 * k, true);
        drawTex(ctx, "rune", "#a57dff", h.x, h.y, h.r * 1.2, t * 2, 0.6 * k, true);
        drawTex(ctx, "glow", "#05000f", h.x, h.y, T.holeCore * 2, 0, 0.9 * k, false);
      } else if (h.kind === "crater") {
        const k = Math.min(1, h.life / 0.6);
        drawTex(ctx, "glow", "#ff5a10", h.x, h.y, h.r * 3, 0, 0.5 * k, true);
        ctx.fillStyle = "rgba(40,12,4," + 0.8 * k + ")";
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
        drawTex(ctx, "burst", "#ff8a2a", h.x, h.y, h.r * 2.2, h.x, 0.7 * k, true);
      } else if (h.kind === "gas") {
        const k = Math.min(1, h.life / 0.8, (h.max - h.life) * 4);
        for (let i = 0; i < 5; i++) {
          const a = t * 0.8 + i * 1.256, rr = h.r * 0.45;
          drawTex(ctx, "cloud", i % 2 ? "#8be04a" : "#b6f06a", h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr * 0.8, h.r * 1.5, a, 0.4 * k, false);
        }
        drawTex(ctx, "glow", "#7acc3a", h.x, h.y, h.r * 2.4, 0, 0.25 * k, true);
      } else if (h.kind === "trap") {
        const k = 1 - h.warn / h.max;
        drawTex(ctx, "swirl", "#a0784a", h.x, h.y, h.r * 2.6, -t * 8, 0.4 + k * 0.6, true);
        ctx.fillStyle = "rgba(40,24,10," + (0.3 + k * 0.6) + ")";
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * k * 0.8, 0, 0, TAU); ctx.fill();
        drawTex(ctx, "ringSoft", "#e0b070", h.x, h.y, h.r * 2.4, 0, 0.8, true);
      } else if (h.kind === "shroom") {
        const g = Math.min(1, 1 - h.grow / E.T.shroomGrow), k = Math.min(1, h.life / 0.5);
        const R = h.r * (0.4 + 0.6 * g);
        ctx.save(); ctx.globalAlpha = k;
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath(); ctx.ellipse(h.x, h.y + R * 0.6, R, R * 0.35, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#f3e6cf";
        ctx.fillRect(h.x - R * 0.3, h.y - R * 0.1, R * 0.6, R * 0.7);
        ctx.fillStyle = "#e8524a";
        ctx.strokeStyle = "#5a1410"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(h.x, h.y - R * 0.1, R, R * 0.7, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        for (const [dx, dy, rr] of [[-0.45, -0.35, 0.18], [0.3, -0.5, 0.15], [0.1, -0.25, 0.12]]) {
          ctx.beginPath(); ctx.arc(h.x + dx * R, h.y + dy * R, rr * R, 0, TAU); ctx.fill();
        }
        ctx.restore();
      } else if (h.kind === "cactus") {
        // menara tembak mekanik
        const k = Math.min(1, h.life / 0.5, (h.max - h.life) * 4);
        const tg = E.T && w.balls.find((o) => o.alive && o.team !== h.team);
        const ang = tg ? Math.atan2(tg.y - h.y, tg.x - h.x) : 0;
        const kick = h.shotT > 0 ? 3 : 0;
        ctx.save(); ctx.globalAlpha = k; ctx.translate(h.x, h.y);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath(); ctx.ellipse(2, 9, 15, 5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#5a6070"; ctx.strokeStyle = "#1e222c"; ctx.lineWidth = 2;
        roundRect(ctx, -12, -4, 24, 14, 4); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.rotate(ang);
        ctx.fillStyle = "#2a2e38"; ctx.fillRect(4 - kick, -3, 16, 6);
        ctx.restore();
        ctx.fillStyle = "#9aa0b4"; ctx.beginPath(); ctx.arc(0, -2, 8, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = h.shotT > 0 ? "#fff27a" : "#ff8a1a"; ctx.beginPath(); ctx.arc(0, -2, 3, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (h.kind === "mine") {
        const armed = h.arm <= 0, k = Math.min(1, h.life / 0.5);
        ctx.save(); ctx.globalAlpha = k * (armed ? 0.75 : 1);
        ctx.fillStyle = "#4a4630"; ctx.strokeStyle = "#1a180c"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.7, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
        if (armed && Math.sin(t * 8 + h.x) > 0.3) drawTex(ctx, "glow", "#ff3a2a", h.x, h.y - 2, 18, 0, 0.8, true);
      } else if (h.kind === "timefield") {
        const k = Math.min(1, h.life / 0.5, (h.max - h.life) * 4);
        drawTex(ctx, "glow", "#2ab8c8", h.x, h.y, h.r * 2.4, 0, 0.3 * k, true);
        drawTex(ctx, "rune", "#7af0ff", h.x, h.y, h.r * 2.1, -t * 0.8, 0.6 * k, true);
        ctx.save(); ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = "#bff8ff"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(t * 2 - Math.PI / 2) * h.r * 0.6, h.y + Math.sin(t * 2 - Math.PI / 2) * h.r * 0.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(t / 6 - Math.PI / 2) * h.r * 0.4, h.y + Math.sin(t / 6 - Math.PI / 2) * h.r * 0.4); ctx.stroke();
        ctx.restore();
      } else if (h.kind === "acid") {
        const k = Math.min(1, h.life / 0.6, (h.max - h.life) * 5);
        ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.fillStyle = "#7ac020";
        ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.72, 0, 0, TAU); ctx.fill(); ctx.restore();
        drawTex(ctx, "glow", "#b6ff3a", h.x, h.y, h.r * 2.4, 0, 0.3 * k, true);
      } else if (h.kind === "totem") {
        const k = Math.min(1, h.life / 0.5, (h.max - h.life) * 4);
        const pulse = (t * 1.4) % 1;
        drawTex(ctx, "ringSoft", "#ff9a4a", h.x, h.y, h.r * 2 * pulse, 0, 0.5 * (1 - pulse) * k, true);
        ctx.save(); ctx.globalAlpha = k; ctx.translate(h.x, h.y);
        ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(2, 10, 12, 4, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 1.5;
        const cols = ["#c0603a", "#e0a040", "#3a8a6a"];
        for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[i]; roundRect(ctx, -8, 2 - i * 10, 16, 10, 3); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = "#fff"; ctx.fillRect(-5, -16, 3, 3); ctx.fillRect(2, -16, 3, 3);
        ctx.restore();
      } else if (h.kind === "gongwave" && h.delay <= 0) {
        const k = 1 - h.r / E.T.gongMaxR;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(255,210,90," + 0.8 * k + ")"; ctx.lineWidth = E.T.gongWidth * 0.6;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255," + 0.8 * k + ")"; ctx.lineWidth = 2;
        ctx.stroke(); ctx.restore();
      } else if (h.kind === "pillar") {
        const age = h.max - h.life, rise = Math.min(1, age / 0.18), k = Math.min(1, h.life / 0.4);
        const R = h.r, H = 22 * rise;
        ctx.save(); ctx.globalAlpha = k;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(h.x + 3, h.y + 4, R * 1.1, R * 0.8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#6e5f50";
        ctx.fillRect(h.x - R, h.y - H, R * 2, H);
        ctx.beginPath(); ctx.ellipse(h.x, h.y, R, R * 0.75, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = "#a6927c"; ctx.strokeStyle = "#3d3329"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(h.x, h.y - H, R, R * 0.75, 0, 0, TAU); ctx.fill(); ctx.stroke();
        if (h.hp < E.T.pillarHp) {
          ctx.beginPath(); ctx.moveTo(h.x - R * 0.5, h.y - H - 4); ctx.lineTo(h.x, h.y - H + 2); ctx.lineTo(h.x + R * 0.4, h.y - H - 6); ctx.stroke();
        }
        ctx.restore();
      } else if (h.kind === "band") {
        const k = h.life / h.max;
        const mx = (h.x1 + h.x2) / 2, my = (h.y1 + h.y2) / 2, L = Math.hypot(h.x2 - h.x1, h.y2 - h.y1) || 1;
        const sag = Math.sin(t * 18) * 3 * k;
        ctx.save(); ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(90,10,50," + 0.8 * k + ")"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(h.x1, h.y1); ctx.quadraticCurveTo(mx - (h.y2 - h.y1) / L * sag, my + (h.x2 - h.x1) / L * sag, h.x2, h.y2); ctx.stroke();
        ctx.strokeStyle = "rgba(255,120,190," + k + ")"; ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = "#ffd6ea";
        ctx.beginPath(); ctx.arc(h.x1, h.y1, 5, 0, TAU); ctx.arc(h.x2, h.y2, 5, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (h.kind === "constellation") {
        const p = h.pts, warn = h.warn > 0;
        const k = warn ? 1 - h.warn / h.max : Math.min(1, h.life / 0.4);
        ctx.save(); ctx.lineCap = "round"; ctx.globalCompositeOperation = "lighter";
        if (warn) { ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 60; }
        ctx.strokeStyle = warn ? "rgba(255,230,120," + (0.3 + k * 0.5) + ")" : "rgba(255,216,74," + 0.7 * k + ")";
        ctx.lineWidth = warn ? 2 : E.T.starWidth * (0.8 + Math.sin(t * 20) * 0.2);
        ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.lineTo(p[2].x, p[2].y); ctx.closePath(); ctx.stroke();
        if (!warn) { ctx.strokeStyle = "rgba(255,255,255," + k + ")"; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.restore();
        for (const q of p) drawTex(ctx, "star", "#ffe066", q.x, q.y, 34, t * 2, 0.9, true);
      } else if (h.kind === "valkyrie") {
        const k = 1 - h.delay / h.max; // 0 -> 1 saat jatuh
        drawTex(ctx, "target", "#ff4a2a", h.x, h.y, h.r * 2.2 * (1.2 - k * 0.2), t * 3, 0.5 + k * 0.5, true);
        drawTex(ctx, "glow", "#ff5a1a", h.x, h.y, h.r * 2 * k, 0, 0.5 * k, true);
      }
    }

    // ancang-ancang di bawah bola
    for (const b of w.balls) {
      if (!b.alive) continue;
      if (b.type === "kosmos" && b.timer > T.holeEvery - 0.6) {
        const k = (b.timer - (T.holeEvery - 0.6)) / 0.6;
        drawTex(ctx, "rune", "#9b6bff", b.x, b.y, b.r * (2 + k * 2), t * 3, k, true);
      }
      if (b.type === "pendeta") {
        const charge = Math.max(0, (b.timer - (T.sunNovaEvery - 0.8)) / 0.8);
        drawTex(ctx, "glow", "#ff9a1a", b.x, b.y, T.sunAuraR * 2.4 * (1 + Math.sin(t * 6) * 0.04), 0, 0.35 + charge * 0.5, true);
        drawTex(ctx, "star", "#ffcf4a", b.x, b.y, T.sunAuraR * 1.8, t * 0.6, 0.35 + charge * 0.4, true);
        drawTex(ctx, "ringSoft", "#ffb21a", b.x, b.y, T.sunAuraR * 2, 0, 0.25, true);
      }
      if (b.type === "sumo") {
        const ph = (t * 1.2) % 1, pull = b.pole > 0;
        const sz = pull ? T.magnetRange * 2 * (1 - ph) : T.magnetRange * 2 * ph;
        drawTex(ctx, "ringSoft", pull ? "#ff5a6a" : "#5a8aff", b.x, b.y, sz, 0, 0.35 * (pull ? ph : 1 - ph), true);
      }
      if (b.type === "silat" && b.marks.length) {
        ctx.save(); ctx.setLineDash([3, 7]); ctx.strokeStyle = "rgba(255,230,120,0.45)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.marks[0].x, b.marks[0].y);
        for (const q of b.marks) ctx.lineTo(q.x, q.y);
        ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
        for (const q of b.marks) drawTex(ctx, "star", "#ffe066", q.x, q.y, 26 + Math.sin(t * 6) * 4, t, 0.9, true);
      }
      if (b.type === "ninja" && b.hidden <= 0) {
        const pp = E.kembarPartner(w, b);
        if (pp && (pp.echo || pp.id > b.id)) {
          if (pp.echo) { // kembaran cermin (bayangan transparan)
            ctx.save(); ctx.globalAlpha = 0.32 + Math.sin(t * 3) * 0.06;
            drawSprite(ctx, b.type, pp.x, pp.y, b.r, frameFor(b.type, (view.face[b.id] || 0) + Math.PI));
            ctx.restore();
            drawTex(ctx, "glow", "#b98cff", pp.x, pp.y, b.r * 3, 0, 0.3, true);
          }
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
          ctx.strokeStyle = "rgba(185,140,255,0.35)"; ctx.lineWidth = T.threadWidth;
          ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(pp.x, pp.y); ctx.stroke();
          ctx.strokeStyle = "rgba(255,240,255,0.85)"; ctx.lineWidth = 2;
          ctx.setLineDash([14, 6]); ctx.lineDashOffset = -t * 90;
          ctx.stroke(); ctx.restore();
        }
      }
    }

    // bayangan bola di lantai
    for (const b of w.balls) {
      if (!b.alive || b.hidden > 0) continue;
      const up = lift(b);
      ctx.fillStyle = "rgba(0,0,0," + (0.28 - up * 0.002) + ")";
      ctx.beginPath(); ctx.ellipse(b.x + b.r * 0.12, b.y + b.r * 0.78, b.r * 0.85 * (1 - up / 300), b.r * 0.32 * (1 - up / 300), 0, 0, TAU); ctx.fill();
    }

    // garis bidik laser
    for (const b of w.balls) {
      if (!b.alive || b.type !== "sniper" || b.aim == null) continue;
      const k = Math.min(1, (b.timer - (T.laserEvery - T.laserCharge)) / T.laserCharge);
      const locked = b.timer >= T.laserEvery - T.laserLock;
      const ux = Math.cos(b.aim), uy = Math.sin(b.aim);
      const path = E.laserPath(b.x, b.y, b.aim, T.laserBounces);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = locked ? "rgba(255,255,255,0.9)" : "rgba(255,46,136," + (0.25 + k * 0.5) + ")";
      ctx.lineWidth = locked ? 3 : 1 + k * 2;
      ctx.setLineDash(locked ? [] : [10, 8]);
      ctx.lineDashOffset = -t * 120;
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (const q of path) ctx.lineTo(q.x, q.y);
      ctx.stroke();
      ctx.restore();
      drawTex(ctx, "glow", "#ff2e88", b.x + ux * b.r, b.y + uy * b.r, 30 + k * 50, 0, 0.5 + k * 0.5, true);
    }

    // bola
    for (const b of w.balls) {
      if (!b.alive || b.hidden > 0) continue;
      const id = b.id;
      let x = b.x, y = b.y;
      const up = lift(b);
      y -= up;
      const rc = view.recoil[id];
      if (rc && b.aim != null) { x -= Math.cos(b.aim) * 9 * (rc / 0.2); y -= Math.sin(b.aim) * 9 * (rc / 0.2); }
      const face = view.face[id] || 0;

      for (const p of view.trails[id] || []) {
        ctx.save();
        ctx.globalAlpha = (p.life / 0.22) * 0.35;
        drawSprite(ctx, b.type, p.x, p.y, b.r, frameFor(b.type, p.f || 0));
        ctx.restore();
      }
      ctx.save();
      if (b.ghost > 0) ctx.globalAlpha = 0.35 + Math.sin(t * 20) * 0.08;
      if (b.type === "samurai" && b.blade.thrown <= 0) {
        // jejak tebasan di belakang pedang
        drawTex(ctx, "slash", "#ffffff", x, y, (b.r + T.bladeLen) * 2.1, b.blade.angle - 0.9, 0.35, true);
        drawBlade(ctx, x, y, b.r, b.blade.angle);
      }
      if (up > 0) { ctx.translate(x, y); ctx.scale(1 + up / 160, 1 + up / 160); ctx.translate(-x, -y); }
      // gepeng saat benturan
      const sq = view.squash[id];
      ctx.translate(x, y);
      if (sq) {
        const k = (sq.t / 0.16) * sq.amt, na = Math.atan2(sq.ny, sq.nx);
        ctx.rotate(na);
        ctx.scale(1 - 0.22 * k, 1 + 0.14 * k);
        ctx.rotate(-na);
      }
      drawSprite(ctx, b.type, 0, 0, b.r, frameFor(b.type, face));
      drawFace(ctx, b, 0, 0, b.r, face, faceState(view, b, t));
      ctx.restore();

      // lapisan status
      ctx.save();
      if (b.type === "ksatria" && b.shield > 0) {
        const k = b.shield / T.bubbleHp;
        drawTex(ctx, "glow", "#7fb0ff", x, y, b.r * 3, 0, 0.16 + 0.12 * k, true);
        drawTex(ctx, "ringSoft", "#ffe9a0", x, y, b.r * 2.8, 0, 0.45 + 0.4 * k, true);
      }
      if (b.trapped > 0) {
        // terjerat jaring gladiator
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, b.r * 1.25, 0, TAU); ctx.clip();
        ctx.strokeStyle = "rgba(235,225,190,0.9)"; ctx.lineWidth = 2;
        const R = b.r * 1.25, st = R / 2.5, off = Math.sin(t * 4) * 2;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(x - R + i * st + off, y - R); ctx.lineTo(x + R + i * st + off, y + R); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + R + i * st - off, y - R); ctx.lineTo(x - R + i * st - off, y + R); ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, b.r * 1.25, 0, TAU); ctx.stroke();
      }
      if (b.hookT > 0 && b.hookSrc && b.hookSrc.alive) {
        ctx.strokeStyle = "rgba(230,240,255,0.85)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b.hookSrc.x, b.hookSrc.y); ctx.lineTo(x, y); ctx.stroke();
      }
      if (b.slow > 0) drawTex(ctx, "ringSoft", "#7ad8ff", x, y, b.r * 2.6, 0, 0.4, true);
      if (b.silence > 0) {
        drawTex(ctx, "rune", "#7a3cff", x, y, b.r * 2.6, t * 2, 0.55, true);
        drawTex(ctx, "rune", "#2a1250", x, y, b.r * 2.2, -t * 3, 0.5, false);
      }
      if (b.possessedBy) drawTex(ctx, "glow", "#9a7bff", x, y, b.r * 3.2, 0, 0.45 + Math.sin(t * 14) * 0.15, true);
      if (b.drunk > 0 || b.stun > 0) {
        for (let i = 0; i < 3; i++) {
          const a = t * 6 + (i * TAU) / 3;
          drawTex(ctx, "star", b.stun > 0 ? "#fff6a0" : "#b6f06a", x + Math.cos(a) * b.r * 0.8, y - b.r * 1.05 + Math.sin(a) * b.r * 0.25, 18, a, 0.9, true);
        }
      }
      if (b.frozen > 0) {
        ctx.fillStyle = "rgba(170,235,255,0.5)";
        ctx.beginPath(); ctx.arc(x, y, b.r * 1.04, 0, TAU); ctx.fill();
        drawTex(ctx, "sparkle", "#ffffff", x - b.r * 0.4, y - b.r * 0.4, b.r, 0, 0.8, true);
      }
      if (b.flash > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(255,255,255," + Math.min(0.55, b.flash * 4) + ")";
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();

      // ancang-ancang di atas bola
      if (b.type === "ahlipetir" && b.timer > T.cloudEvery - 0.6) {
        const k = (b.timer - (T.cloudEvery - 0.6)) / 0.6;
        drawTex(ctx, Math.random() < 0.5 ? "bolt" : "boltS", "#fff27a", x, y, b.r * (2.2 + k), Math.random() * TAU, 0.3 + k * 0.6, true);
      }
      if (b.type === "koboi" && b.timer > T.shotEvery - 0.45 && b.aim != null) {
        const k = (b.timer - (T.shotEvery - 0.45)) / 0.45;
        drawTex(ctx, "glow", "#ff9a2a", x + Math.cos(b.aim) * (b.r + 14), y + Math.sin(b.aim) * (b.r + 14), 20 + k * 40, 0, k, true);
      }
      if (b.type === "pencuri" && b.timer > T.trapEvery - 0.6) {
        const k = (b.timer - (T.trapEvery - 0.6)) / 0.6;
        drawTex(ctx, "swirl", "#e0b070", x, y, b.r * (4 - k * 1.8), -t * 12, k, true);
      }
      if (b.type === "biksu" && b.timer > T.tornadoEvery - 0.45) {
        const k = (b.timer - (T.tornadoEvery - 0.45)) / 0.45;
        drawTex(ctx, "ringSoft", "#ffffff", x, y, b.r * (5 - k * 3), 0, k * 0.8, true);
      }
      if (b.type === "pemanah" && b.timer > T.flowerEvery - 0.5) {
        const k = (b.timer - (T.flowerEvery - 0.5)) / 0.5;
        drawTex(ctx, "glow", "#ff8fc8", x, y, b.r * (2 + k * 1.5), 0, k * 0.7, true);
      }
      if (b.type === "silat" && b.dash <= 0 && b.timer > T.dashEvery - 0.35) {
        drawTex(ctx, "sparkle", "#fff1a0", x, y, b.r * 3.2, t * 8, 0.8, true);
      }
      if (b.type === "sihirapi" && b.breath <= 0 && b.timer > T.breathEvery - 0.4 && b.aim != null) {
        const k = (b.timer - (T.breathEvery - 0.4)) / 0.4;
        drawTex(ctx, "glow", "#ff7a1a", x + Math.cos(b.aim) * b.r, y + Math.sin(b.aim) * b.r, 20 + k * 50, 0, k, true);
      }
      if (b.type === "necro") {
        for (const p of E.dronePositions(b)) {
          drawTex(ctx, "glow", "#5fff9a", p.x, p.y, 26, 0, 0.4, true);
          drawSkull(ctx, p.x, p.y + Math.sin(t * 6 + p.i) * 2, 7);
        }
      }
      if (b.minion) { // tongkat wayang
        ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + b.r * 0.4); ctx.lineTo(x, y + b.r * 1.6); ctx.stroke();
      }

      drawHp(ctx, x, y, b.r, Math.ceil(b.hp), TYPES[b.type].color);
      if (opts.mineTeam != null && b.team === opts.mineTeam) {
        ctx.fillStyle = "#ffd23c";
        ctx.strokeStyle = "#1d2a4a"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - b.r - 6);
        ctx.lineTo(x - 9, y - b.r - 20);
        ctx.lineTo(x + 9, y - b.r - 20);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (opts.labels) {
        ctx.font = "12px 'Kenney Future Narrow', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(15,20,40,0.8)";
        ctx.strokeText(TYPES[b.type].name, x, y + b.r + 34);
        ctx.fillStyle = "#fff";
        ctx.fillText(TYPES[b.type].name, x, y + b.r + 34);
      }
    }

    // pedang bumerang
    for (const b of w.balls) {
      if (!b.alive || b.type !== "samurai" || b.blade.thrown <= 0) continue;
      const p = E.bladeThrowPos(b);
      drawTex(ctx, "swirl", "#ffffff", p.x, p.y, 110, b.blade.angle, 0.4, true);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.blade.angle);
      const k = T.bladeLen / (1.95 + 0.78);
      if (IMG.blade) ctx.drawImage(IMG.blade, -2 * k, -0.5 * k, 4 * k, k);
      ctx.restore();
    }

    // proyektil
    for (const h of w.hazards) {
      if (h.kind === "snow") {
        drawTex(ctx, "glow", "#bff4ff", h.x, h.y, h.r * 4, 0, 0.4, true);
        const g = ctx.createRadialGradient(h.x - h.r * 0.4, h.y - h.r * 0.4, 1, h.x, h.y, h.r);
        g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#a8dcf0");
        ctx.fillStyle = g; ctx.strokeStyle = "#5a8aa8"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.stroke();
      } else if (h.kind === "bomb") {
        const k = h.fuse / (h.state === "stuck" ? E.T.bombFuse : h.max);
        const blink = Math.sin(t * (8 + (1 - k) * 40)) > 0;
        if (h.state === "stuck" && k < 0.5) {
          ctx.save(); ctx.strokeStyle = "rgba(255,80,90," + (0.2 + (1 - k) * 0.5) + ")"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(h.x, h.y, T.bombR, 0, TAU); ctx.stroke(); ctx.restore();
        }
        drawTex(ctx, "glow", "#ff3b4e", h.x, h.y, 36 + (1 - k) * 30, 0, blink ? 0.8 : 0.25, true);
        drawBarrel(ctx, h.x, h.y, 10, t);
      } else if (h.kind === "bat") {
        const flap = Math.sin(t * 30 + h.off) * 0.6, ang = h.state === "latch" ? -Math.PI / 2 : Math.atan2(h.vy, h.vx);
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang + Math.PI / 2);
        ctx.fillStyle = "#c8d0e0";
        for (const sgn of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sgn * 13, -6 - flap * 6); ctx.lineTo(sgn * 9, 0); ctx.lineTo(sgn * 14, 4 - flap * 3); ctx.closePath(); ctx.fill();
        }
        ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffcc33";
        ctx.beginPath(); ctx.arc(-1.8, -2, 1.3, 0, TAU); ctx.arc(1.8, -2, 1.3, 0, TAU); ctx.fill();
        ctx.restore();
        if (h.stored > 0 && h.state === "back") drawTex(ctx, "glow", "#ff2d6b", h.x, h.y, 24, 0, 0.7, true);
      } else if (h.kind === "shot") {
        const ang = Math.atan2(h.vy, h.vx);
        if (h.skin === "needle") {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
          ctx.strokeStyle = "#e8ffb0"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(7, 0); ctx.stroke();
          ctx.restore();
        } else if (h.skin === "bee") {
          drawTex(ctx, "glow", "#5fff9a", h.x, h.y, 30, 0, 0.5, true);
          drawSkull(ctx, h.x, h.y, 7, ang);
        } else if (h.skin === "net") {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(t * 6);
          ctx.strokeStyle = "#e8dcb0"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, h.r, 0, TAU); ctx.stroke();
          for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * h.r, Math.sin(a) * h.r); ctx.lineTo(-Math.cos(a) * h.r, -Math.sin(a) * h.r); ctx.stroke(); }
          ctx.restore();
        } else if (h.skin === "kunai" || h.skin === "dart") {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
          ctx.strokeStyle = h.skin === "dart" ? "#c8a060" : "#3a3a48"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(4, 0); ctx.stroke();
          ctx.fillStyle = h.skin === "dart" ? "#7ad04a" : "#c8ccd8";
          ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -3.5); ctx.lineTo(3, 3.5); ctx.closePath(); ctx.fill();
          if (h.skin === "kunai") { ctx.strokeStyle = "#d04a7a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-11, 0, 2.5, 0, TAU); ctx.stroke(); }
          ctx.restore();
        } else if (h.skin === "hook") {
          const o = h.owner;
          if (o && o.alive) { ctx.strokeStyle = "rgba(230,240,255,0.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(h.x, h.y); ctx.stroke(); }
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
          ctx.strokeStyle = "#d8dce8"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
          ctx.beginPath(); ctx.arc(0, 3, 5, Math.PI * 1.5, Math.PI * 0.8); ctx.stroke();
          ctx.restore();
        } else if (h.skin === "pellet") {
          ctx.fillStyle = "#ffe2a0";
          ctx.beginPath(); ctx.arc(h.x, h.y, 3, 0, TAU); ctx.fill();
          drawTex(ctx, "streak", "#ffcf8a", h.x - Math.cos(ang) * 10, h.y - Math.sin(ang) * 10, 30, ang + Math.PI / 2, 0.6, true);
        } else if (h.skin === "jamu") {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(t * 8);
          ctx.fillStyle = "#6a3a1a"; ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(0, 0, 6, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#e8c890"; ctx.fillRect(-3, -11, 6, 4);
          ctx.restore();
        } else if (h.skin === "card") {
          drawTex(ctx, "glow", h.color, h.x, h.y, 40, 0, 0.6, true);
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(t * 9 + h.x * 0.01);
          ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = h.color; ctx.lineWidth = 2.5;
          roundRect(ctx, -6, -9, 12, 18, 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = h.color; starShape(ctx, 0, 0, 4);
          ctx.restore();
        } else if (h.skin === "spark") {
          drawTex(ctx, "point", "hsl(" + h.hue + ",100%,65%)", h.x, h.y, 26, 0, 1, true);
        } else if (h.skin === "orb") {
          drawTex(ctx, "glow", h.color, h.x, h.y, h.r * 6, 0, 0.7, true);
          ctx.fillStyle = h.color;
          ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath(); ctx.arc(h.x - h.r * 0.35, h.y - h.r * 0.35, h.r * 0.32, 0, TAU); ctx.fill();
        } else if (h.skin === "arrow") {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
          ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 2; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
          ctx.fillStyle = "#e0e4ea"; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#7fc24a"; ctx.fillRect(-13, -3, 4, 6);
          ctx.restore();
        } else if (h.skin === "shadow") {
          drawTex(ctx, "wisp", "#2a1250", h.x, h.y, 54, ang + Math.PI / 2, 0.9, false);
          drawTex(ctx, "glow", "#8a4dff", h.x, h.y, 44, 0, 0.6, true);
          ctx.fillStyle = "#ff8cff";
          ctx.beginPath(); ctx.arc(h.x + Math.cos(ang + 0.5) * 5, h.y + Math.sin(ang + 0.5) * 5, 2.5, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(h.x + Math.cos(ang - 0.5) * 5, h.y + Math.sin(ang - 0.5) * 5, 2.5, 0, TAU); ctx.fill();
        } else {
          drawTex(ctx, "streak", "#ffcf8a", h.x - Math.cos(ang) * 22, h.y - Math.sin(ang) * 22, 60, ang + Math.PI / 2, 0.7, true);
          const g = ctx.createRadialGradient(h.x - 3, h.y - 3, 1, h.x, h.y, h.r);
          g.addColorStop(0, "#9aa6b5"); g.addColorStop(1, "#1d232c");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
        }
      } else if (h.kind === "potion") {
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.spin);
        ctx.fillStyle = "rgba(160,230,60,0.9)"; ctx.strokeStyle = "#2a4010"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 2, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#d8e8f0"; ctx.fillRect(-2.5, -9, 5, 6); ctx.strokeRect(-2.5, -9, 5, 6);
        ctx.restore();
      } else if (h.kind === "rocket") {
        const ang = Math.atan2(h.vy, h.vx);
        drawTex(ctx, "flame", "hsl(" + h.hue + ",100%,60%)", h.x - Math.cos(ang) * 14, h.y - Math.sin(ang) * 14, 30, ang - Math.PI / 2, 0.9, true);
        ctx.save();
        ctx.translate(h.x, h.y); ctx.rotate(ang);
        ctx.fillStyle = "#4a6a2a"; ctx.strokeStyle = "#1a2a0a"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#9aa0a8"; ctx.fillRect(-3, -10, 6, 4);
        ctx.restore();
      } else if (h.kind === "valkyrie") {
        const k = 1 - h.delay / h.max;
        const sx = h.x - 220 * (1 - k), sy = h.y - 320 * (1 - k); // meteor datang dari kiri atas
        if (k > 0.05) {
          const ang = Math.atan2(h.y - sy, h.x - sx);
          drawTex(ctx, "flame", "#ff7a1a", sx - Math.cos(ang) * 30, sy - Math.sin(ang) * 30, 90, ang - Math.PI / 2, 0.9, true);
          drawTex(ctx, "glow", "#ffb05c", sx, sy, 70, 0, 0.8, true);
          drawSpear(ctx, sx, sy, ang, 40);
        }
      }
    }

    // awan badai, hujan & tornado (di atas bola)
    for (const h of w.hazards) {
      if (h.kind === "rain") {
        const k = Math.min(1, h.life / 0.5, (h.max - h.life) * 4);
        drawTex(ctx, "glow", "#4a8ad0", h.x, h.y, h.r * 2.2, 0, 0.25 * k, false);
        for (let i = 0; i < 6; i++) {
          const a = i * 1.05 + t * 0.5;
          drawTex(ctx, "cloud", i % 2 ? "#6a7a98" : "#8a9ab8", h.x + Math.cos(a) * 28, h.y - 50 + Math.sin(a) * 10, 66, a, 0.9 * k, false);
        }
        continue;
      }
      if (h.kind === "cloud") {
        const k = Math.min(1, h.life / 0.5, (h.max - h.life) * 4);
        ctx.save(); ctx.globalAlpha = 0.35 * k; ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(h.x, h.y, 44, 16, 0, 0, TAU); ctx.fill(); ctx.restore();
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + t * 0.6;
          drawTex(ctx, "cloud", i % 2 ? "#3a3e56" : "#5a5f78", h.x + Math.cos(a) * 30, h.y - 46 + Math.sin(a) * 12, 70, a, 1.0 * k, false);
        }
        ctx.save(); ctx.globalAlpha = 0.9 * k;
        for (const [dx, dy, rr] of [[-22, -40, 18], [0, -50, 22], [22, -42, 17], [8, -36, 16], [-10, -34, 15]]) {
          ctx.fillStyle = "#4a4e68"; ctx.beginPath(); ctx.arc(h.x + dx, h.y + dy, rr, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = "#6c7290";
        for (const [dx, dy, rr] of [[-14, -48, 10], [6, -58, 12]]) { ctx.beginPath(); ctx.arc(h.x + dx, h.y + dy, rr, 0, TAU); ctx.fill(); }
        ctx.restore();
        if (Math.random() < 0.15) drawTex(ctx, "glow", "#fff27a", h.x, h.y - 40, 90, 0, 0.5 * k, true);
      } else if (h.kind === "tornado") {
        const k = Math.min(1, h.life / 0.4, (h.max - h.life) * 4);
        for (let i = 0; i < 4; i++) {
          const yy = h.y - i * 14, sz = h.r * (1.4 + i * 0.5);
          drawTex(ctx, "swirl", i % 2 ? "#ffffff" : "#bfeaf2", h.x + Math.sin(t * 5 + i) * 4, yy, sz, t * (10 + i * 2), 0.55 * k, true);
        }
      }
    }

    // sinar & petir
    for (const f of w.fx) {
      const k = f.life / f.max;
      if (f.kind === "bolt") {
        boltPath(ctx, f);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = k;
        ctx.strokeStyle = f.color || "rgb(255,230,90)"; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.restore();
      } else if (f.kind === "beam") {
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (const q of f.pts) ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = "rgba(255,46,136," + 0.55 * k + ")"; ctx.lineWidth = T.laserWidth * 2.6 * (0.6 + k * 0.4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255," + k + ")"; ctx.lineWidth = T.laserWidth * 0.6;
        ctx.stroke();
        ctx.restore();
      }
    }

    // partikel (yang normal dulu, lalu yang menyala)
    for (const pass of [false, true]) {
      for (const p of view.parts) {
        if (p.add !== pass) continue;
        const k = p.life / p.max;
        const a = p.a0 * Math.min(1, (1 - k) * 10) * Math.min(1, k * 2.2);
        drawTex(ctx, p.key, p.color, p.x, p.y, p.s1 + (p.s0 - p.s1) * k, p.rot, a, p.add);
      }
    }

    // angka damage
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    for (const tx of view.texts) {
      const age = tx.max - tx.life;
      const pop = age < 0.1 ? 1 + (0.1 - age) * 5 : 1;
      ctx.globalAlpha = Math.min(1, tx.life * 3);
      ctx.font = Math.round((tx.crit ? 19 : tx.small ? 12 : 14) * pop) + "px 'Kenney Future', 'Arial Black', sans-serif";
      const half = ctx.measureText(tx.txt).width / 2 + 6;
      const xx = Math.max(half, Math.min(A - half, tx.x));
      const yy = Math.max(20, tx.y);
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(15,20,40,0.9)";
      ctx.strokeText(tx.txt, xx, yy);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.txt, xx, yy);
    }
    ctx.globalAlpha = 1;

    // garis fokus ala anime di sekitar bola yang memakai skill
    for (const f of view.focus) {
      const k = f.life / f.max;
      ctx.save();
      ctx.globalAlpha = 0.55 * k;
      ctx.fillStyle = "#ffffff";
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.sin(f.seed + i * 7.3) * 0.12;
        const r0 = f.r * (1.5 + (1 - k) * 0.6) + Math.abs(Math.sin(f.seed + i)) * 12, r1 = 340, wdt = 0.025 + Math.abs(Math.sin(f.seed * 3 + i)) * 0.02;
        ctx.beginPath();
        ctx.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0);
        ctx.lineTo(f.x + Math.cos(a - wdt) * r1, f.y + Math.sin(a - wdt) * r1);
        ctx.lineTo(f.x + Math.cos(a + wdt) * r1, f.y + Math.sin(a + wdt) * r1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // spanduk nama skill
    view.callouts.forEach((c, i) => drawCallout(ctx, c, i, A));
    ctx.restore();

    // impact frame: warna layar dibalik sesaat (khas anime)
    if (view.impact > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "difference";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, px, px);
      ctx.restore();
    }
  }

  function drawCallout(ctx, c, i, A) {
    const age = c.max - c.life;
    const inK = Math.min(1, age / 0.14), outK = Math.min(1, c.life / 0.2);
    const ease = 1 - Math.pow(1 - inK, 3);
    const y = 54 + i * 52;
    const dir = c.side ? -1 : 1;
    const slide = (1 - ease) * A * dir + (1 - outK) * -A * 0.6 * dir;
    const h = 40, skew = 18;
    ctx.save();
    ctx.globalAlpha = outK;
    ctx.translate(slide, 0);
    // pita miring
    ctx.beginPath();
    ctx.moveTo(-10 + skew, y - h / 2);
    ctx.lineTo(A + 10, y - h / 2);
    ctx.lineTo(A + 10 - skew, y + h / 2);
    ctx.lineTo(-10, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(15,20,40,0.82)";
    ctx.fill();
    ctx.fillStyle = c.color;
    ctx.fillRect(0, y - h / 2, A, 5);
    ctx.fillRect(0, y + h / 2 - 5, A, 5);
    // ikon bola
    drawSprite(ctx, c.type, 34, y, 15, frameFor(c.type, Math.PI / 2 - 0.25));
    drawFace(ctx, { type: c.type, hp: 1, maxHp: 1 }, 34, y, 15, Math.PI / 2, "shout");
    // teks miring
    ctx.font = "italic 22px 'Kenney Future', 'Arial Black', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.transform(1, 0, -0.18, 1, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(10,12,25,0.95)";
    const tx = 62 + y * 0.18;
    ctx.strokeText(c.text, tx, y + 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(c.text, tx, y + 1);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = outK * 0.35;
    ctx.fillText(c.text, tx, y + 1);
    ctx.restore();
  }

  function boltPath(ctx, f) {
    const seg = 8;
    ctx.beginPath();
    ctx.moveTo(f.x1, f.y1);
    for (let i = 1; i < seg; i++) {
      const k = i / seg;
      const nx = -(f.y2 - f.y1), ny = f.x2 - f.x1, len = Math.hypot(nx, ny) || 1;
      const off = Math.sin(f.seed + i * 12.9898) * 18;
      ctx.lineTo(f.x1 + (f.x2 - f.x1) * k + (nx / len) * off, f.y1 + (f.y2 - f.y1) * k + (ny / len) * off);
    }
    ctx.lineTo(f.x2, f.y2);
  }

  root.WBRender = { FX, FRAMES, SPR_SCALE, SKILLS, init, makeView, consumeEvents, popParticles, updateView, drawArena, drawSprite, ballIcon, frameFor };
})(window);
