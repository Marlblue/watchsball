// Watchsball - mesin battle (tanpa tampilan). Dipakai oleh index.html dan bisa dites di Node.
// Aturan utama: tabrakan antar bola TIDAK PERNAH memberi damage. Semua damage datang dari skill.
(function (root) {
  const ARENA = 420;
  const BASE_SPEED = 250;
  const OVERTIME_AT = 45; // detik; setelah ini semua bola kena damage yang makin besar tiap detik

  // Semua angka balancing di satu tempat
  const T = {
    critChance: 0.15,
    poisonDmg: 1, poisonEvery: 0.75, poisonTime: 4, poisonMax: 3,
    // karet: tali ketapel antar titik pantul
    karetBoost: 1.06, karetMax: 500, bandLife: 2.4, bandMin: 70, bandDmg: 4, bandPerSpeed: 100, bandFling: 1.7, bandFlingTime: 0.6,
    // es: bola salju yang membesar tiap mantul
    snowEvery: 2.4, snowSpeed: 300, snowR: 9, snowGrow: 5, snowMaxR: 30, snowBounces: 4, snowDmgBase: 8, snowDmgPerR: 0.5, snowFreeze: 0.6,
    // api: jejak api + erupsi
    fireBurn: 5, fireEvery: 0.4, fireLife: 2.4, eruptEvery: 4.5, eruptDmg: 6, eruptR: 26,
    // pedang: pedang berputar + lempar bumerang
    bladeLen: 60, bladeSpin: 4.5, bladeStart: 7, bladeGrow: 1, bladeCd: 0.35, throwEvery: 5, throwTime: 1.1, throwRange: 190, throwHitR: 26,
    // petir: awan badai yang menguntit lawan
    cloudEvery: 5.0, cloudLife: 3.6, cloudStrikeEvery: 0.55, cloudSpread: 50, cloudHitR: 30, cloudDmg: 6, cloudSpeed: 150,
    // vampir: kelelawar penghisap darah
    batEvery: 3.0, batMax: 3, batSpeed: 300, batLatch: 1.25, batTick: 0.3, batDmg: 2, batHeal: 0.5,
    // raksasa: lompat lalu injak
    giantGrow: 1.0, giantMax: 56, leapEvery: 3.5, leapTime: 0.75, stompMult: 2.2, stompDiv: 3,
    // bom: bom panas yang pindah-pindah
    bombEvery: 4.0, bombSpeed: 360, bombFuse: 2.6, bombDmg: 27, bombSplash: 11, bombR: 75, bombSelf: 0.3, bombPass: 0.3, bombGround: 1.0,
    // duri: kaktus penembak
    thorns: 0.35, cactusEvery: 3.5, cactusMax: 3, cactusLife: 9, cactusShotEvery: 1.1, cactusRange: 220, needleSpeed: 380, needleDmg: 3,
    // kembar: benang kembar
    threadCd: 0.45, threadDmg: 6, threadWidth: 12, splitKeep: 0.75, splitR: 26,
    // racun: kabut kentut yang bikin mabuk
    gasEvery: 3.0, gasR: 64, gasLife: 4.5, gasDrift: 70, gasStack: 0.4, drunkTime: 1.2,
    // batu: pilar batu
    rockMass: 2.5, rockArmor: 0.8, pillarEvery: 3.5, pillarR: 20, pillarLife: 6, pillarDmg: 7, pillarHp: 2, pillarRiseDmg: 5, pillarCd: 0.4,
    // jamur: kebun jamur
    shroomEvery: 2.2, shroomMax: 5, shroomR: 13, shroomLife: 12, shroomGrow: 0.5, shroomDmg: 11, shroomHeal: 6, shroomDizzy: 1.0,
    // magnet: kutub utara/selatan, mencuri peluru
    magnetRange: 230, magnetPull: 260, poleTime: 2.5, repelR: 160, repelMax: 29, repelMin: 6, repelPush: 260, stealR: 150,
    // meriam: peluru memantul + tendangan mundur
    shotEvery: 2.2, shotSpeed: 430, shotDmg: 10, shotBounces: 2, shotBounceDmg: 3,
    // tawon: sarang yang terus bertambah
    droneOrbit: 30, droneSpin: 3.6, droneDmg: 5, droneCd: 0.3, hiveEvery: 4, hiveStart: 2, hiveMax: 5, beeLaunchEvery: 3, beeSpeed: 330, beeDmg: 8,
    // hantu: merasuki lawan
    ghostEvery: 4.5, ghostTime: 1.2, possessRange: 230, possessTime: 1.8, possessSpeed: 1.6, possessDmg: 10,
    // laser: sinar memantul
    laserEvery: 3.2, laserDmg: 13, laserWidth: 12, laserCharge: 0.6, laserLock: 0.15, laserBounces: 2,
    // portal: lubang jebakan, jatuh dari langit
    trapEvery: 4.0, trapWarn: 0.55, trapR: 40, fallTime: 0.9, fallDmg: 15, fallStun: 0.5,
    // lubang hitam
    holeEvery: 3.5, holeLife: 2.5, holeR: 130, holePull: 380, holeCore: 70, holeDmg: 11, holeTick: 0.3, holeEatDmg: 1,
    // bunga: spiral serbuk tidur
    flowerEvery: 3.2, spiralTime: 1.2, spiralPetals: 14, petalSpeed: 260, petalDmg: 9, drowsyMax: 3, drowsyReset: 3, sleepTime: 1.4,
    // angin: tornado penculik
    tornadoEvery: 4.5, tornadoLife: 3.2, tornadoSpeed: 130, tornadoR: 42, caughtTime: 0.9, tornadoTick: 0.15, tornadoDmg: 1,
    flingMult: 2.2, flingTime: 0.9, flingWallDmg: 10,
    // gelembung: perisai + penjara gelembung
    bubbleHp: 15, bubbleRegen: 6, prisonEvery: 4.5, prisonSpeed: 210, prisonTime: 1.0, prisonDmg: 8, prisonFloat: 45,
    // cermin: memantulkan peluru, pecahan kaca
    mirrorChance: 0.24, mirrorShotChance: 0.6, shardEvery: 1.8, shardMax: 6, shardLife: 6, shardDmg: 4, shardR: 9,
    // bintang: rasi bintang
    dashEvery: 2.0, dashTime: 0.5, dashMult: 2.3, starWarn: 0.4, starLife: 2.5, starDmg: 10, starCd: 0.5, starWidth: 14,
    // naga
    breathEvery: 3.0, breathTime: 0.8, breathRange: 170, breathAngle: 0.45, breathDmg: 5, breathTick: 0.15,
    // bayangan: mencuri bayangan (skill lawan terkunci)
    shadowEvery: 3.2, shadowSpeed: 330, shadowDmg: 6, shadowTurn: 4.0, silenceTime: 1.4,
    // petasan: roket yang pecah jadi percikan
    rocketEvery: 2.8, rocketSpeed: 320, rocketR: 55, rocketDmg: 11, sparkCount: 5, sparkSpeed: 230, sparkDmg: 3,
    // meteor: + kawah lava
    meteorEvery: 4.0, meteorDelay: 0.85, meteorR: 80, meteorDmg: 32, craterR: 40, craterLife: 3, craterDmg: 3, craterTick: 0.4,
    // matahari: panas menumpuk + suar
    sunAuraR: 100, sunAuraTick: 0.5, sunHeatMax: 4, sunNovaEvery: 6, sunNovaR: 150, sunNovaDmg: 31,
  };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const RARITY = {
    biasa: { name: "Biasa", weight: 50, reward: 1 },
    langka: { name: "Langka", weight: 30, reward: 1.5 },
    epik: { name: "Epik", weight: 15, reward: 2 },
    legendaris: { name: "Legendaris", weight: 5, reward: 3 },
  };

  const TYPES = {
    karet: { name: "Karet", rarity: "biasa", color: "#ff5fa2", skill: "Tiap mantul tembok, bentangan tali karet muncul di jalurnya. Lawan yang nyangkut dijepret, makin ngebut makin sakit." },
    es: { name: "Es", rarity: "biasa", color: "#6fe3ff", skill: "Menggelindingkan bola salju yang makin besar tiap mantul tembok. Kena lawan: sakit dan membeku." },
    api: { name: "Api", rarity: "biasa", color: "#ff7a2f", skill: "Meninggalkan jejak api. Tiap 4,5 detik semua jejak api meletus bersamaan." },
    pedang: { name: "Pedang", rarity: "langka", color: "#ff4d5e", skill: "Pedang berputar yang makin tajam. Tiap 5 detik pedangnya dilempar seperti bumerang." },
    petir: { name: "Petir", rarity: "langka", color: "#ffe14d", skill: "Memanggil awan badai yang menguntit lawan dan menyambar asal-asalan di sekitarnya." },
    vampir: { name: "Vampir", rarity: "langka", color: "#c2185b", skill: "Melepas kelelawar yang menggigit lawan, lalu pulang membawa darah untuk tuannya." },
    raksasa: { name: "Raksasa", rarity: "epik", color: "#5bd46a", skill: "Membesar tiap mantul tembok. Tiap 3,5 detik melompat lalu menginjak lawan dari atas." },
    bom: { name: "Bom", rarity: "epik", color: "#9aa0b4", skill: "Menempelkan bom panas ke lawan. Bomnya pindah ke siapa pun yang ditabrak, termasuk Bom sendiri!" },
    duri: { name: "Duri", rarity: "epik", color: "#a8e04a", skill: "Menanam kaktus yang menembaki lawan. Yang menyakitinya kena balik sebagian damage-nya." },
    kembar: { name: "Kembar", rarity: "legendaris", color: "#b98cff", skill: "Punya kembaran cermin di seberang arena, terhubung benang tajam yang menyapu arena. Saat darah setengah, membelah jadi dua." },
    racun: { name: "Racun", rarity: "biasa", color: "#8be04a", skill: "Kentut kabut racun yang pelan-pelan mengejar lawan. Lawan di dalamnya keracunan dan jalannya mabuk." },
    batu: { name: "Batu", rarity: "biasa", color: "#a08c78", skill: "Memunculkan pilar batu di depan lawan. Lawan yang nabrak pilar kesakitan. Damage masuk -20%." },
    jamur: { name: "Jamur", rarity: "biasa", color: "#e8524a", skill: "Menanam jamur di arena. Lawan yang nginjak kena spora dan pusing, Jamur yang makan jadi sehat." },
    magnet: { name: "Magnet", rarity: "langka", color: "#e63946", skill: "Ganti kutub tiap 2,5 detik: menarik lawan dan mencuri pelurunya, lalu meledak mendorong." },
    meriam: { name: "Meriam", rarity: "langka", color: "#5c6b7a", skill: "Peluru meriam memantul di tembok dan makin sakit tiap pantulan. Tiap nembak, Meriam terdorong mundur." },
    tawon: { name: "Tawon", rarity: "langka", color: "#ffb703", skill: "Sarangnya terus bertambah sampai 5 tawon. Tawon bergiliran terbang menyengat lawan." },
    hantu: { name: "Hantu", rarity: "epik", color: "#d8e2ff", skill: "Merasuki lawan: lawan dikendalikan, lari ngebut, dan kesakitan tiap kepentok tembok." },
    laser: { name: "Laser", rarity: "epik", color: "#ff2e88", skill: "Menembakkan sinar yang memantul 2 kali di tembok. Bisa dihindari kalau gesit." },
    portal: { name: "Portal", rarity: "epik", color: "#2ec4b6", skill: "Membuka lubang di bawah lawan. Yang kecemplung jatuh dari langit di tempat acak." },
    lubang: { name: "Lubang Hitam", rarity: "legendaris", color: "#6c3bff", skill: "Pusaran yang menyedot lawan dan menelan peluru. Tiap peluru yang ditelan bikin pusarannya makin sakit." },
    bunga: { name: "Bunga", rarity: "biasa", color: "#ff8fc8", skill: "Menyemburkan spiral kelopak. Kena 3 kelopak, lawan tertidur pulas." },
    angin: { name: "Angin", rarity: "biasa", color: "#bfeaf2", skill: "Tornado yang mengejar lawan, memutarnya, lalu melemparnya ke tembok." },
    gelembung: { name: "Gelembung", rarity: "biasa", color: "#7fd8ff", skill: "Perisai gelembung 15. Meniup gelembung penjara yang mengurung lawan lalu meletup." },
    cermin: { name: "Cermin", rarity: "langka", color: "#c9d6e8", skill: "60% peluru lawan dipantulkan balik. Menebar pecahan kaca yang melukai lawan yang lewat." },
    bintang: { name: "Bintang", rarity: "langka", color: "#ffd84a", skill: "Melesat dan menaruh bintang. Tiap tiga bintang membentuk rasi: garis-garisnya menyetrum lawan yang lewat." },
    naga: { name: "Naga", rarity: "epik", color: "#2fbf71", skill: "Menyemburkan api ke arah lawan, membakar semua yang ada di depannya." },
    bayangan: { name: "Bayangan", rarity: "epik", color: "#3a3550", skill: "Bayangan pengejar yang mencuri bayangan lawan: skill lawan terkunci 2,5 detik." },
    petasan: { name: "Petasan", rarity: "epik", color: "#ff5a3c", skill: "Roket kembang api yang meledak lalu pecah jadi percikan warna-warni." },
    meteor: { name: "Meteor", rarity: "legendaris", color: "#ff7a1a", skill: "Meteor jatuh di posisi lawan dan meninggalkan kawah lava." },
    matahari: { name: "Matahari", rarity: "legendaris", color: "#ffb21a", skill: "Aura panas yang makin menyengat kalau lawan lama di dekatnya. Tiap 6 detik meledakkan suar surya." },
  };

  function maxHpFor(stars) {
    return 100 + 5 * (stars || 0);
  }

  function makeBall(w, type, team, x, y, angle, stars) {
    const hp = maxHpFor(stars);
    return {
      id: w.nextId++, type, team, x, y,
      vx: Math.cos(angle) * BASE_SPEED, vy: Math.sin(angle) * BASE_SPEED,
      r: 34, speed: BASE_SPEED, hp, maxHp: hp, stars: stars || 0,
      alive: true, flash: 0, timer: 0, timer2: 0, trailT: 0, wallCd: 0,
      // status
      frozen: 0, sleep: 0, stun: 0, silence: 0, trapped: 0, trapSrc: null, hidden: 0, falling: false, fallSrc: null,
      drunk: 0, flung: 0, flungSrc: null, boostT: 0, preSpeed: 0, possessedBy: null, caughtBy: null, air: 0,
      drowsy: 0, drowsyT: 0,
      // skill
      blade: { angle: 0, dmg: T.bladeStart, thrown: 0, dir: 0 }, hitCd: {}, burnCd: 0, split: false,
      poison: 0, poisonT: 0, poisonTick: 0, poisonSrc: null,
      ghost: 0, possess: null, possessT: 0, droneAngle: 0, bees: T.hiveStart,
      aim: null, breath: 0, breathTick: 0, dash: 0, auraTick: 0, heat: {},
      shield: type === "gelembung" ? T.bubbleHp : 0, shieldT: 0,
      lastWall: null, pole: 1, thread: 0, threadTick: 0, marks: [], spiral: 0, spiralN: 0, spiralA: 0, spiralT: 0,
      airFrom: null, airTo: null,
    };
  }

  // entries: [{ type, team, stars }]
  function createWorld(entries, seed) {
    const w = { t: 0, balls: [], hazards: [], fx: [], events: [], pairCd: {}, nextId: 1, winner: null, done: false, overtime: 0 };
    w.rand = rng(seed || 1);
    const n = entries.length;
    const off = w.rand() * Math.PI * 2;
    entries.forEach((e, i) => {
      const a = off + (i / n) * Math.PI * 2;
      const dist = n === 2 ? 110 : 150;
      const x = ARENA / 2 + Math.cos(a) * dist;
      const y = ARENA / 2 + Math.sin(a) * dist;
      w.balls.push(makeBall(w, e.type, e.team, x, y, w.rand() * Math.PI * 2, e.stars));
    });
    return w;
  }

  function emit(w, ev) {
    w.events.push(ev);
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // serangan langsung bisa kritis
  function strike(w, target, amt, src) {
    const crit = w.rand() < T.critChance;
    return damage(w, target, crit ? amt * 2 : amt, src, crit);
  }

  function damage(w, target, amt, src, crit, noReflect) {
    if (!target.alive || amt <= 0) return 0;
    if (src && (target.ghost > 0 || target.hidden > 0)) return 0; // tembus pandang / sedang menghilang = kebal (kecuali overtime)
    // cermin: kadang memantulkan seluruh damage ke penyerang
    if (target.type === "cermin" && src && src.alive && src !== target && !noReflect && w.rand() < T.mirrorChance) {
      emit(w, { kind: "reflect", id: target.id, x: target.x, y: target.y, tx: src.x, ty: src.y });
      damage(w, src, amt, target, crit, true);
      return 0;
    }
    // gelembung: perisai menyerap damage dulu
    if (target.shield > 0 && src) {
      const take = Math.min(target.shield, amt);
      target.shield -= take;
      amt -= take;
      emit(w, { kind: "shieldHit", id: target.id, x: target.x, y: target.y });
      if (target.shield <= 0) { target.shieldT = T.bubbleRegen; emit(w, { kind: "pop", id: target.id, x: target.x, y: target.y }); }
      if (amt <= 0) return 0;
    }
    if (target.type === "batu") amt = Math.max(1, Math.round(amt * T.rockArmor));
    target.hp -= amt;
    target.flash = 0.12;
    emit(w, { kind: "dmg", id: target.id, x: target.x, y: target.y - target.r, amt, crit: !!crit, color: src ? TYPES[src.type].color : "#fff" });
    // Duri memantulkan sebagian damage ke penyerang
    if (target.type === "duri" && src && src.alive && src !== target && src.type !== "duri") {
      const back = Math.ceil(amt * T.thorns);
      src.hp -= back;
      src.flash = 0.12;
      emit(w, { kind: "dmg", id: src.id, x: src.x, y: src.y - src.r, amt: back, color: TYPES.duri.color });
      emit(w, { kind: "skill", type: "duri", id: target.id });
      checkState(w, src);
    }
    // Cermin yang retak menjatuhkan pecahan kaca
    if (target.type === "cermin" && src && target.alive) dropShard(w, target);
    checkState(w, target);
    return amt;
  }

  function checkState(w, b) {
    if (!b.alive) return;
    if (b.hp <= 0) {
      b.alive = false;
      b.deathHp = b.hp; // dipakai untuk penentu kalau semua mati bersamaan
      b.diedAt = w.t;
      b.hp = 0;
      if (b.possess) releasePossess(w, b);
      if (b.possessedBy) releasePossess(w, b.possessedBy);
      w.fx.push({ kind: "pop", x: b.x, y: b.y, r: b.r, color: TYPES[b.type].color, life: 0.5, max: 0.5 });
      emit(w, { kind: "ko", type: b.type });
      return;
    }
    if (b.type === "kembar" && !b.split && b.hp <= b.maxHp / 2) {
      b.split = true;
      b.r = T.splitR;
      const keep = Math.ceil(b.hp * T.splitKeep);
      b.hp = keep;
      const twin = makeBall(w, "kembar", b.team, ARENA - b.x, ARENA - b.y, Math.atan2(-b.vy, -b.vx), b.stars);
      twin.split = true;
      twin.r = T.splitR;
      twin.hp = keep;
      twin.maxHp = b.maxHp;
      w.balls.push(twin); // kembaran cermin jadi nyata
      w.fx.push({ kind: "ring", x: b.x, y: b.y, r: 30, color: TYPES.kembar.color, life: 0.4, max: 0.4 });
      w.fx.push({ kind: "ring", x: twin.x, y: twin.y, r: 30, color: TYPES.kembar.color, life: 0.4, max: 0.4 });
      emit(w, { kind: "skill", type: "kembar", id: b.id });
    }
  }

  function targetable(o) {
    return o.alive && o.hidden <= 0;
  }

  function enemiesOf(w, b) {
    return w.balls.filter((o) => targetable(o) && o.team !== b.team);
  }

  function nearestEnemy(w, b, maxD) {
    let best = null, bd = maxD ? maxD * maxD : Infinity;
    for (const o of enemiesOf(w, b)) {
      const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2;
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function setSpeed(b, s) {
    const m = Math.hypot(b.vx, b.vy) || 1;
    b.speed = s;
    b.vx = (b.vx / m) * s;
    b.vy = (b.vy / m) * s;
  }

  function setDir(b, a) {
    b.vx = Math.cos(a) * b.speed;
    b.vy = Math.sin(a) * b.speed;
  }

  // ngebut sementara (dilempar, dirasuki), lalu kembali ke kecepatan semula
  function boost(b, speed, time) {
    if (b.boostT <= 0) b.preSpeed = b.speed;
    b.boostT = Math.max(b.boostT, time);
    setSpeed(b, speed);
  }

  function aimAngle(w, b, o) {
    o = o || nearestEnemy(w, b);
    return o ? Math.atan2(o.y - b.y, o.x - b.x) : w.rand() * Math.PI * 2;
  }

  function shot(w, b, a, o) {
    const h = Object.assign({
      kind: "shot", skin: "orb", color: TYPES[b.type].color,
      x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * o.speed, vy: Math.sin(a) * o.speed,
      r: 7, life: 2, team: b.team, owner: b, bounces: 0,
    }, o);
    delete h.speed;
    w.hazards.push(h);
    return h;
  }

  // serangan area di sekitar titik
  function blast(w, team, src, x, y, R, dmg, fn) {
    for (const o of w.balls) {
      if (!targetable(o) || o.team === team) continue;
      if (Math.hypot(o.x - x, o.y - y) < R + o.r) {
        const d = strike(w, o, dmg, src);
        if (fn) fn(o, d);
      }
    }
  }

  function applyPoison(w, src, o) {
    if (!o.alive || o.type === "racun") return;
    const before = o.poison;
    o.poison = Math.min(T.poisonMax, o.poison + 1);
    if (o.poison === T.poisonMax && before < T.poisonMax) emit(w, { kind: "skill", type: "racunMax", id: src.id });
    o.poisonT = T.poisonTime;
    o.poisonSrc = src;
  }

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function inTriangle(px, py, p) {
    const s = (a, b, c) => (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y);
    const q = { x: px, y: py };
    const d1 = s(q, p[0], p[1]), d2 = s(q, p[1], p[2]), d3 = s(q, p[2], p[0]);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }

  function countOwned(w, b, kind) {
    let n = 0;
    for (const h of w.hazards) if (h.kind === kind && h.owner === b && h.life > 0) n++;
    return n;
  }

  // jalur sinar laser yang memantul di tembok
  function laserPath(x, y, ang, bounces) {
    const pts = [{ x, y }];
    let ux = Math.cos(ang), uy = Math.sin(ang);
    for (let i = 0; i <= bounces; i++) {
      const tx = ux > 1e-6 ? (ARENA - x) / ux : ux < -1e-6 ? -x / ux : Infinity;
      const ty = uy > 1e-6 ? (ARENA - y) / uy : uy < -1e-6 ? -y / uy : Infinity;
      const L = Math.min(tx, ty);
      x += ux * L; y += uy * L;
      pts.push({ x, y });
      if (tx <= ty) ux = -ux; else uy = -uy;
    }
    return pts;
  }

  // pedang: posisi bilah (berputar di badan atau sedang dilempar)
  function bladeTip(b) {
    const len = T.bladeLen;
    const ca = Math.cos(b.blade.angle), sa = Math.sin(b.blade.angle);
    if (b.blade.thrown > 0) {
      const p = bladeThrowPos(b);
      return { ax: p.x - ca * len / 2, ay: p.y - sa * len / 2, bx: p.x + ca * len / 2, by: p.y + sa * len / 2 };
    }
    return { ax: b.x + ca * b.r * 0.6, ay: b.y + sa * b.r * 0.6, bx: b.x + ca * (b.r + len), by: b.y + sa * (b.r + len) };
  }
  function bladeThrowPos(b) {
    const k = 1 - b.blade.thrown / T.throwTime;
    const d = Math.sin(k * Math.PI) * T.throwRange;
    return { x: b.x + Math.cos(b.blade.dir) * d, y: b.y + Math.sin(b.blade.dir) * d };
  }

  function dronePositions(b) {
    const out = [];
    const n = b.bees || 0;
    for (let i = 0; i < n; i++) {
      const a = b.droneAngle + (i / n) * Math.PI * 2;
      out.push({ i, x: b.x + Math.cos(a) * (b.r + T.droneOrbit), y: b.y + Math.sin(a) * (b.r + T.droneOrbit) });
    }
    return out;
  }

  // kembar: pasangan benang (kembaran cermin sebelum membelah, kembaran asli sesudahnya)
  function kembarPartner(w, b) {
    if (!b.split) return { x: ARENA - b.x, y: ARENA - b.y, echo: true };
    const o = w.balls.find((k) => k !== b && k.alive && k.type === "kembar" && k.team === b.team && k.split);
    return o ? { x: o.x, y: o.y, echo: false, id: o.id } : null;
  }

  function dropShard(w, b) {
    if (countOwned(w, b, "shard") >= T.shardMax) return;
    const a = w.rand() * Math.PI * 2, d = b.r + 10 + w.rand() * 30;
    w.hazards.push({
      kind: "shard", x: clamp(b.x + Math.cos(a) * d, 12, ARENA - 12), y: clamp(b.y + Math.sin(a) * d, 12, ARENA - 12),
      r: T.shardR, life: T.shardLife, max: T.shardLife, team: b.team, owner: b, rot: w.rand() * Math.PI,
    });
  }

  // ------------------------------------------------------------ hantu
  function releasePossess(w, h) {
    const o = h.possess;
    h.possess = null;
    h.hidden = 0;
    h.possessT = 0;
    h.timer = 0;
    if (o) {
      o.possessedBy = null;
      if (o.boostT > 0) { o.boostT = 0; setSpeed(o, o.preSpeed || BASE_SPEED); }
      if (h.alive) {
        // muncul di belakang korban
        const m = Math.hypot(o.vx, o.vy) || 1;
        h.x = clamp(o.x - (o.vx / m) * (o.r + h.r + 4), h.r, ARENA - h.r);
        h.y = clamp(o.y - (o.vy / m) * (o.r + h.r + 4), h.r, ARENA - h.r);
        setDir(h, Math.atan2(-o.vy, -o.vx));
        emit(w, { kind: "skill", type: "hantuKeluar", id: h.id });
      }
    }
  }

  // ------------------------------------------------------------ tembok
  function onWall(w, b) {
    if (b.flung > 0) {
      b.flung = 0;
      strike(w, b, T.flingWallDmg, b.flungSrc);
      emit(w, { kind: "slam", x: b.x, y: b.y, id: b.id });
    }
    if (b.possessedBy) {
      strike(w, b, T.possessDmg, b.possessedBy);
      emit(w, { kind: "slam", x: b.x, y: b.y, id: b.id });
    }
    if (!canAct(b)) return;
    if (b.type === "karet") {
      const was = b.speed;
      if (b.boostT <= 0) setSpeed(b, Math.min(b.speed * T.karetBoost, T.karetMax));
      if (b.speed >= T.karetMax && was < T.karetMax) emit(w, { kind: "skill", type: "karet", id: b.id });
      const p = { x: b.x, y: b.y };
      if (b.lastWall && dist(p, b.lastWall) > T.bandMin) {
        // maksimal 2 tali sekaligus
        const mine = w.hazards.filter((h) => h.kind === "band" && h.owner === b && h.life > 0);
        if (mine.length >= 2) mine[0].life = 0;
        w.hazards.push({ kind: "band", x1: b.lastWall.x, y1: b.lastWall.y, x2: p.x, y2: p.y, life: T.bandLife, max: T.bandLife, team: b.team, owner: b, x: p.x, y: p.y });
        emit(w, { kind: "skill", type: "karetTali", id: b.id });
      }
      b.lastWall = p;
    }
    if (b.type === "raksasa" && b.air <= 0) {
      const was = b.r;
      b.r = Math.min(b.r + T.giantGrow, T.giantMax);
      if (b.r >= T.giantMax && was < T.giantMax) emit(w, { kind: "skill", type: "raksasa", id: b.id });
    }
  }

  function canMove(b) {
    return b.frozen <= 0 && b.sleep <= 0 && b.stun <= 0 && b.hidden <= 0 && !b.caughtBy;
  }
  function canAct(b) {
    return canMove(b) && b.trapped <= 0 && b.silence <= 0 && !b.possessedBy && b.air <= 0;
  }

  // ------------------------------------------------------------ skill per bola
  function skills(w, b, dt) {
    for (const k in b.hitCd) b.hitCd[k] -= dt;
    b.burnCd -= dt;
    b.timer += dt;
    b.timer2 += dt;
    b.wallCd -= dt;
    const tgt = nearestEnemy(w, b);

    if (b.type === "es" && b.timer >= T.snowEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { kind: "snow", speed: T.snowSpeed, r: T.snowR, life: 6, bounces: 0 });
      emit(w, { kind: "skill", type: "es", id: b.id });
    }

    if (b.type === "api") {
      b.trailT += dt;
      if (b.trailT >= 0.08) {
        b.trailT = 0;
        w.hazards.push({ kind: "fire", x: b.x, y: b.y, r: 14, life: T.fireLife, max: T.fireLife, team: b.team, owner: b, erupt: 0 });
      }
      if (b.timer >= T.eruptEvery) {
        b.timer = 0;
        const hit = new Set();
        for (const h of w.hazards) {
          if (h.kind !== "fire" || h.owner !== b) continue;
          h.erupt = 0.35;
          for (const o of enemiesOf(w, b)) {
            if (hit.has(o) || Math.hypot(o.x - h.x, o.y - h.y) > T.eruptR + o.r) continue;
            hit.add(o);
            strike(w, o, T.eruptDmg, b);
          }
        }
        emit(w, { kind: "skill", type: "api", id: b.id });
      }
    }

    if (b.type === "pedang") {
      if (b.blade.thrown > 0) {
        b.blade.thrown -= dt;
        b.blade.angle += T.bladeSpin * 3 * dt;
        const p = bladeThrowPos(b);
        for (const o of enemiesOf(w, b)) {
          if ((b.hitCd[o.id] || 0) > 0) continue;
          if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + T.throwHitR) {
            strike(w, o, b.blade.dmg, b);
            b.blade.dmg += T.bladeGrow;
            b.hitCd[o.id] = T.bladeCd;
            emit(w, { kind: "skill", type: "pedang", id: b.id, x: p.x, y: p.y });
          }
        }
        if (b.blade.thrown <= 0) b.timer = 0;
      } else {
        b.blade.angle += T.bladeSpin * dt;
        const s = bladeTip(b);
        for (const o of enemiesOf(w, b)) {
          if ((b.hitCd[o.id] || 0) > 0) continue;
          if (segDist(o.x, o.y, s.ax, s.ay, s.bx, s.by) < o.r) {
            strike(w, o, b.blade.dmg, b);
            b.blade.dmg += T.bladeGrow;
            if (b.blade.dmg % 5 === 0) emit(w, { kind: "skill", type: "pedangUp", id: b.id });
            b.hitCd[o.id] = T.bladeCd;
            emit(w, { kind: "skill", type: "pedang", id: b.id, x: s.bx, y: s.by });
          }
        }
        if (b.timer >= T.throwEvery && tgt) {
          b.blade.thrown = T.throwTime;
          b.blade.dir = aimAngle(w, b, tgt);
          emit(w, { kind: "skill", type: "pedangLempar", id: b.id });
        }
      }
    }

    if (b.type === "petir" && b.timer >= T.cloudEvery && tgt) {
      b.timer = 0;
      w.hazards.push({ kind: "cloud", x: tgt.x, y: tgt.y, target: tgt, life: T.cloudLife, max: T.cloudLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "petir", id: b.id });
    }

    if (b.type === "vampir" && b.timer >= T.batEvery && tgt && countOwned(w, b, "bat") < T.batMax) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "bat", state: "go", x: b.x, y: b.y, vx: Math.cos(a) * T.batSpeed, vy: Math.sin(a) * T.batSpeed, target: tgt,
        life: 8, stored: 0, tick: 0, latch: 0, off: w.rand() * Math.PI * 2, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "vampir", id: b.id });
    }

    if (b.type === "raksasa" && b.timer >= T.leapEvery && tgt) {
      b.timer = 0;
      b.air = T.leapTime;
      b.airFrom = { x: b.x, y: b.y };
      b.airTo = {
        x: clamp(tgt.x + tgt.vx * T.leapTime * 0.6, b.r, ARENA - b.r),
        y: clamp(tgt.y + tgt.vy * T.leapTime * 0.6, b.r, ARENA - b.r),
      };
      emit(w, { kind: "skill", type: "raksasaLompat", id: b.id });
    }

    if (b.type === "bom" && b.timer >= T.bombEvery && tgt && countOwned(w, b, "bomb") === 0) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "bomb", state: "fly", x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r,
        vx: Math.cos(a) * T.bombSpeed, vy: Math.sin(a) * T.bombSpeed, r: 9, fuse: T.bombFuse, max: T.bombFuse, carrier: null, passCd: 0,
        life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "bom", id: b.id });
    }

    if (b.type === "duri" && b.timer >= T.cactusEvery && countOwned(w, b, "cactus") < T.cactusMax) {
      b.timer = 0;
      w.hazards.push({ kind: "cactus", x: b.x, y: b.y, r: 14, life: T.cactusLife, max: T.cactusLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "duriTanam", id: b.id });
    }

    if (b.type === "kembar") {
      // benang ditarik oleh kembar dengan id terkecil supaya tidak dobel
      const lead = !b.split || !w.balls.some((k) => k !== b && k.alive && k.type === "kembar" && k.team === b.team && k.split && k.id < b.id);
      const p = lead && kembarPartner(w, b);
      if (p) {
        for (const o of enemiesOf(w, b)) {
          const key = "th" + o.id;
          if ((b.hitCd[key] || 0) > 0) continue;
          if (segDist(o.x, o.y, b.x, b.y, p.x, p.y) < o.r + T.threadWidth / 2) {
            b.hitCd[key] = T.threadCd;
            strike(w, o, T.threadDmg, b);
            emit(w, { kind: "skill", type: "kembarBenang", id: b.id, x: o.x, y: o.y });
          }
        }
      }
    }

    if (b.type === "racun" && b.timer >= T.gasEvery) {
      b.timer = 0;
      const m = Math.hypot(b.vx, b.vy) || 1;
      w.hazards.push({ kind: "gas", x: b.x, y: b.y, vx: (-b.vx / m) * T.gasDrift, vy: (-b.vy / m) * T.gasDrift, r: T.gasR,
        life: T.gasLife, max: T.gasLife, acc: {}, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "racun", id: b.id });
    }

    if (b.type === "batu" && b.timer >= T.pillarEvery && tgt) {
      b.timer = 0;
      const R = T.pillarR;
      const x = clamp(tgt.x + tgt.vx * 0.45, R, ARENA - R), y = clamp(tgt.y + tgt.vy * 0.45, R, ARENA - R);
      const h = { kind: "pillar", x, y, r: R, life: T.pillarLife, max: T.pillarLife, hp: T.pillarHp, team: b.team, owner: b, cd: {} };
      w.hazards.push(h);
      // pilar yang muncul tepat di bawah bola: bolanya terlempar
      for (const o of w.balls) {
        if (!targetable(o) || o.air > 0) continue;
        const d = Math.hypot(o.x - x, o.y - y);
        if (d < R + o.r) {
          const nx = d ? (o.x - x) / d : 1, ny = d ? (o.y - y) / d : 0;
          o.x = clamp(x + nx * (R + o.r + 1), o.r, ARENA - o.r);
          o.y = clamp(y + ny * (R + o.r + 1), o.r, ARENA - o.r);
          setDir(o, Math.atan2(ny, nx));
          if (o.team !== b.team) strike(w, o, T.pillarRiseDmg, b);
        }
      }
      emit(w, { kind: "skill", type: "batu", id: b.id, x, y });
    }

    if (b.type === "jamur" && b.timer >= T.shroomEvery && countOwned(w, b, "shroom") < T.shroomMax) {
      b.timer = 0;
      const M = 30;
      w.hazards.push({ kind: "shroom", x: M + w.rand() * (ARENA - 2 * M), y: M + w.rand() * (ARENA - 2 * M), r: T.shroomR,
        life: T.shroomLife, max: T.shroomLife, grow: T.shroomGrow, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "jamurTanam", id: b.id });
    }

    if (b.type === "magnet") {
      if (b.timer >= T.poleTime) {
        b.timer = 0;
        b.pole = -b.pole;
        if (b.pole < 0) {
          // tarik -> dorong: ledakan magnet, makin dekat makin sakit
          for (const o of enemiesOf(w, b)) {
            const d = Math.hypot(o.x - b.x, o.y - b.y);
            if (d > T.repelR + o.r) continue;
            const k = Math.max(0, 1 - Math.max(0, d - b.r - o.r) / T.repelR);
            strike(w, o, Math.round(T.repelMin + (T.repelMax - T.repelMin) * k), b);
            if (o.frozen <= 0 && !o.caughtBy) setDir(o, Math.atan2(o.y - b.y, o.x - b.x));
          }
          emit(w, { kind: "skill", type: "magnet", id: b.id, r: T.repelR });
        } else emit(w, { kind: "skill", type: "magnetTarik", id: b.id });
      }
      for (const o of enemiesOf(w, b)) {
        const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy) || 1;
        if (d > T.magnetRange || o.frozen > 0 || o.caughtBy || o.air > 0) continue;
        o.vx += (dx / d) * T.magnetPull * b.pole * dt;
        o.vy += (dy / d) * T.magnetPull * b.pole * dt;
        setSpeed(o, o.speed);
      }
      if (b.pole > 0) {
        // kutub tarik: peluru lawan di dekatnya dicuri lalu dibalikkan
        for (const h of w.hazards) {
          if (h.team === b.team || h.stolen || !(h.kind === "shot" || h.kind === "snow" || h.kind === "rocket" || (h.kind === "bomb" && h.state === "fly"))) continue;
          if (Math.hypot(h.x - b.x, h.y - b.y) > T.stealR) continue;
          const sp = Math.hypot(h.vx, h.vy) || 300;
          const victim = nearestEnemy(w, b);
          const a = victim ? Math.atan2(victim.y - h.y, victim.x - h.x) : Math.atan2(h.y - b.y, h.x - b.x);
          h.vx = Math.cos(a) * sp; h.vy = Math.sin(a) * sp;
          h.team = b.team; h.owner = b; h.stolen = true; h.homing = false;
          if (h.kind === "rocket" && victim) { h.tx = victim.x; h.ty = victim.y; }
          emit(w, { kind: "skill", type: "magnetCuri", id: b.id, x: h.x, y: h.y });
        }
      }
    }

    if (b.type === "meriam") {
      if (tgt) b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x); // laras selalu membidik lawan terdekat
      if (b.timer >= T.shotEvery && tgt) {
        b.timer = 0;
        shot(w, b, b.aim, { skin: "ball", speed: T.shotSpeed, r: 8, life: 3, dmg: T.shotDmg, bounces: T.shotBounces, bounceDmg: T.shotBounceDmg });
        setDir(b, b.aim + Math.PI); // tendangan mundur
        emit(w, { kind: "skill", type: "meriam", id: b.id });
      }
    }

    if (b.type === "tawon") {
      b.droneAngle += T.droneSpin * dt;
      if (b.timer2 >= T.hiveEvery) {
        b.timer2 = 0;
        if (b.bees < T.hiveMax) { b.bees++; emit(w, { kind: "skill", type: "tawonTambah", id: b.id }); }
      }
      for (const p of dronePositions(b)) {
        for (const o of enemiesOf(w, b)) {
          const key = o.id + ":" + p.i;
          if ((b.hitCd[key] || 0) > 0) continue;
          if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + 6) {
            strike(w, o, T.droneDmg, b);
            b.hitCd[key] = T.droneCd;
          }
        }
      }
      if (b.timer >= T.beeLaunchEvery && b.bees > 1 && tgt) {
        b.timer = 0;
        b.bees--;
        shot(w, b, aimAngle(w, b, tgt), { skin: "bee", speed: T.beeSpeed, r: 7, life: 3, dmg: T.beeDmg, homing: true, turn: 5 });
        emit(w, { kind: "skill", type: "tawon", id: b.id });
      }
    }

    if (b.type === "hantu") {
      if (b.ghost > 0) {
        b.ghost -= dt;
        if (b.ghost <= 0) b.timer = 0;
      } else if (b.timer >= T.ghostEvery) {
        const o = nearestEnemy(w, b, T.possessRange);
        if (o && !o.possessedBy && o.air <= 0 && !o.caughtBy) {
          b.possess = o;
          b.possessT = T.possessTime;
          b.hidden = T.possessTime + 1; // dilepas manual
          o.possessedBy = b;
          // korban dipaksa lari ke tembok terdekat
          const walls = [[o.x, Math.PI], [ARENA - o.x, 0], [o.y, -Math.PI / 2], [ARENA - o.y, Math.PI / 2]];
          walls.sort((p, q) => p[0] - q[0]);
          setDir(o, walls[0][1]);
          boost(o, BASE_SPEED * T.possessSpeed, T.possessTime);
          emit(w, { kind: "skill", type: "hantu", id: b.id, target: o.id });
        } else {
          b.ghost = T.ghostTime;
          emit(w, { kind: "skill", type: "hantuTembus", id: b.id });
        }
      }
    }

    if (b.type === "laser") {
      // ancang-ancang: membidik lawan terdekat, lalu bidikan dikunci sesaat sebelum menembak (bisa dihindari)
      if (tgt && b.timer >= T.laserEvery - T.laserCharge && (b.aim == null || b.timer < T.laserEvery - T.laserLock)) {
        b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x);
      }
      if (b.timer >= T.laserEvery && b.aim != null) {
        b.timer = 0;
        const pts = laserPath(b.x, b.y, b.aim, T.laserBounces);
        b.aim = null;
        for (const o of enemiesOf(w, b)) {
          for (let i = 0; i < pts.length - 1; i++) {
            if (segDist(o.x, o.y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < o.r + T.laserWidth / 2) { strike(w, o, T.laserDmg, b); break; }
          }
        }
        w.fx.push({ kind: "beam", pts, color: TYPES.laser.color, life: 0.3, max: 0.3 });
        emit(w, { kind: "skill", type: "laser", id: b.id });
      }
    }

    if (b.type === "portal" && b.timer >= T.trapEvery && tgt) {
      b.timer = 0;
      const x = clamp(tgt.x + tgt.vx * T.trapWarn * 0.8, 30, ARENA - 30), y = clamp(tgt.y + tgt.vy * T.trapWarn * 0.8, 30, ARENA - 30);
      w.hazards.push({ kind: "trap", x, y, r: T.trapR, warn: T.trapWarn, max: T.trapWarn, life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "portal", id: b.id });
    }

    if (b.type === "lubang" && b.timer >= T.holeEvery) {
      b.timer = 0;
      w.hazards.push({ kind: "hole", x: b.x, y: b.y, r: T.holeR, life: T.holeLife, max: T.holeLife, team: b.team, owner: b, tick: 0, bonus: 0 });
      emit(w, { kind: "skill", type: "lubang", id: b.id });
    }

    if (b.type === "bunga") {
      if (b.spiral > 0) {
        b.spiral -= dt;
        b.spiralT += dt;
        const every = T.spiralTime / T.spiralPetals;
        while (b.spiralT >= every && b.spiralN < T.spiralPetals) {
          b.spiralT -= every;
          const a = b.spiralA + b.spiralN * 0.95;
          b.spiralN++;
          shot(w, b, a, { skin: "petal", speed: T.petalSpeed, r: 7, life: 1.5, dmg: T.petalDmg, drowsy: true });
        }
        if (b.spiral <= 0) b.timer = 0;
      } else if (b.timer >= T.flowerEvery) {
        b.spiral = T.spiralTime;
        b.spiralN = 0;
        b.spiralT = 0;
        b.spiralA = aimAngle(w, b, tgt);
        emit(w, { kind: "skill", type: "bunga", id: b.id });
      }
    }

    if (b.type === "angin" && b.timer >= T.tornadoEvery && tgt) {
      b.timer = 0;
      w.hazards.push({ kind: "tornado", x: b.x, y: b.y, r: T.tornadoR, life: T.tornadoLife, max: T.tornadoLife, caught: null, catchT: 0,
        spin: 0, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "angin", id: b.id });
    }

    if (b.type === "gelembung") {
      if (b.shield <= 0) {
        b.shieldT -= dt;
        if (b.shieldT <= 0) { b.shield = T.bubbleHp; emit(w, { kind: "skill", type: "gelembung", id: b.id }); }
      }
      if (b.timer >= T.prisonEvery && tgt) {
        b.timer = 0;
        shot(w, b, aimAngle(w, b, tgt), { skin: "bubble", speed: T.prisonSpeed, r: 13, life: 3, dmg: 0, prison: true, homing: true, turn: 2.2 });
        emit(w, { kind: "skill", type: "gelembungTiup", id: b.id });
      }
    }

    if (b.type === "cermin" && b.timer >= T.shardEvery) {
      b.timer = 0;
      dropShard(w, b);
    }

    if (b.type === "bintang") {
      if (b.dash > 0) {
        b.dash -= dt;
        if (b.dash <= 0) {
          setSpeed(b, BASE_SPEED);
          b.marks.push({ x: b.x, y: b.y });
          emit(w, { kind: "skill", type: "bintangTaruh", id: b.id, x: b.x, y: b.y });
          if (b.marks.length >= 3) {
            w.hazards.push({ kind: "constellation", pts: b.marks.slice(0, 3), warn: T.starWarn, max: T.starWarn, life: 1, team: b.team, owner: b });
            b.marks = [];
          }
        }
      } else if (b.timer >= T.dashEvery && tgt) {
        b.timer = 0;
        b.dash = T.dashTime;
        setDir(b, aimAngle(w, b, tgt));
        setSpeed(b, BASE_SPEED * T.dashMult);
        emit(w, { kind: "skill", type: "bintang", id: b.id });
      }
    }

    if (b.type === "naga") {
      if (b.breath > 0) {
        b.breath -= dt;
        if (tgt) { // kepala pelan-pelan mengikuti lawan
          const want = Math.atan2(tgt.y - b.y, tgt.x - b.x);
          let d = want - b.aim;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          b.aim += Math.max(-2.5 * dt, Math.min(2.5 * dt, d));
        }
        b.breathTick += dt;
        if (b.breathTick >= T.breathTick) {
          b.breathTick = 0;
          for (const o of enemiesOf(w, b)) {
            const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
            if (d > T.breathRange + o.r) continue;
            let da = Math.atan2(dy, dx) - b.aim;
            da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
            if (da < T.breathAngle + Math.atan2(o.r, Math.max(d, 1))) damage(w, o, T.breathDmg, b);
          }
        }
        if (b.breath <= 0) b.timer = 0;
      } else {
        if (tgt) b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x);
        if (b.timer >= T.breathEvery && tgt) {
          b.breath = T.breathTime;
          b.breathTick = T.breathTick;
          emit(w, { kind: "skill", type: "naga", id: b.id });
        }
      }
    }

    if (b.type === "bayangan" && b.timer >= T.shadowEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { skin: "shadow", speed: T.shadowSpeed, r: 15, life: 2.2, dmg: T.shadowDmg, homing: true, silence: true, x: b.x, y: b.y });
      emit(w, { kind: "skill", type: "bayangan", id: b.id });
    }

    if (b.type === "petasan" && b.timer >= T.rocketEvery && tgt) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "rocket", x: b.x, y: b.y, tx: tgt.x, ty: tgt.y, vx: Math.cos(a) * T.rocketSpeed, vy: Math.sin(a) * T.rocketSpeed,
        r: 8, life: 2.5, team: b.team, owner: b, hue: Math.floor(w.rand() * 360) });
      emit(w, { kind: "skill", type: "petasan", id: b.id });
    }

    if (b.type === "meteor" && b.timer >= T.meteorEvery && tgt) {
      b.timer = 0;
      // ditandai di posisi lawan + sedikit ke arah geraknya
      const x = clamp(tgt.x + tgt.vx * 0.35, 20, ARENA - 20);
      const y = clamp(tgt.y + tgt.vy * 0.35, 20, ARENA - 20);
      w.hazards.push({ kind: "meteor", x, y, r: T.meteorR, delay: T.meteorDelay, max: T.meteorDelay, life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "meteor", id: b.id });
    }

    if (b.type === "matahari") {
      b.auraTick += dt;
      if (b.auraTick >= T.sunAuraTick) {
        b.auraTick = 0;
        for (const o of enemiesOf(w, b)) {
          if (Math.hypot(o.x - b.x, o.y - b.y) < T.sunAuraR + o.r) {
            b.heat[o.id] = Math.min(T.sunHeatMax, (b.heat[o.id] || 0) + 1);
            damage(w, o, b.heat[o.id], b);
          } else b.heat[o.id] = 0;
        }
      }
      if (b.timer >= T.sunNovaEvery) {
        b.timer = 0;
        blast(w, b.team, b, b.x, b.y, T.sunNovaR, T.sunNovaDmg);
        emit(w, { kind: "skill", type: "matahari", id: b.id, x: b.x, y: b.y });
      }
    }
  }

  function poisonTick(w, b, dt) {
    if (b.poison <= 0) return;
    b.poisonT -= dt;
    b.poisonTick += dt;
    if (b.poisonTick >= T.poisonEvery) {
      b.poisonTick = 0;
      damage(w, b, T.poisonDmg * b.poison, b.poisonSrc);
    }
    if (b.poisonT <= 0) b.poison = 0;
  }

  // ------------------------------------------------------------ peluru kena bola
  function projectileHits(w, h, o) {
    // cermin memantulkan semua peluru lawan
    if (o.type === "cermin" && h.kind !== "bomb" && !h.mirrorRolled && (h.mirrorRolled = true) && w.rand() < T.mirrorShotChance) {
      const back = h.owner && h.owner.alive ? h.owner : nearestEnemy(w, o);
      const sp = Math.hypot(h.vx, h.vy) || 300;
      const a = back ? Math.atan2(back.y - h.y, back.x - h.x) : Math.atan2(h.y - o.y, h.x - o.x);
      h.vx = Math.cos(a) * sp; h.vy = Math.sin(a) * sp;
      h.team = o.team; h.owner = o; h.homing = false;
      if (h.kind === "rocket" && back) { h.tx = back.x; h.ty = back.y; }
      const m = Math.hypot(h.x - o.x, h.y - o.y) || 1;
      h.x = o.x + ((h.x - o.x) / m) * (o.r + h.r + 2);
      h.y = o.y + ((h.y - o.y) / m) * (o.r + h.r + 2);
      emit(w, { kind: "reflect", id: o.id, x: h.x, y: h.y, tx: h.x + h.vx * 0.2, ty: h.y + h.vy * 0.2 });
      return false;
    }
    return true;
  }

  function moveBounce(h, dt) {
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    let hit = false;
    if (h.x < h.r) { h.x = h.r; h.vx = Math.abs(h.vx); hit = true; }
    if (h.x > ARENA - h.r) { h.x = ARENA - h.r; h.vx = -Math.abs(h.vx); hit = true; }
    if (h.y < h.r) { h.y = h.r; h.vy = Math.abs(h.vy); hit = true; }
    if (h.y > ARENA - h.r) { h.y = ARENA - h.r; h.vy = -Math.abs(h.vy); hit = true; }
    return hit;
  }

  function homeTo(h, tx, ty, turn, dt) {
    const cur = Math.atan2(h.vy, h.vx);
    let d = Math.atan2(ty - h.y, tx - h.x) - cur;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const a = cur + Math.max(-turn * dt, Math.min(turn * dt, d));
    const sp = Math.hypot(h.vx, h.vy);
    h.vx = Math.cos(a) * sp;
    h.vy = Math.sin(a) * sp;
  }

  function hazards(w, dt) {
    for (const h of w.hazards) {
      if (h.life <= 0) continue;
      const own = h.owner;
      if (h.kind === "fire") {
        h.life -= dt;
        h.erupt = Math.max(0, h.erupt - dt);
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.burnCd > 0 || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.6) {
            o.burnCd = T.fireEvery;
            damage(w, o, T.fireBurn, own);
          }
        }
      } else if (h.kind === "crater") {
        h.life -= dt;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.burnCd > 0 || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.5) {
            o.burnCd = T.craterTick;
            damage(w, o, T.craterDmg, own);
          }
        }
      } else if (h.kind === "band") {
        h.life -= dt;
        if (!own.alive) { h.life = 0; continue; }
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          if (segDist(o.x, o.y, h.x1, h.y1, h.x2, h.y2) < o.r) {
            const dmg = T.bandDmg + Math.max(0, Math.floor((own.speed - BASE_SPEED) / T.bandPerSpeed));
            strike(w, o, dmg, own);
            // dijepret tegak lurus dari tali
            const dx = h.x2 - h.x1, dy = h.y2 - h.y1, L = Math.hypot(dx, dy) || 1;
            let nx = -dy / L, ny = dx / L;
            if ((o.x - h.x1) * nx + (o.y - h.y1) * ny < 0) { nx = -nx; ny = -ny; }
            if (o.frozen <= 0 && !o.caughtBy) {
              setDir(o, Math.atan2(ny, nx));
              boost(o, Math.max(o.speed, BASE_SPEED) * T.bandFling, T.bandFlingTime);
            }
            h.life = 0;
            emit(w, { kind: "snap", x: o.x, y: o.y, x1: h.x1, y1: h.y1, x2: h.x2, y2: h.y2 });
            break;
          }
        }
      } else if (h.kind === "snow") {
        h.life -= dt;
        if (moveBounce(h, dt)) {
          h.bounces++;
          h.r = Math.min(T.snowMaxR, h.r + T.snowGrow);
          if (h.bounces > T.snowBounces) { h.life = 0; emit(w, { kind: "impact", x: h.x, y: h.y, skin: "snow", r: h.r }); }
        }
        for (const o of w.balls) {
          if (h.life <= 0 || !targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r) {
            if (!projectileHits(w, h, o)) continue;
            strike(w, o, Math.round(T.snowDmgBase + h.r * T.snowDmgPerR), own);
            if (o.alive && o.type !== "es") o.frozen = Math.max(o.frozen, T.snowFreeze + h.r * 0.02);
            h.life = 0;
            emit(w, { kind: "impact", x: h.x, y: h.y, skin: "snow", r: h.r });
          }
        }
      } else if (h.kind === "shot") {
        h.life -= dt;
        if (h.homing) {
          const t = nearestEnemy(w, { x: h.x, y: h.y, team: h.team });
          if (t) homeTo(h, t.x, t.y, h.turn || T.shadowTurn, dt);
        }
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        if (h.x < 0 || h.y < 0 || h.x > ARENA || h.y > ARENA) {
          if (h.bounces > 0) {
            h.bounces--;
            h.dmg += h.bounceDmg || 0;
            if (h.x < 0 || h.x > ARENA) h.vx = -h.vx;
            if (h.y < 0 || h.y > ARENA) h.vy = -h.vy;
            h.x = clamp(h.x, 0, ARENA); h.y = clamp(h.y, 0, ARENA);
            emit(w, { kind: "ricochet", x: h.x, y: h.y });
          } else h.life = 0;
        }
        for (const o of w.balls) {
          if (h.life <= 0 || !targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r) {
            if (!projectileHits(w, h, o)) continue;
            if (h.dmg) strike(w, o, h.dmg, h.owner);
            if (o.alive) {
              if (h.silence) { o.silence = T.silenceTime; emit(w, { kind: "skill", type: "bayanganCuri", id: h.owner.id, target: o.id }); }
              if (h.drowsy && o.type !== "bunga") {
                o.drowsy++;
                o.drowsyT = T.drowsyReset;
                if (o.drowsy >= T.drowsyMax) {
                  o.drowsy = 0;
                  o.sleep = T.sleepTime;
                  emit(w, { kind: "skill", type: "bungaTidur", id: h.owner.id, target: o.id });
                }
              }
              if (h.prison && o.trapped <= 0) {
                o.trapped = T.prisonTime;
                o.trapSrc = h.owner;
                emit(w, { kind: "skill", type: "gelembungPenjara", id: h.owner.id, target: o.id });
              }
            }
            h.life = 0;
            emit(w, { kind: "impact", x: h.x, y: h.y, skin: h.skin || "ball", color: h.color });
          }
        }
      } else if (h.kind === "bomb") {
        h.fuse -= dt;
        h.passCd -= dt;
        if (h.state === "fly") {
          const bt = nearestEnemy(w, { x: h.x, y: h.y, team: h.team });
          if (bt) homeTo(h, bt.x, bt.y, 3.5, dt);
          moveBounce(h, dt);
          const sp = Math.hypot(h.vx, h.vy);
          h.fuse = Math.max(h.fuse, T.bombFuse * 0.5); // sumbu baru jalan setelah menempel
          if (h.flyT == null) h.flyT = 0;
          h.flyT += dt;
          if (h.flyT > 1.6) { h.state = "ground"; h.vx = h.vy = 0; h.fuse = T.bombGround; }
          for (const o of w.balls) {
            if (h.state !== "fly" || !targetable(o) || o.team === h.team || o.air > 0) continue;
            if (Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r) {
              if (o.type === "cermin") { // cermin memantulkan bomnya
                const a = Math.atan2(h.y - o.y, h.x - o.x);
                h.vx = Math.cos(a) * sp; h.vy = Math.sin(a) * sp; h.team = o.team;
                emit(w, { kind: "reflect", id: o.id, x: h.x, y: h.y, tx: h.x, ty: h.y });
                continue;
              }
              h.state = "stuck";
              h.fuse = T.bombFuse;
              h.carrier = o;
              h.passCd = T.bombPass;
              emit(w, { kind: "skill", type: "bomTempel", id: own.id, target: o.id });
            }
          }
        } else if (h.state === "stuck") {
          const c = h.carrier;
          if (!c || !c.alive) { h.state = "ground"; h.carrier = null; }
          else { h.x = c.x; h.y = c.y - c.r * 0.7; }
        }
        if (h.fuse <= 0) {
          h.life = 0;
          const c = h.carrier;
          if (c && c.alive) {
            const friendly = c.team === own.team;
            if (friendly) damage(w, c, Math.round(T.bombDmg * T.bombSelf), null);
            else strike(w, c, T.bombDmg, own);
          }
          for (const o of w.balls) {
            if (o === c || !targetable(o) || o.team === own.team) continue;
            if (Math.hypot(o.x - h.x, o.y - h.y) < T.bombR + o.r) strike(w, o, T.bombSplash, own);
          }
          w.fx.push({ kind: "boom", x: h.x, y: h.y, r: T.bombR, life: 0.35, max: 0.35 });
          emit(w, { kind: "boom" });
        }
      } else if (h.kind === "rocket") {
        h.life -= dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        let boom = h.life <= 0 || Math.hypot(h.tx - h.x, h.ty - h.y) < 14 || h.x < 0 || h.y < 0 || h.x > ARENA || h.y > ARENA;
        for (const o of w.balls) {
          if (boom || !targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r) {
            if (projectileHits(w, h, o)) boom = true;
          }
        }
        if (boom) {
          h.life = 0;
          h.x = clamp(h.x, 5, ARENA - 5); h.y = clamp(h.y, 5, ARENA - 5);
          blast(w, h.team, h.owner, h.x, h.y, T.rocketR, T.rocketDmg);
          // pecah jadi percikan
          const off = w.rand() * Math.PI * 2;
          for (let i = 0; i < T.sparkCount; i++) {
            const a = off + (i / T.sparkCount) * Math.PI * 2;
            w.hazards.push({ kind: "shot", skin: "spark", hue: (h.hue + i * 40) % 360, x: h.x, y: h.y, vx: Math.cos(a) * T.sparkSpeed, vy: Math.sin(a) * T.sparkSpeed,
              r: 5, life: 0.7, dmg: T.sparkDmg, team: h.team, owner: h.owner, bounces: 0 });
          }
          emit(w, { kind: "firework", x: h.x, y: h.y, hue: h.hue });
        }
      } else if (h.kind === "meteor") {
        h.delay -= dt;
        if (h.delay <= 0) {
          h.life = 0;
          blast(w, h.team, own, h.x, h.y, h.r, T.meteorDmg);
          w.hazards.push({ kind: "crater", x: h.x, y: h.y, r: T.craterR, life: T.craterLife, max: T.craterLife, team: h.team, owner: own });
          emit(w, { kind: "meteorHit", x: h.x, y: h.y });
        }
      } else if (h.kind === "hole") {
        h.life -= dt;
        if (own.alive) { h.x = own.x; h.y = own.y; } // pusaran ikut pemiliknya
        h.tick += dt;
        const doTick = h.tick >= T.holeTick;
        if (doTick) h.tick = 0;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          const dx = h.x - o.x, dy = h.y - o.y, d = Math.hypot(dx, dy) || 1;
          if (d > h.r) continue;
          if (o.frozen <= 0 && !o.caughtBy) {
            o.vx += (dx / d) * T.holePull * dt;
            o.vy += (dy / d) * T.holePull * dt;
            setSpeed(o, o.speed);
          }
          if (doTick && d < T.holeCore + o.r) damage(w, o, T.holeDmg + h.bonus, own);
        }
        // menelan peluru lawan
        for (const p of w.hazards) {
          if (p === h || p.life <= 0 || p.team === h.team) continue;
          if (!(p.kind === "shot" || p.kind === "snow" || p.kind === "rocket" || (p.kind === "bomb" && p.state !== "stuck"))) continue;
          const dx = h.x - p.x, dy = h.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d > h.r) continue;
          if (d < 22) {
            p.life = 0; if (p.kind === "bomb") p.fuse = 99;
            h.bonus += T.holeEatDmg;
            emit(w, { kind: "skill", type: "lubangMakan", id: own.id, x: h.x, y: h.y });
          } else if (p.vx != null) {
            p.vx += (dx / d) * 900 * dt;
            p.vy += (dy / d) * 900 * dt;
          }
        }
      } else if (h.kind === "cloud") {
        h.life -= dt;
        const t = h.target;
        if (!own.alive) { h.life = 0; continue; }
        if (t && targetable(t)) {
          const dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy);
          const step = Math.min(d, T.cloudSpeed * dt);
          if (d > 0) { h.x += (dx / d) * step; h.y += (dy / d) * step; }
        }
        h.tick += dt;
        if (h.tick >= T.cloudStrikeEvery) {
          h.tick = 0;
          const a = w.rand() * Math.PI * 2, rr = w.rand() * T.cloudSpread;
          const px = clamp(h.x + Math.cos(a) * rr, 0, ARENA), py = clamp(h.y + Math.sin(a) * rr, 0, ARENA);
          blast(w, h.team, own, px, py, T.cloudHitR, T.cloudDmg);
          w.fx.push({ kind: "bolt", x1: px + (w.rand() - 0.5) * 30, y1: py - 140, x2: px, y2: py, life: 0.25, max: 0.25, seed: w.rand() * 1000 });
          emit(w, { kind: "thunder", x: px, y: py });
        }
      } else if (h.kind === "bat") {
        h.life -= dt;
        if (!own.alive) { h.life = 0; continue; }
        const t = h.target;
        if (h.state !== "back" && (!t || !targetable(t))) h.state = "back";
        if (h.state === "go") {
          homeTo(h, t.x, t.y, 7, dt);
          h.x += h.vx * dt; h.y += h.vy * dt;
          if (Math.hypot(t.x - h.x, t.y - h.y) < t.r + 4) { h.state = "latch"; h.latch = T.batLatch; h.tick = 0; }
        } else if (h.state === "latch") {
          h.off += dt * 3;
          h.x = t.x + Math.cos(h.off) * t.r * 0.8;
          h.y = t.y + Math.sin(h.off) * t.r * 0.8;
          h.latch -= dt;
          h.tick += dt;
          if (h.tick >= T.batTick) { h.tick = 0; h.stored += damage(w, t, T.batDmg, own); }
          if (h.latch <= 0) { h.state = "back"; const a = Math.atan2(own.y - h.y, own.x - h.x); h.vx = Math.cos(a) * T.batSpeed; h.vy = Math.sin(a) * T.batSpeed; }
        } else {
          homeTo(h, own.x, own.y, 9, dt);
          h.x += h.vx * dt; h.y += h.vy * dt;
          if (Math.hypot(own.x - h.x, own.y - h.y) < own.r) {
            h.life = 0;
            const heal = Math.round(h.stored * T.batHeal);
            if (heal > 0) {
              own.hp = Math.min(own.maxHp, own.hp + heal);
              emit(w, { kind: "heal", id: own.id, x: own.x, y: own.y, amt: heal });
            }
          }
        }
      } else if (h.kind === "cactus") {
        h.life -= dt;
        if (!own.alive) { h.life = 0; continue; }
        h.tick += dt;
        if (h.tick >= T.cactusShotEvery) {
          const o = nearestEnemy(w, { x: h.x, y: h.y, team: h.team }, T.cactusRange);
          if (o) {
            h.tick = 0;
            const a = Math.atan2(o.y - h.y, o.x - h.x);
            w.hazards.push({ kind: "shot", skin: "needle", color: TYPES.duri.color, x: h.x, y: h.y, vx: Math.cos(a) * T.needleSpeed, vy: Math.sin(a) * T.needleSpeed,
              r: 5, life: 1.2, dmg: T.needleDmg, team: h.team, owner: own, bounces: 0 });
            h.shotT = 0.15;
          }
        }
        if (h.shotT > 0) h.shotT -= dt;
      } else if (h.kind === "gas") {
        h.life -= dt;
        const gt = nearestEnemy(w, { x: h.x, y: h.y, team: h.team });
        if (gt) {
          const dx = gt.x - h.x, dy = gt.y - h.y, d = Math.hypot(dx, dy) || 1;
          h.vx += ((dx / d) * T.gasDrift - h.vx) * Math.min(1, dt * 1.5);
          h.vy += ((dy / d) * T.gasDrift - h.vy) * Math.min(1, dt * 1.5);
        }
        moveBounce(h, dt);
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.5) {
            o.drunk = Math.max(o.drunk, T.drunkTime);
            h.acc[o.id] = (h.acc[o.id] || T.gasStack) + dt;
            if (h.acc[o.id] >= T.gasStack) { h.acc[o.id] = 0; applyPoison(w, own, o); }
          }
        }
      } else if (h.kind === "pillar") {
        h.life -= dt;
        for (const k in h.cd) h.cd[k] -= dt;
      } else if (h.kind === "shroom") {
        h.life -= dt;
        h.grow -= dt;
        if (h.grow > 0) continue;
        for (const o of w.balls) {
          if (!targetable(o) || o.air > 0 || h.life <= 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) > h.r + o.r) continue;
          if (o.team === h.team) {
            if (o.type !== "jamur") continue;
            h.life = 0;
            o.hp = Math.min(o.maxHp, o.hp + T.shroomHeal);
            emit(w, { kind: "heal", id: o.id, x: o.x, y: o.y, amt: T.shroomHeal });
            emit(w, { kind: "skill", type: "jamurMakan", id: o.id });
          } else {
            h.life = 0;
            strike(w, o, T.shroomDmg, own);
            if (o.alive) o.drunk = Math.max(o.drunk, T.shroomDizzy);
            emit(w, { kind: "spore", x: h.x, y: h.y });
          }
        }
      } else if (h.kind === "shard") {
        h.life -= dt;
        for (const o of w.balls) {
          if (h.life <= 0 || !targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.8) {
            h.life = 0;
            strike(w, o, T.shardDmg, own);
            emit(w, { kind: "impact", x: h.x, y: h.y, skin: "glass" });
          }
        }
      } else if (h.kind === "trap") {
        h.warn -= dt;
        if (h.warn <= 0) {
          h.life = 0;
          for (const o of w.balls) {
            if (!targetable(o) || o.team === h.team || o.air > 0 || o.caughtBy || o.possessedBy) continue;
            if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.4) {
              o.hidden = T.fallTime;
              o.falling = true;
              o.fallSrc = own;
              emit(w, { kind: "skill", type: "portalJatuh", id: own.id, target: o.id, x: h.x, y: h.y });
            }
          }
          emit(w, { kind: "trapClose", x: h.x, y: h.y });
        }
      } else if (h.kind === "tornado") {
        h.life -= dt;
        h.spin += dt * 12;
        if (!own.alive) { h.life = Math.min(h.life, 0.3); }
        const c = h.caught;
        if (c) {
          if (!c.alive) { h.caught = null; continue; }
          c.x = h.x + Math.cos(h.spin) * 20;
          c.y = h.y + Math.sin(h.spin) * 20;
          h.catchT -= dt;
          h.tick += dt;
          if (h.tick >= T.tornadoTick) { h.tick = 0; damage(w, c, T.tornadoDmg, own); }
          if (h.catchT <= 0 || h.life <= 0) {
            h.caught = null;
            c.caughtBy = null;
            c.x = clamp(c.x, c.r, ARENA - c.r); c.y = clamp(c.y, c.r, ARENA - c.r);
            // dilempar ke tembok terjauh dari tengah
            const a = Math.atan2(c.y - ARENA / 2, c.x - ARENA / 2) + (w.rand() - 0.5) * 0.6;
            setDir(c, a);
            boost(c, BASE_SPEED * T.flingMult, T.flingTime);
            c.flung = T.flingTime;
            c.flungSrc = own;
            h.life = Math.min(h.life, 0.4);
            emit(w, { kind: "skill", type: "anginLempar", id: own.id, target: c.id });
          }
        } else if (h.life > 0.4) {
          const t = nearestEnemy(w, { x: h.x, y: h.y, team: h.team });
          if (t) {
            const dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy) || 1;
            h.x += (dx / d) * T.tornadoSpeed * dt;
            h.y += (dy / d) * T.tornadoSpeed * dt;
            if (d < h.r + t.r * 0.5 && !t.caughtBy && !t.possessedBy && t.air <= 0) {
              h.caught = t;
              t.caughtBy = h;
              h.catchT = T.caughtTime;
              h.tick = 0;
              emit(w, { kind: "skill", type: "anginTangkap", id: own.id, target: t.id });
            }
          }
        }
      } else if (h.kind === "constellation") {
        if (h.warn > 0) {
          h.warn -= dt;
          if (h.warn <= 0) {
            h.life = T.starLife;
            h.max = T.starLife;
            emit(w, { kind: "skill", type: "bintangRasi", id: own.id, pts: h.pts });
          }
          continue;
        }
        h.life -= dt;
        if (!h.cd) h.cd = {};
        for (const k in h.cd) h.cd[k] -= dt;
        const p = h.pts;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || (h.cd[o.id] || 0) > 0) continue;
          let md = Infinity;
          for (let i = 0; i < 3; i++) { const a = p[i], c = p[(i + 1) % 3]; md = Math.min(md, segDist(o.x, o.y, a.x, a.y, c.x, c.y)); }
          if (md < o.r + T.starWidth / 2) {
            h.cd[o.id] = T.starCd;
            strike(w, o, T.starDmg, own);
            emit(w, { kind: "impact", x: o.x, y: o.y, skin: "star" });
          }
        }
      }
    }
    w.hazards = w.hazards.filter((h) => h.life > 0 || (h.kind === "bomb" && h.fuse > 0 && h.fuse < 99));
  }

  // pilar batu: dinding bulat yang bikin bola memantul
  function obstacles(w) {
    for (const h of w.hazards) {
      if (h.kind !== "pillar" || h.life <= 0) continue;
      for (const o of w.balls) {
        if (!o.alive || o.hidden > 0 || o.air > 0 || o.caughtBy) continue;
        const dx = o.x - h.x, dy = o.y - h.y, d = Math.hypot(dx, dy) || 1;
        if (d >= h.r + o.r) continue;
        const nx = dx / d, ny = dy / d;
        o.x = h.x + nx * (h.r + o.r);
        o.y = h.y + ny * (h.r + o.r);
        const dot = o.vx * nx + o.vy * ny;
        if (dot < 0) { o.vx -= 2 * dot * nx; o.vy -= 2 * dot * ny; }
        if (o.team !== h.team && (h.cd[o.id] || 0) <= 0) {
          h.cd[o.id] = T.pillarCd;
          strike(w, o, T.pillarDmg, h.owner);
          h.hp--;
          emit(w, { kind: "pillarHit", x: h.x + nx * h.r, y: h.y + ny * h.r, id: o.id, nx, ny });
          if (h.hp <= 0) { h.life = 0; emit(w, { kind: "pillarBreak", x: h.x, y: h.y }); }
        }
      }
    }
  }

  function collide(w, dt) {
    const bs = w.balls.filter((b) => b.alive && b.hidden <= 0 && b.air <= 0 && !b.caughtBy);
    for (const k in w.pairCd) {
      w.pairCd[k] -= dt;
      if (w.pairCd[k] <= 0) delete w.pairCd[k];
    }
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d >= min) continue;
        if (d === 0) { dx = 1; dy = 0; d = 1; }
        // hantu yang tembus pandang melewati lawan begitu saja
        if (a.team !== b.team && (a.ghost > 0 || b.ghost > 0)) continue;
        const nx = dx / d, ny = dy / d;
        const ma = a.r * a.r * (a.type === "batu" ? T.rockMass : 1);
        const mb = b.r * b.r * (b.type === "batu" ? T.rockMass : 1);
        const overlap = min - d;
        a.x -= nx * overlap * (mb / (ma + mb));
        a.y -= ny * overlap * (mb / (ma + mb));
        b.x += nx * overlap * (ma / (ma + mb));
        b.y += ny * overlap * (ma / (ma + mb));
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) {
          const imp = (2 * rel) / (ma + mb);
          a.vx -= imp * mb * nx; a.vy -= imp * mb * ny;
          b.vx += imp * ma * nx; b.vy += imp * ma * ny;
          setSpeed(a, a.speed);
          setSpeed(b, b.speed);
        }
        // bom panas pindah ke bola yang ditabrak
        for (const h of w.hazards) {
          if (h.kind !== "bomb" || h.state !== "stuck" || h.passCd > 0) continue;
          if (h.carrier === a || h.carrier === b) {
            h.carrier = h.carrier === a ? b : a;
            h.passCd = T.bombPass;
            emit(w, { kind: "skill", type: "bomPindah", id: h.owner.id, target: h.carrier.id });
          }
        }
        if (a.team === b.team) continue;
        const key = a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
        if (w.pairCd[key]) continue;
        w.pairCd[key] = 0.25;
        // tabrakan cuma mantul, tidak ada damage
        emit(w, { kind: "hit", x: a.x + nx * a.r, y: a.y + ny * a.r, a: a.id, b: b.id, nx, ny });
      }
    }
  }

  function tickStatus(w, b, dt) {
    b.flash = Math.max(0, b.flash - dt);
    if (b.frozen > 0) b.frozen -= dt;
    if (b.sleep > 0) b.sleep -= dt;
    if (b.stun > 0) b.stun -= dt;
    if (b.silence > 0) b.silence -= dt;
    if (b.drunk > 0) b.drunk -= dt;
    if (b.flung > 0) b.flung -= dt;
    if (b.drowsyT > 0) { b.drowsyT -= dt; if (b.drowsyT <= 0) b.drowsy = 0; }
    if (b.boostT > 0) {
      b.boostT -= dt;
      if (b.boostT <= 0) setSpeed(b, b.preSpeed || BASE_SPEED);
    }
    if (b.trapped > 0) {
      b.trapped -= dt;
      if (b.trapped <= 0) {
        const src = b.trapSrc;
        b.trapSrc = null;
        emit(w, { kind: "pop", id: b.id, x: b.x, y: b.y });
        strike(w, b, T.prisonDmg, src && src.alive ? src : null);
      }
    }
  }

  function substep(w, dt) {
    w.t += dt;
    for (const b of w.balls) {
      if (!b.alive) continue;
      tickStatus(w, b, dt);
      if (!b.alive) continue;

      // hantu yang sedang merasuki ikut posisi korbannya
      if (b.possess) {
        b.possessT -= dt;
        const o = b.possess;
        b.x = o.x; b.y = o.y;
        if (b.possessT <= 0 || !o.alive) releasePossess(w, b);
        poisonTick(w, b, dt);
        continue;
      }
      // jatuh ke portal: hilang, lalu muncul dari langit di tempat acak
      if (b.hidden > 0) {
        b.hidden -= dt;
        if (b.hidden <= 0 && b.falling) {
          b.falling = false;
          const M = b.r + 20;
          b.x = M + w.rand() * (ARENA - 2 * M);
          b.y = M + w.rand() * (ARENA - 2 * M);
          b.stun = T.fallStun;
          strike(w, b, T.fallDmg, b.fallSrc && b.fallSrc.alive ? b.fallSrc : null);
          emit(w, { kind: "slam", x: b.x, y: b.y, id: b.id, big: true });
        }
        continue;
      }
      if (b.caughtBy) { poisonTick(w, b, dt); continue; } // diputar tornado
      // raksasa melompat: melayang lalu menginjak
      if (b.air > 0) {
        b.air -= dt;
        const k = Math.min(1, 1 - b.air / T.leapTime), e = k * k * (3 - 2 * k);
        b.x = b.airFrom.x + (b.airTo.x - b.airFrom.x) * e;
        b.y = b.airFrom.y + (b.airTo.y - b.airFrom.y) * e;
        if (b.air <= 0) {
          b.air = 0;
          const R = b.r * T.stompMult;
          blast(w, b.team, b, b.x, b.y, R, Math.round(b.r / T.stompDiv), (o) => {
            if (o.frozen <= 0 && !o.caughtBy) setDir(o, Math.atan2(o.y - b.y, o.x - b.x));
          });
          emit(w, { kind: "skill", type: "raksasaInjak", id: b.id, r: R });
        }
        continue;
      }

      if (canMove(b)) {
        if (b.drunk > 0) {
          const a = Math.atan2(b.vy, b.vx) + Math.sin(w.t * 9 + b.id) * 5 * dt;
          setDir(b, a);
        }
        const k = b.trapped > 0 ? T.prisonFloat / Math.max(1, b.speed) : 1; // terkurung gelembung: melayang pelan
        b.x += b.vx * dt * k;
        b.y += b.vy * dt * k;
      }
      let hit = false, wnx = 0, wny = 0;
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); hit = true; wnx = 1; }
      if (b.x + b.r > ARENA) { b.x = ARENA - b.r; b.vx = -Math.abs(b.vx); hit = true; wnx = -1; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); hit = true; wny = 1; }
      if (b.y + b.r > ARENA) { b.y = ARENA - b.r; b.vy = -Math.abs(b.vy); hit = true; wny = -1; }
      if (hit) {
        emit(w, { kind: "wall", id: b.id, nx: wnx, ny: wny }); // untuk efek gepeng di tampilan
        onWall(w, b);
      }
      if (b.alive && canAct(b)) skills(w, b, dt);
      poisonTick(w, b, dt);
    }
    hazards(w, dt);
    obstacles(w);
    collide(w, dt);

    if (w.t >= OVERTIME_AT) {
      w.overtime += dt;
      if (w.overtime >= 1) {
        w.overtime -= 1;
        const sd = 1 + Math.floor((w.t - OVERTIME_AT) / 5);
        for (const b of w.balls) if (b.alive) damage(w, b, sd, null);
      }
    }

    for (const f of w.fx) f.life -= dt;
    w.fx = w.fx.filter((f) => f.life > 0);

    const teams = new Set(w.balls.filter((b) => b.alive).map((b) => b.team));
    if (teams.size <= 1) {
      w.done = true;
      if (teams.size === 1) {
        w.winner = [...teams][0];
      } else {
        // semua mati di saat yang sama: yang sisa darahnya paling "tidak minus" menang
        const last = w.balls.filter((b) => b.diedAt === w.t).sort((a, b) => b.deathHp - a.deathHp);
        const top = last.filter((b) => b.deathHp === last[0].deathHp);
        w.winner = top.length ? top[Math.floor(w.rand() * top.length)].team : null; // seri persis: undian
      }
    }
  }

  function step(w, dt) {
    if (w.done) return;
    const SUB = 1 / 120;
    let left = Math.min(dt, 0.1);
    while (left > 1e-6 && !w.done) {
      const s = Math.min(SUB, left);
      substep(w, s);
      left -= s;
    }
  }

  const api = {
    ARENA, OVERTIME_AT, T, TYPES, RARITY, rng, createWorld, step,
    bladeTip, bladeThrowPos, dronePositions, maxHpFor, laserPath, kembarPartner,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Watchsball = api;
})(this);
