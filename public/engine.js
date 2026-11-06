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
    // penari: tali ketapel antar titik pantul
    karetBoost: 1.06, karetMax: 500, bandLife: 2.4, bandMin: 70, bandDmg: 4, bandPerSpeed: 100, bandFling: 1.7, bandFlingTime: 0.6,
    // sihires: bola salju yang membesar tiap mantul
    snowEvery: 2.4, snowSpeed: 300, snowR: 9, snowGrow: 5, snowMaxR: 30, snowBounces: 4, snowDmgBase: 9, snowDmgPerR: 0.5, snowFreeze: 0.6,
    // berserker: jejak api + erupsi
    fireBurn: 4, fireEvery: 0.4, fireLife: 2.4, eruptEvery: 4.5, eruptDmg: 6, eruptR: 26,
    // samurai: pedang berputar + lempar bumerang
    bladeLen: 60, bladeSpin: 4.5, bladeStart: 7, bladeGrow: 1, bladeMax: 15, bladeCd: 0.35, throwEvery: 5, throwTime: 1.1, throwRange: 190, throwHitR: 26,
    // ahlipetir: awan badai yang menguntit lawan
    cloudEvery: 5.3, cloudLife: 3.6, cloudStrikeEvery: 0.55, cloudSpread: 50, cloudHitR: 30, cloudDmg: 7, cloudSpeed: 150,
    // pemburu: kelelawar penghisap darah
    batEvery: 3.0, batMax: 3, batSpeed: 300, batLatch: 1.25, batTick: 0.3, batDmg: 2, batHeal: 0.5,
    // viking: lompat lalu injak
    giantGrow: 1.0, giantMax: 56, leapEvery: 3.5, leapTime: 0.75, stompMult: 2.2, stompDiv: 3,
    // bajaklaut: bom panas yang pindah-pindah
    bombEvery: 4.0, bombSpeed: 360, bombFuse: 2.6, bombDmg: 30, bombSplash: 13, bombR: 75, bombSelf: 0.3, bombPass: 0.3, bombGround: 1.0,
    // mekanik: kaktus penembak
    cactusEvery: 3.0, cactusMax: 3, cactusLife: 9, cactusShotEvery: 1.1, cactusRange: 220, needleSpeed: 380, needleDmg: 4,
    // ninja: benang kembar
    threadCd: 0.45, threadDmg: 6, threadWidth: 12, splitKeep: 0.75, splitR: 26,
    // bard: kabut kentut yang bikin mabuk
    gasEvery: 3.0, gasR: 64, gasLife: 4.5, gasDrift: 70, gasStack: 0.35, drunkTime: 1.2,
    // golem: pilar batu
    rockMass: 2.5, rockArmor: 0.8, pillarEvery: 3.5, pillarR: 20, pillarLife: 6, pillarDmg: 7, pillarHp: 2, pillarRiseDmg: 5, pillarCd: 0.4,
    // druid: kebun jamur
    shroomEvery: 2.2, shroomMax: 5, shroomR: 13, shroomLife: 12, shroomGrow: 0.5, shroomDmg: 11, shroomHeal: 6, shroomDizzy: 1.0,
    // sumo: kutub utara/selatan, mencuri peluru
    magnetRange: 230, magnetPull: 260, poleTime: 2.5, repelR: 160, repelMax: 29, repelMin: 6, repelPush: 260, stealR: 150,
    // koboi: peluru memantul + tendangan mundur
    shotEvery: 2.2, shotSpeed: 430, shotDmg: 10, shotBounces: 2, shotBounceDmg: 3,
    // necro: sarang yang terus bertambah
    droneOrbit: 30, droneSpin: 3.6, droneDmg: 5, droneCd: 0.3, hiveEvery: 4, hiveStart: 2, hiveMax: 5, beeLaunchEvery: 3, beeSpeed: 330, beeDmg: 9,
    // dukun: merasuki lawan
    ghostEvery: 4.5, ghostTime: 1.2, possessRange: 230, possessTime: 1.8, possessSpeed: 1.6, possessDmg: 10,
    // sniper: sinar memantul
    laserEvery: 3.2, laserDmg: 13, laserWidth: 12, laserCharge: 0.6, laserLock: 0.15, laserBounces: 2,
    // pencuri: lubang jebakan, jatuh dari langit
    trapEvery: 4.0, trapWarn: 0.55, trapR: 40, fallTime: 0.9, fallDmg: 18, fallStun: 0.5,
    // peramal: kartu takdir acak
    cardEvery: 2.0, cardSpeed: 340, cardDmg: 15, cardWeak: 6, cardGold: 24, cardGoldChance: 0.15, cardHeal: 9, cardFreeze: 0.8, cardSilence: 1.3,
    // pemanah: spiral serbuk tidur
    flowerEvery: 3.2, spiralTime: 1.2, spiralPetals: 14, petalSpeed: 260, petalDmg: 9, drowsyMax: 3, drowsyReset: 3, pinTime: 0.9,
    // biksu: tornado penculik
    tornadoEvery: 4.8, tornadoLife: 3.2, tornadoSpeed: 130, tornadoR: 42, caughtTime: 0.9, tornadoTick: 0.15, tornadoDmg: 1,
    flingMult: 2.2, flingTime: 0.9, flingWallDmg: 10,
    // gladiator: perisai + penjara gelembung
    bubbleHp: 15, bubbleRegen: 5, prisonEvery: 4.0, prisonSpeed: 210, prisonTime: 0.8, prisonDmg: 8, netDmg: 4, prisonFloat: 45,
    // ksatria: memantulkan peluru, pecahan kaca
    mirrorShotChance: 0.4, bashEvery: 2.6, bashR: 95, bashDmg: 18,
    // silat: rasi bintang
    dashEvery: 2.0, dashTime: 0.5, dashMult: 2.3, starWarn: 0.4, starLife: 2.5, starDmg: 11, starCd: 0.5, starWidth: 14,
    // naga
    breathEvery: 3.0, breathTime: 0.8, breathRange: 185, breathAngle: 0.45, breathDmg: 4, breathTick: 0.15,
    // bayangan: mencuri bayangan (skill lawan terkunci)
    shadowEvery: 3.0, shadowSpeed: 330, shadowDmg: 7, shadowTurn: 4.0, silenceTime: 1.1,
    // grenadier: roket yang pecah jadi percikan
    rocketEvery: 2.8, rocketSpeed: 320, rocketR: 55, rocketDmg: 12, sparkCount: 5, sparkSpeed: 230, sparkDmg: 3,
    // valkyrie: + kawah lava
    meteorEvery: 4.0, meteorDelay: 0.85, meteorR: 80, meteorDmg: 32, craterR: 40, craterLife: 3, craterDmg: 3, craterTick: 0.4,
    // pendeta: panas menumpuk + suar
    sunAuraR: 100, sunAuraTick: 0.5, sunHeatMax: 4, sunNovaEvery: 6, sunNovaR: 150, sunNovaDmg: 27, sunNovaHeal: 5,
    // berserker: makin sekarat makin sakit
    rageMax: 0.5,
    // ===== 20 hero baru =====
    // paladin: palu suci
    hammerEvery: 2.8, hammerR: 105, hammerDmg: 22, hammerTurn: 1.3, hammerStun: 0.45,
    // barong: raungan yang bikin takut
    roarEvery: 3.7, roarR: 170, roarDmg: 12, fearTime: 1.1, fearSpeed: 1.5,
    // juggernaut: seruduk
    chargeEvery: 4.0, chargeTime: 0.7, chargeMult: 2.6, chargeDmg: 7, chargePush: 1.8,
    // petinju: jab beruntun + uppercut
    punchR: 26, punchEvery: 0.45, punchDmg: 3, uppercutEvery: 4, uppercutDmg: 8, uppercutStun: 0.5, punchTurn: 1.6,
    // jawara: makin dipukul makin panas
    jawaraStack: 6, jawaraTick: 1.0, jawaraR: 150, jawaraDmg: 30,
    // ronin: tebasan tembus + berdarah
    roninEvery: 3.6, roninDash: 0.35, roninMult: 3.2, roninDmg: 8, bleedDmg: 1, bleedEvery: 0.4, bleedTime: 3,
    // pembunuh: menghilang lalu menikam
    stealthEvery: 4.6, stealthTime: 1.6, backstabDmg: 20, stealthTurn: 4,
    // kunoichi: kunai beracun
    kunaiEvery: 3.0, kunaiCount: 3, kunaiSpread: 0.28, kunaiSpeed: 420, kunaiDmg: 2,
    // penjebak: ranjau
    mineEvery: 2.0, mineMax: 4, mineArm: 0.6, mineLife: 10, mineR: 12, mineBlast: 45, mineDmg: 10, mineSlow: 1.2,
    // penyihir waktu: zona lambat + putar balik
    slowFieldEvery: 4.0, slowFieldR: 95, slowFieldLife: 3, slowK: 0.45, slowFieldDmg: 3, slowFieldTick: 0.5, rewindEvery: 7, rewindBack: 3, rewindMax: 22,
    // penyihir kosmos: lubang hitam
    holeEvery: 3.5, holeLife: 2.5, holeR: 130, holePull: 380, holeCore: 70, holeDmg: 11, holeTick: 0.3, holeEatDmg: 1,
    // alkemis: ramuan + genangan asam
    potionEvery: 2.8, potionSpeed: 300, potionR: 40, potionDmg: 13, acidR: 45, acidLife: 3.5, acidDmg: 4, acidTick: 0.4,
    // pawang hujan
    rainEvery: 4.2, rainR: 75, rainLife: 3, rainSpeed: 90, rainDmg: 2, rainTick: 0.3, rainSlow: 0.6,
    // nelayan: kail penarik
    hookEvery: 2.4, hookSpeed: 460, hookDmg: 13, hookPull: 520, hookTime: 0.45,
    // gunner: senapan tabur
    pelletEvery: 2.2, pelletCount: 5, pelletSpread: 0.5, pelletSpeed: 480, pelletDmg: 3, pelletLife: 0.55,
    // pemburu sumpit
    dartEvery: 1.35, dartSpeed: 520, dartDmg: 6, dartSleepN: 2, dartReset: 4, dartSleep: 1.1,
    // tabib: jamu
    jamuEvery: 4.0, jamuHeal: 9, jamuBoost: 1.4, bitterEvery: 2.6, bitterDmg: 9, bitterDrunk: 1.0,
    // dalang: wayang minion
    puppetEvery: 5.5, puppetMax: 2, puppetHp: 17, puppetR: 20, puppetDmg: 4, puppetCd: 0.5, puppetLife: 10,
    // pemanggil totem
    totemEvery: 5, totemMax: 2, totemLife: 8, totemR: 110, totemTick: 0.7, totemDmg: 4, totemHeal: 2, totemSlow: 0.7,
    // penabuh gong
    gongEvery: 3.4, gongWaves: 3, gongGap: 0.35, gongSpeed: 260, gongMaxR: 200, gongDmg: 7, gongWidth: 18,
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

  // Tidak ada rarity: semua hero setara. Role cuma pengelompokan (ala ML) untuk koleksi, banner, misi, dan Tower.
  const ROLES = {
    tank: { name: "Tank", color: "#4a7bd1" },
    fighter: { name: "Fighter", color: "#e0563a" },
    assassin: { name: "Assassin", color: "#8a4fd8" },
    mage: { name: "Mage", color: "#2fa6d6" },
    marksman: { name: "Marksman", color: "#e09a1a" },
    support: { name: "Support", color: "#2fae6a" },
  };

  const TYPES = {
    ksatria: { name: "Ksatria", role: "tank", color: "#4a7bd1", skill: "Perisai 15 yang pulih sendiri, 40% peluru lawan ditangkis balik. Lawan yang terlalu dekat kena hantaman perisai." },
    golem: { name: "Golem", role: "tank", color: "#a08c78", skill: "Memunculkan pilar batu di depan lawan. Lawan yang nabrak pilar kesakitan. Badan batu: damage masuk -20%." },
    viking: { name: "Viking", role: "tank", color: "#d9822b", skill: "Makin besar tiap mantul tembok. Tiap 3,5 detik melompat lalu menghantam lawan dari atas." },
    gladiator: { name: "Gladiator", role: "tank", color: "#c23b2e", skill: "Melempar jaring yang mengejar lawan. Lawan yang terjerat melayang tak berdaya, lalu kesakitan." },
    sumo: { name: "Sumo", role: "tank", color: "#f08aa8", skill: "Ganti jurus tiap 2,5 detik: menarik lawan sambil merebut pelurunya, lalu dorongan perut yang bikin terpental." },
    samurai: { name: "Samurai", role: "fighter", color: "#e04050", skill: "Katana berputar yang makin tajam tiap kena. Tiap 5 detik katananya dilempar seperti bumerang." },
    silat: { name: "Pendekar Silat", role: "fighter", color: "#2fae7a", skill: "Melangkah kilat. Tiap tiga langkah membentuk jurus segitiga yang menyetrum lawan yang lewat." },
    berserker: { name: "Berserker", role: "fighter", color: "#b3261e", skill: "Meninggalkan jejak amarah yang meletus tiap 4,5 detik. Makin sekarat makin brutal: damage naik sampai +80%." },
    biksu: { name: "Biksu Kungfu", role: "fighter", color: "#f0a020", skill: "Tendangan puyuh yang mengejar lawan, memutarnya, lalu melemparnya ke tembok." },
    valkyrie: { name: "Valkyrie", role: "fighter", color: "#e8c84a", skill: "Menandai lawan, lalu tombak cahaya jatuh dari langit dan meninggalkan tanah terbakar." },
    ninja: { name: "Ninja", role: "assassin", color: "#6b4fd8", skill: "Kloning bayangan di seberang arena, terhubung kawat baja tajam. Saat darah setengah, kloningnya jadi nyata." },
    bayangan: { name: "Bayangan", role: "assassin", color: "#3a3550", skill: "Bayangan pengejar yang mencuri bayangan lawan: skill lawan terkunci sebentar." },
    pencuri: { name: "Pencuri", role: "assassin", color: "#8a6a44", skill: "Menjebak lawan pakai karung. Korbannya diculik, lalu dijatuhkan dari langit di tempat acak." },
    pemburu: { name: "Pemburu Iblis", role: "assassin", color: "#8c96b0", skill: "Melepas elang perak yang mencakar lawan, lalu pulang membawa darah untuk tuannya." },
    penari: { name: "Penari Selendang", role: "assassin", color: "#ff5fa2", skill: "Makin cepat tiap mantul tembok sambil membentangkan selendang. Lawan yang nyangkut dilempar jauh." },
    sihirapi: { name: "Penyihir Api", role: "mage", color: "#ff7a2f", skill: "Menyemburkan api ke arah lawan, membakar semua yang ada di depannya." },
    sihires: { name: "Penyihir Es", role: "mage", color: "#6fe3ff", skill: "Menggelindingkan bola salju yang makin besar tiap mantul tembok. Kena lawan: sakit dan membeku." },
    dukun: { name: "Dukun", role: "mage", color: "#9b59b6", skill: "Santet: merasuki lawan, bikin lawan lari ngebut dan kesakitan tiap kepentok tembok." },
    necro: { name: "Necromancer", role: "mage", color: "#5fd38a", skill: "Tengkorak penjaga terus bertambah sampai 5. Tengkorak bergiliran terbang menggigit lawan." },
    ahlipetir: { name: "Ahli Petir", role: "mage", color: "#ffd23c", skill: "Memanggil awan badai yang menguntit lawan dan menyambar asal-asalan di sekitarnya." },
    pemanah: { name: "Pemanah", role: "marksman", color: "#7fc24a", skill: "Menembakkan spiral panah. Kena 3 panah, lawan terpaku tak bisa bergerak." },
    koboi: { name: "Koboi", role: "marksman", color: "#c8874a", skill: "Peluru revolver memantul di tembok dan makin sakit tiap pantulan. Tiap nembak, Koboi terdorong mundur." },
    sniper: { name: "Penembak Jitu", role: "marksman", color: "#ff2e88", skill: "Membidik, lalu menembak sinar yang memantul 2 kali di tembok. Bisa dihindari kalau gesit." },
    bajaklaut: { name: "Bajak Laut", role: "marksman", color: "#3d6fb0", skill: "Menempelkan tong mesiu ke lawan. Tongnya pindah ke siapa pun yang ditabrak, termasuk Bajak Laut sendiri!" },
    grenadier: { name: "Grenadier", role: "marksman", color: "#6b8e3a", skill: "Melempar granat yang meledak, lalu pecah jadi serpihan berapi." },
    pendeta: { name: "Pendeta", role: "support", color: "#ffc94a", skill: "Aura suci yang makin menyengat kalau lawan lama di dekatnya. Tiap 6 detik meledakkan cahaya dan memulihkan darah." },
    bard: { name: "Bard", role: "support", color: "#e05ad0", skill: "Lagu sumbang yang mengejar lawan. Lawan di dalamnya joget pusing dan kena damage menumpuk sampai 3 lapis." },
    druid: { name: "Druid", role: "support", color: "#8be04a", skill: "Menanam jamur ajaib. Lawan yang nginjak kena spora dan pusing, Druid yang makan jadi sehat." },
    mekanik: { name: "Mekanik", role: "support", color: "#9aa0b4", skill: "Memasang menara tembak otomatis, sampai 3 sekaligus." },
    paladin: { name: "Paladin", role: "tank", color: "#e8c040", skill: "Palu Suci: menghantam tanah di sekitarnya. Lawan yang dekat kesakitan dan pingsan sebentar." },
    barong: { name: "Barong", role: "tank", color: "#e0402a", skill: "Raungan Barong yang melukai dan bikin lawan ketakutan lari menjauh." },
    juggernaut: { name: "Juggernaut", role: "tank", color: "#6a7a8a", skill: "Menyeruduk lurus ke lawan. Lawan yang ketabrak terpental, dan sakit lagi kalau kepentok tembok." },
    petinju: { name: "Petinju", role: "fighter", color: "#e85a3a", skill: "Mengejar lawan dan meninju bertubi-tubi dari dekat. Tiap pukulan keempat jadi uppercut yang bikin pusing." },
    jawara: { name: "Jawara", role: "fighter", color: "#a0522d", skill: "Makin lama bertarung dan makin sering dipukul, makin panas. Sudah penuh: golok berputar menghajar sekeliling." },
    ronin: { name: "Ronin", role: "fighter", color: "#5a6aa0", skill: "Melesat menembus lawan sambil menebas. Lawan yang kena tebasan berdarah beberapa detik." },
    pembunuh: { name: "Pembunuh", role: "assassin", color: "#5a4a6a", skill: "Menghilang dan kebal, mengendap ke lawan, lalu menikam. Tikamannya selalu kritis." },
    kunoichi: { name: "Kunoichi", role: "assassin", color: "#d04a7a", skill: "Melempar tiga kunai beracun menyebar. Racunnya menumpuk sampai 3 lapis." },
    penjebak: { name: "Penjebak", role: "assassin", color: "#8a7a3a", skill: "Menanam ranjau di jalurnya, sampai 4. Lawan yang nginjak kena ledakan dan jalannya melambat." },
    waktu: { name: "Penyihir Waktu", role: "mage", color: "#3ab8c8", skill: "Zona waktu lambat di sekitar lawan. Tiap 7 detik memutar balik waktu: darahnya pulih seperti 3 detik lalu." },
    kosmos: { name: "Penyihir Kosmos", role: "mage", color: "#6c3bff", skill: "Pusaran lubang hitam yang menyedot lawan dan menelan peluru. Tiap peluru yang ditelan bikin pusarannya makin sakit." },
    alkemis: { name: "Alkemis", role: "mage", color: "#a0d030", skill: "Melempar ramuan yang pecah di dekat lawan dan meninggalkan genangan asam." },
    pawang: { name: "Pawang Hujan", role: "mage", color: "#4a8ad0", skill: "Hujan deras yang menguntit lawan: lawan basah, jalannya lambat, dan kesakitan pelan-pelan." },
    nelayan: { name: "Nelayan", role: "marksman", color: "#2a9ad0", skill: "Melempar kail. Lawan yang kena tersangkut dan ditarik mendekat." },
    gunner: { name: "Gunner", role: "marksman", color: "#8a6a3a", skill: "Senapan tabur: 5 peluru menyebar, sakit dari dekat. Tiap nembak terdorong mundur." },
    sumpit: { name: "Pemburu Sumpit", role: "marksman", color: "#5a9a3a", skill: "Meniup sumpit dengan cepat. Kena 2 sumpit, lawan tertidur." },
    tabib: { name: "Tabib", role: "support", color: "#d0a060", skill: "Minum jamu tiap 4 detik: darah pulih dan larinya ngebut. Melempar jamu pahit yang bikin lawan mual dan pusing." },
    dalang: { name: "Dalang", role: "support", color: "#c08a4a", skill: "Memanggil wayang, sampai 2, yang ikut bertarung menabrak lawan. Lawan bisa salah sasaran ke wayang." },
    totem: { name: "Pemanggil Totem", role: "support", color: "#c0603a", skill: "Menancapkan totem, sampai 2. Lawan di dekat totem melambat dan kesakitan, pemiliknya pulih pelan-pelan." },
    gong: { name: "Penabuh Gong", role: "support", color: "#d4a020", skill: "Memukul gong: tiga gelombang suara menyebar, melukai, dan mendorong lawan." },
    peramal: { name: "Peramal", role: "support", color: "#b98cff", skill: "Melempar kartu takdir acak: merah sakit, biru membekukan, ungu mengunci skill, emas super sakit, hijau memulihkan darah." },
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
      shield: type === "ksatria" ? T.bubbleHp : 0, shieldT: 0,
      lastWall: null, pole: 1, thread: 0, threadTick: 0, marks: [], spiral: 0, spiralN: 0, spiralA: 0, spiralT: 0,
      airFrom: null, airTo: null,
      // status & skill hero baru
      slow: 0, slowK: 1, bleed: 0, bleedTick: 0, bleedSrc: null, fear: 0, fearSrc: null, hookT: 0, hookSrc: null, dartN: 0, dartT: 0,
      charge: 0, rdash: 0, punchT: 0, upN: 0, stack: 0, stealth: 0, hist: [], histT: 0, minion: false, owner: null, life: 0,
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

  function damage(w, target, amt, src, crit) {
    if (!target.alive || amt <= 0) return 0;
    if (src && (target.ghost > 0 || target.hidden > 0)) return 0; // tembus pandang / sedang menghilang = kebal (kecuali overtime)
    // berserker: damage naik makin darahnya tipis
    if (src && src.type === "berserker" && src.maxHp) amt = Math.round(amt * (1 + T.rageMax * Math.max(0, 1 - src.hp / src.maxHp)));
    // ksatria: perisai menyerap damage dulu
    if (target.shield > 0 && src) {
      const take = Math.min(target.shield, amt);
      target.shield -= take;
      amt -= take;
      emit(w, { kind: "shieldHit", id: target.id, x: target.x, y: target.y });
      if (target.shield <= 0) { target.shieldT = T.bubbleRegen; emit(w, { kind: "pop", id: target.id, x: target.x, y: target.y }); }
      if (amt <= 0) return 0;
    }
    if (target.type === "golem") amt = Math.max(1, Math.round(amt * T.rockArmor));
    target.hp -= amt;
    if (target.type === "jawara" && src && src !== target && !target.minion) target.stack++;
    target.flash = 0.12;
    emit(w, { kind: "dmg", id: target.id, x: target.x, y: target.y - target.r, amt, crit: !!crit, color: src ? TYPES[src.type].color : "#fff" });
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
      if (!b.minion) emit(w, { kind: "ko", type: b.type });
      return;
    }
    if (b.type === "ninja" && !b.split && b.hp <= b.maxHp / 2) {
      b.split = true;
      b.r = T.splitR;
      const keep = Math.ceil(b.hp * T.splitKeep);
      b.hp = keep;
      const twin = makeBall(w, "ninja", b.team, ARENA - b.x, ARENA - b.y, Math.atan2(-b.vy, -b.vx), b.stars);
      twin.split = true;
      twin.r = T.splitR;
      twin.hp = keep;
      twin.maxHp = b.maxHp;
      w.balls.push(twin); // kembaran cermin jadi nyata
      w.fx.push({ kind: "ring", x: b.x, y: b.y, r: 30, color: TYPES.ninja.color, life: 0.4, max: 0.4 });
      w.fx.push({ kind: "ring", x: twin.x, y: twin.y, r: 30, color: TYPES.ninja.color, life: 0.4, max: 0.4 });
      emit(w, { kind: "skill", type: "ninja", id: b.id });
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

  function steer(b, tx, ty, turn, dt) {
    const cur = Math.atan2(b.vy, b.vx);
    let d = Math.atan2(ty - b.y, tx - b.x) - cur;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    setDir(b, cur + Math.max(-turn * dt, Math.min(turn * dt, d)));
  }
  function slowDown(o, time, k) {
    if (!o.alive) return;
    if (o.slow <= 0 || k < o.slowK) o.slowK = k;
    o.slow = Math.max(o.slow, time);
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
    if (!o.alive || o.type === "bard") return;
    const before = o.poison;
    o.poison = Math.min(T.poisonMax, o.poison + 1);
    if (o.poison === T.poisonMax && before < T.poisonMax) emit(w, { kind: "skill", type: "bardMax", id: src.id });
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

  // samurai: posisi bilah (berputar di badan atau sedang dilempar)
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

  // ninja: pasangan benang (kembaran cermin sebelum membelah, kembaran asli sesudahnya)
  function kembarPartner(w, b) {
    if (!b.split) return { x: ARENA - b.x, y: ARENA - b.y, echo: true };
    const o = w.balls.find((k) => k !== b && k.alive && k.type === "ninja" && k.team === b.team && k.split);
    return o ? { x: o.x, y: o.y, echo: false, id: o.id } : null;
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
        emit(w, { kind: "skill", type: "dukunKeluar", id: h.id });
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
    if (b.type === "penari") {
      const was = b.speed;
      if (b.boostT <= 0) setSpeed(b, Math.min(b.speed * T.karetBoost, T.karetMax));
      if (b.speed >= T.karetMax && was < T.karetMax) emit(w, { kind: "skill", type: "penari", id: b.id });
      const p = { x: b.x, y: b.y };
      if (b.lastWall && dist(p, b.lastWall) > T.bandMin) {
        // maksimal 2 tali sekaligus
        const mine = w.hazards.filter((h) => h.kind === "band" && h.owner === b && h.life > 0);
        if (mine.length >= 2) mine[0].life = 0;
        w.hazards.push({ kind: "band", x1: b.lastWall.x, y1: b.lastWall.y, x2: p.x, y2: p.y, life: T.bandLife, max: T.bandLife, team: b.team, owner: b, x: p.x, y: p.y });
        emit(w, { kind: "skill", type: "penariTali", id: b.id });
      }
      b.lastWall = p;
    }
    if (b.type === "viking" && b.air <= 0) {
      const was = b.r;
      b.r = Math.min(b.r + T.giantGrow, T.giantMax);
      if (b.r >= T.giantMax && was < T.giantMax) emit(w, { kind: "skill", type: "viking", id: b.id });
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

    if (b.type === "sihires" && b.timer >= T.snowEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { kind: "snow", speed: T.snowSpeed, r: T.snowR, life: 6, bounces: 0 });
      emit(w, { kind: "skill", type: "sihires", id: b.id });
    }

    if (b.type === "berserker") {
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
        emit(w, { kind: "skill", type: "berserker", id: b.id });
      }
    }

    if (b.type === "samurai") {
      if (b.blade.thrown > 0) {
        b.blade.thrown -= dt;
        b.blade.angle += T.bladeSpin * 3 * dt;
        const p = bladeThrowPos(b);
        for (const o of enemiesOf(w, b)) {
          if ((b.hitCd[o.id] || 0) > 0) continue;
          if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + T.throwHitR) {
            strike(w, o, b.blade.dmg, b);
            b.blade.dmg = Math.min(T.bladeMax, b.blade.dmg + T.bladeGrow);
            b.hitCd[o.id] = T.bladeCd;
            emit(w, { kind: "skill", type: "samurai", id: b.id, x: p.x, y: p.y });
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
            b.blade.dmg = Math.min(T.bladeMax, b.blade.dmg + T.bladeGrow);
            if (b.blade.dmg % 5 === 0) emit(w, { kind: "skill", type: "samuraiUp", id: b.id });
            b.hitCd[o.id] = T.bladeCd;
            emit(w, { kind: "skill", type: "samurai", id: b.id, x: s.bx, y: s.by });
          }
        }
        if (b.timer >= T.throwEvery && tgt) {
          b.blade.thrown = T.throwTime;
          b.blade.dir = aimAngle(w, b, tgt);
          emit(w, { kind: "skill", type: "samuraiLempar", id: b.id });
        }
      }
    }

    if (b.type === "ahlipetir" && b.timer >= T.cloudEvery && tgt) {
      b.timer = 0;
      w.hazards.push({ kind: "cloud", x: tgt.x, y: tgt.y, target: tgt, life: T.cloudLife, max: T.cloudLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "ahlipetir", id: b.id });
    }

    if (b.type === "pemburu" && b.timer >= T.batEvery && tgt && countOwned(w, b, "bat") < T.batMax) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "bat", state: "go", x: b.x, y: b.y, vx: Math.cos(a) * T.batSpeed, vy: Math.sin(a) * T.batSpeed, target: tgt,
        life: 8, stored: 0, tick: 0, latch: 0, off: w.rand() * Math.PI * 2, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "pemburu", id: b.id });
    }

    if (b.type === "viking" && b.timer >= T.leapEvery && tgt) {
      b.timer = 0;
      b.air = T.leapTime;
      b.airFrom = { x: b.x, y: b.y };
      b.airTo = {
        x: clamp(tgt.x + tgt.vx * T.leapTime * 0.6, b.r, ARENA - b.r),
        y: clamp(tgt.y + tgt.vy * T.leapTime * 0.6, b.r, ARENA - b.r),
      };
      emit(w, { kind: "skill", type: "vikingLompat", id: b.id });
    }

    if (b.type === "bajaklaut" && b.timer >= T.bombEvery && tgt && countOwned(w, b, "bomb") === 0) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "bomb", state: "fly", x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r,
        vx: Math.cos(a) * T.bombSpeed, vy: Math.sin(a) * T.bombSpeed, r: 9, fuse: T.bombFuse, max: T.bombFuse, carrier: null, passCd: 0,
        life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "bajaklaut", id: b.id });
    }

    if (b.type === "mekanik" && b.timer >= T.cactusEvery && countOwned(w, b, "cactus") < T.cactusMax) {
      b.timer = 0;
      w.hazards.push({ kind: "cactus", x: b.x, y: b.y, r: 14, life: T.cactusLife, max: T.cactusLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "mekanikTanam", id: b.id });
    }

    if (b.type === "ninja") {
      // benang ditarik oleh kembar dengan id terkecil supaya tidak dobel
      const lead = !b.split || !w.balls.some((k) => k !== b && k.alive && k.type === "ninja" && k.team === b.team && k.split && k.id < b.id);
      const p = lead && kembarPartner(w, b);
      if (p) {
        for (const o of enemiesOf(w, b)) {
          const key = "th" + o.id;
          if ((b.hitCd[key] || 0) > 0) continue;
          if (segDist(o.x, o.y, b.x, b.y, p.x, p.y) < o.r + T.threadWidth / 2) {
            b.hitCd[key] = T.threadCd;
            strike(w, o, T.threadDmg, b);
            emit(w, { kind: "skill", type: "ninjaBenang", id: b.id, x: o.x, y: o.y });
          }
        }
      }
    }

    if (b.type === "bard" && b.timer >= T.gasEvery) {
      b.timer = 0;
      const m = Math.hypot(b.vx, b.vy) || 1;
      w.hazards.push({ kind: "gas", x: b.x, y: b.y, vx: (-b.vx / m) * T.gasDrift, vy: (-b.vy / m) * T.gasDrift, r: T.gasR,
        life: T.gasLife, max: T.gasLife, acc: {}, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "bard", id: b.id });
    }

    if (b.type === "golem" && b.timer >= T.pillarEvery && tgt) {
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
      emit(w, { kind: "skill", type: "golem", id: b.id, x, y });
    }

    if (b.type === "druid" && b.timer >= T.shroomEvery && countOwned(w, b, "shroom") < T.shroomMax) {
      b.timer = 0;
      const M = 30;
      w.hazards.push({ kind: "shroom", x: M + w.rand() * (ARENA - 2 * M), y: M + w.rand() * (ARENA - 2 * M), r: T.shroomR,
        life: T.shroomLife, max: T.shroomLife, grow: T.shroomGrow, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "druidTanam", id: b.id });
    }

    if (b.type === "sumo") {
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
          emit(w, { kind: "skill", type: "sumo", id: b.id, r: T.repelR });
        } else emit(w, { kind: "skill", type: "sumoTarik", id: b.id });
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
          emit(w, { kind: "skill", type: "sumoCuri", id: b.id, x: h.x, y: h.y });
        }
      }
    }

    if (b.type === "koboi") {
      if (tgt) b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x); // laras selalu membidik lawan terdekat
      if (b.timer >= T.shotEvery && tgt) {
        b.timer = 0;
        shot(w, b, b.aim, { skin: "ball", speed: T.shotSpeed, r: 8, life: 3, dmg: T.shotDmg, bounces: T.shotBounces, bounceDmg: T.shotBounceDmg });
        setDir(b, b.aim + Math.PI); // tendangan mundur
        emit(w, { kind: "skill", type: "koboi", id: b.id });
      }
    }

    if (b.type === "necro") {
      b.droneAngle += T.droneSpin * dt;
      if (b.timer2 >= T.hiveEvery) {
        b.timer2 = 0;
        if (b.bees < T.hiveMax) { b.bees++; emit(w, { kind: "skill", type: "necroTambah", id: b.id }); }
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
        emit(w, { kind: "skill", type: "necro", id: b.id });
      }
    }

    if (b.type === "dukun") {
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
          emit(w, { kind: "skill", type: "dukun", id: b.id, target: o.id });
        } else {
          b.ghost = T.ghostTime;
          emit(w, { kind: "skill", type: "dukunTembus", id: b.id });
        }
      }
    }

    if (b.type === "sniper") {
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
        w.fx.push({ kind: "beam", pts, color: TYPES.sniper.color, life: 0.3, max: 0.3 });
        emit(w, { kind: "skill", type: "sniper", id: b.id });
      }
    }

    if (b.type === "pencuri" && b.timer >= T.trapEvery && tgt) {
      b.timer = 0;
      const x = clamp(tgt.x + tgt.vx * T.trapWarn * 0.8, 30, ARENA - 30), y = clamp(tgt.y + tgt.vy * T.trapWarn * 0.8, 30, ARENA - 30);
      w.hazards.push({ kind: "trap", x, y, r: T.trapR, warn: T.trapWarn, max: T.trapWarn, life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "pencuri", id: b.id });
    }

    if (b.type === "peramal" && b.timer >= T.cardEvery && tgt) {
      b.timer = 0;
      const r = w.rand();
      const a = aimAngle(w, b, tgt);
      const card = (o) => shot(w, b, a, Object.assign({ skin: "card", speed: T.cardSpeed, r: 9, life: 2 }, o));
      if (r < T.cardGoldChance) { card({ card: "gold", color: "#ffd23c", dmg: T.cardGold }); emit(w, { kind: "skill", type: "peramalEmas", id: b.id }); }
      else if (r < 0.37) { card({ card: "red", color: "#ff4a4a", dmg: T.cardDmg }); emit(w, { kind: "skill", type: "peramal", id: b.id }); }
      else if (r < 0.59) { card({ card: "blue", color: "#5ac8ff", dmg: T.cardWeak, freeze: T.cardFreeze }); emit(w, { kind: "skill", type: "peramalBiru", id: b.id }); }
      else if (r < 0.8) { card({ card: "purple", color: "#b06bff", dmg: T.cardWeak, silence: true, silenceTime: T.cardSilence }); emit(w, { kind: "skill", type: "peramalUngu", id: b.id }); }
      else {
        const heal = Math.min(T.cardHeal, b.maxHp - b.hp);
        b.hp += heal;
        emit(w, { kind: "heal", id: b.id, x: b.x, y: b.y, amt: heal });
        emit(w, { kind: "skill", type: "peramalHijau", id: b.id });
      }
    }

    if (b.type === "pemanah") {
      if (b.spiral > 0) {
        b.spiral -= dt;
        b.spiralT += dt;
        const every = T.spiralTime / T.spiralPetals;
        while (b.spiralT >= every && b.spiralN < T.spiralPetals) {
          b.spiralT -= every;
          const a = b.spiralA + b.spiralN * 0.95;
          b.spiralN++;
          shot(w, b, a, { skin: "arrow", speed: T.petalSpeed, r: 7, life: 1.5, dmg: T.petalDmg, drowsy: true });
        }
        if (b.spiral <= 0) b.timer = 0;
      } else if (b.timer >= T.flowerEvery) {
        b.spiral = T.spiralTime;
        b.spiralN = 0;
        b.spiralT = 0;
        b.spiralA = aimAngle(w, b, tgt);
        emit(w, { kind: "skill", type: "pemanah", id: b.id });
      }
    }

    if (b.type === "biksu" && b.timer >= T.tornadoEvery && tgt) {
      b.timer = 0;
      w.hazards.push({ kind: "tornado", x: b.x, y: b.y, r: T.tornadoR, life: T.tornadoLife, max: T.tornadoLife, caught: null, catchT: 0,
        spin: 0, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "biksu", id: b.id });
    }

    if (b.type === "gladiator" && b.timer >= T.prisonEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { skin: "net", speed: T.prisonSpeed, r: 13, life: 3, dmg: T.netDmg, prison: true, homing: true, turn: 2.2 });
      emit(w, { kind: "skill", type: "gladiatorTiup", id: b.id });
    }

    if (b.type === "ksatria" && b.timer >= T.bashEvery && tgt && dist(b, tgt) < T.bashR + tgt.r + 40) {
      b.timer = 0;
      blast(w, b.team, b, b.x, b.y, T.bashR, T.bashDmg, (o) => { if (o.frozen <= 0 && !o.caughtBy) setDir(o, Math.atan2(o.y - b.y, o.x - b.x)); });
      emit(w, { kind: "skill", type: "ksatriaHantam", id: b.id, r: T.bashR });
    }
    if (b.type === "ksatria" && b.shield <= 0) {
      b.shieldT -= dt;
      if (b.shieldT <= 0) { b.shield = T.bubbleHp; emit(w, { kind: "skill", type: "ksatria", id: b.id }); }
    }

    if (b.type === "silat") {
      if (b.dash > 0) {
        b.dash -= dt;
        if (b.dash <= 0) {
          setSpeed(b, BASE_SPEED);
          b.marks.push({ x: b.x, y: b.y });
          emit(w, { kind: "skill", type: "silatTaruh", id: b.id, x: b.x, y: b.y });
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
        emit(w, { kind: "skill", type: "silat", id: b.id });
      }
    }

    if (b.type === "sihirapi") {
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
          emit(w, { kind: "skill", type: "sihirapi", id: b.id });
        }
      }
    }

    if (b.type === "bayangan" && b.timer >= T.shadowEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { skin: "shadow", speed: T.shadowSpeed, r: 15, life: 2.2, dmg: T.shadowDmg, homing: true, silence: true, x: b.x, y: b.y });
      emit(w, { kind: "skill", type: "bayangan", id: b.id });
    }

    if (b.type === "grenadier" && b.timer >= T.rocketEvery && tgt) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "rocket", x: b.x, y: b.y, tx: tgt.x, ty: tgt.y, vx: Math.cos(a) * T.rocketSpeed, vy: Math.sin(a) * T.rocketSpeed,
        r: 8, life: 2.5, team: b.team, owner: b, hue: Math.floor(w.rand() * 360) });
      emit(w, { kind: "skill", type: "grenadier", id: b.id });
    }

    if (b.type === "valkyrie" && b.timer >= T.meteorEvery && tgt) {
      b.timer = 0;
      // ditandai di posisi lawan + sedikit ke arah geraknya
      const x = clamp(tgt.x + tgt.vx * 0.35, 20, ARENA - 20);
      const y = clamp(tgt.y + tgt.vy * 0.35, 20, ARENA - 20);
      w.hazards.push({ kind: "valkyrie", x, y, r: T.meteorR, delay: T.meteorDelay, max: T.meteorDelay, life: 1, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "valkyrie", id: b.id });
    }

    if (b.type === "pendeta") {
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
        const heal = Math.min(T.sunNovaHeal, b.maxHp - b.hp);
        if (heal > 0) { b.hp += heal; emit(w, { kind: "heal", id: b.id, x: b.x, y: b.y, amt: heal }); }
        emit(w, { kind: "skill", type: "pendeta", id: b.id, x: b.x, y: b.y });
      }
    }

    if (b.type === "kosmos" && b.timer >= T.holeEvery) {
      b.timer = 0;
      w.hazards.push({ kind: "hole", x: b.x, y: b.y, r: T.holeR, life: T.holeLife, max: T.holeLife, team: b.team, owner: b, tick: 0, bonus: 0 });
      emit(w, { kind: "skill", type: "kosmos", id: b.id });
    }

    if (b.type === "paladin" && tgt && b.boostT <= 0) steer(b, tgt.x, tgt.y, T.hammerTurn, dt);
    if (b.type === "paladin" && b.timer >= T.hammerEvery && tgt && dist(b, tgt) < T.hammerR + tgt.r + 40) {
      b.timer = 0;
      blast(w, b.team, b, b.x, b.y, T.hammerR, T.hammerDmg, (o) => { if (o.alive) o.stun = Math.max(o.stun, T.hammerStun); });
      emit(w, { kind: "skill", type: "paladin", id: b.id, r: T.hammerR });
    }

    if (b.type === "barong" && b.timer >= T.roarEvery && tgt && dist(b, tgt) < T.roarR + tgt.r) {
      b.timer = 0;
      blast(w, b.team, b, b.x, b.y, T.roarR, T.roarDmg, (o) => {
        if (!o.alive || o.caughtBy || o.air > 0 || o.possessedBy) return;
        o.fear = T.fearTime; o.fearSrc = b;
        setDir(o, Math.atan2(o.y - b.y, o.x - b.x));
        boost(o, BASE_SPEED * T.fearSpeed, T.fearTime);
      });
      emit(w, { kind: "skill", type: "barong", id: b.id, r: T.roarR });
    }

    if (b.type === "juggernaut") {
      if (b.charge > 0) {
        b.charge -= dt;
        for (const o of enemiesOf(w, b)) {
          if ((b.hitCd[o.id] || 0) > 0 || o.air > 0) continue;
          if (dist(o, b) < o.r + b.r + 6) {
            b.hitCd[o.id] = 0.6;
            strike(w, o, T.chargeDmg, b);
            if (o.alive && o.frozen <= 0 && !o.caughtBy) {
              setDir(o, Math.atan2(o.y - b.y, o.x - b.x));
              boost(o, BASE_SPEED * T.chargePush, 0.5);
              o.flung = 0.5; o.flungSrc = b;
            }
            emit(w, { kind: "skill", type: "juggernautTabrak", id: b.id, x: o.x, y: o.y });
          }
        }
        if (b.charge <= 0) setSpeed(b, BASE_SPEED);
      } else if (b.timer >= T.chargeEvery && tgt) {
        b.timer = 0;
        b.charge = T.chargeTime;
        setDir(b, aimAngle(w, b, tgt));
        setSpeed(b, BASE_SPEED * T.chargeMult);
        emit(w, { kind: "skill", type: "juggernaut", id: b.id });
      }
    }

    if (b.type === "petinju" && tgt) {
      if (b.boostT <= 0) steer(b, tgt.x, tgt.y, T.punchTurn, dt);
      b.punchT += dt;
      if (b.punchT >= T.punchEvery && dist(b, tgt) < b.r + tgt.r + T.punchR) {
        b.punchT = 0;
        b.upN++;
        if (b.upN >= T.uppercutEvery) {
          b.upN = 0;
          strike(w, tgt, T.uppercutDmg, b);
          if (tgt.alive) tgt.stun = Math.max(tgt.stun, T.uppercutStun);
          emit(w, { kind: "skill", type: "petinju", id: b.id, x: tgt.x, y: tgt.y });
        } else {
          strike(w, tgt, T.punchDmg, b);
          emit(w, { kind: "skill", type: "petinjuJab", id: b.id, x: tgt.x, y: tgt.y });
        }
      }
    }

    if (b.type === "jawara") {
      if (b.timer >= T.jawaraTick) { b.timer = 0; b.stack++; }
      if (b.stack >= T.jawaraStack) {
        b.stack = 0;
        blast(w, b.team, b, b.x, b.y, T.jawaraR, T.jawaraDmg, (o) => { if (o.frozen <= 0 && !o.caughtBy) setDir(o, Math.atan2(o.y - b.y, o.x - b.x)); });
        emit(w, { kind: "skill", type: "jawara", id: b.id, r: T.jawaraR });
      }
    }

    if (b.type === "ronin") {
      if (b.rdash > 0) {
        b.rdash -= dt;
        for (const o of enemiesOf(w, b)) {
          if ((b.hitCd[o.id] || 0) > 0 || o.air > 0) continue;
          if (dist(o, b) < o.r + b.r + 4) {
            b.hitCd[o.id] = 0.6;
            strike(w, o, T.roninDmg, b);
            if (o.alive) { o.bleed = T.bleedTime; o.bleedSrc = b; }
            emit(w, { kind: "skill", type: "roninTebas", id: b.id, x: o.x, y: o.y });
          }
        }
        if (b.rdash <= 0) setSpeed(b, BASE_SPEED);
      } else if (b.timer >= T.roninEvery && tgt) {
        b.timer = 0;
        b.rdash = T.roninDash;
        setDir(b, aimAngle(w, b, tgt));
        setSpeed(b, BASE_SPEED * T.roninMult);
        emit(w, { kind: "skill", type: "ronin", id: b.id });
      }
    }

    if (b.type === "pembunuh") {
      if (b.stealth > 0) {
        b.stealth -= dt;
        b.ghost = Math.max(0, b.stealth);
        if (tgt) steer(b, tgt.x, tgt.y, T.stealthTurn, dt);
        for (const o of enemiesOf(w, b)) {
          if (o.air > 0 || dist(o, b) >= o.r + b.r + 4) continue;
          b.stealth = 0; b.ghost = 0;
          damage(w, o, T.backstabDmg, b, true);
          emit(w, { kind: "skill", type: "pembunuhTikam", id: b.id, x: o.x, y: o.y });
          break;
        }
        if (b.stealth <= 0) { b.ghost = 0; b.timer = 0; }
      } else if (b.timer >= T.stealthEvery && tgt) {
        b.stealth = T.stealthTime;
        b.ghost = T.stealthTime;
        emit(w, { kind: "skill", type: "pembunuh", id: b.id });
      }
    }

    if (b.type === "kunoichi" && b.timer >= T.kunaiEvery && tgt) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      for (let i = 0; i < T.kunaiCount; i++) {
        const k = i - (T.kunaiCount - 1) / 2;
        shot(w, b, a + k * T.kunaiSpread, { skin: "kunai", speed: T.kunaiSpeed, r: 6, life: 1.4, dmg: T.kunaiDmg, poison: true });
      }
      emit(w, { kind: "skill", type: "kunoichi", id: b.id });
    }

    if (b.type === "penjebak" && b.timer >= T.mineEvery && countOwned(w, b, "mine") < T.mineMax) {
      b.timer = 0;
      w.hazards.push({ kind: "mine", x: b.x, y: b.y, r: T.mineR, arm: T.mineArm, life: T.mineLife, max: T.mineLife, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "penjebakTanam", id: b.id });
    }

    if (b.type === "waktu") {
      b.histT += dt;
      if (b.histT >= 0.25) { b.histT = 0; b.hist.push(b.hp); if (b.hist.length > 20) b.hist.shift(); }
      if (b.timer2 >= T.rewindEvery) {
        b.timer2 = 0;
        const back = b.hist[b.hist.length - 1 - Math.round(T.rewindBack / 0.25)];
        if (back != null && back > b.hp) {
          const heal = Math.min(T.rewindMax, Math.round(back - b.hp));
          b.hp += heal;
          emit(w, { kind: "heal", id: b.id, x: b.x, y: b.y, amt: heal });
          emit(w, { kind: "skill", type: "waktuMundur", id: b.id });
        }
      }
      if (b.timer >= T.slowFieldEvery && tgt) {
        b.timer = 0;
        w.hazards.push({ kind: "timefield", x: tgt.x, y: tgt.y, r: T.slowFieldR, life: T.slowFieldLife, max: T.slowFieldLife, tick: 0, team: b.team, owner: b });
        emit(w, { kind: "skill", type: "waktu", id: b.id });
      }
    }

    if (b.type === "alkemis" && b.timer >= T.potionEvery && tgt) {
      b.timer = 0;
      const a = aimAngle(w, b, tgt);
      w.hazards.push({ kind: "potion", x: b.x, y: b.y, tx: tgt.x + tgt.vx * 0.3, ty: tgt.y + tgt.vy * 0.3, vx: Math.cos(a) * T.potionSpeed, vy: Math.sin(a) * T.potionSpeed,
        r: 8, life: 2, team: b.team, owner: b, spin: 0 });
      emit(w, { kind: "skill", type: "alkemis", id: b.id });
    }

    if (b.type === "pawang" && b.timer >= T.rainEvery && tgt) {
      b.timer = 0;
      w.hazards.push({ kind: "rain", x: tgt.x, y: tgt.y, r: T.rainR, target: tgt, life: T.rainLife, max: T.rainLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "pawang", id: b.id });
    }

    if (b.type === "nelayan" && b.timer >= T.hookEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { skin: "hook", speed: T.hookSpeed, r: 8, life: 1.2, dmg: T.hookDmg, hook: true });
      emit(w, { kind: "skill", type: "nelayan", id: b.id });
    }

    if (b.type === "gunner") {
      if (tgt) b.aim = Math.atan2(tgt.y - b.y, tgt.x - b.x);
      if (b.timer >= T.pelletEvery && tgt) {
        b.timer = 0;
        for (let i = 0; i < T.pelletCount; i++) {
          const k = i / (T.pelletCount - 1) - 0.5;
          shot(w, b, b.aim + k * T.pelletSpread, { skin: "pellet", speed: T.pelletSpeed * (0.9 + w.rand() * 0.2), r: 5, life: T.pelletLife, dmg: T.pelletDmg });
        }
        setDir(b, b.aim + Math.PI);
        emit(w, { kind: "skill", type: "gunner", id: b.id });
      }
    }

    if (b.type === "sumpit" && b.timer >= T.dartEvery && tgt) {
      b.timer = 0;
      shot(w, b, aimAngle(w, b, tgt), { skin: "dart", speed: T.dartSpeed, r: 5, life: 1.3, dmg: T.dartDmg, sleepy: true });
      emit(w, { kind: "skill", type: "sumpitTiup", id: b.id });
    }

    if (b.type === "tabib") {
      if (b.timer2 >= T.jamuEvery) {
        b.timer2 = 0;
        const heal = Math.min(T.jamuHeal, b.maxHp - b.hp);
        if (heal > 0) { b.hp += heal; emit(w, { kind: "heal", id: b.id, x: b.x, y: b.y, amt: heal }); }
        boost(b, BASE_SPEED * T.jamuBoost, 1.5);
        emit(w, { kind: "skill", type: "tabibJamu", id: b.id });
      }
      if (b.timer >= T.bitterEvery && tgt) {
        b.timer = 0;
        shot(w, b, aimAngle(w, b, tgt), { skin: "jamu", speed: 330, r: 8, life: 1.6, dmg: T.bitterDmg, drunk: T.bitterDrunk });
        emit(w, { kind: "skill", type: "tabib", id: b.id });
      }
    }

    if (b.type === "dalang" && b.timer >= T.puppetEvery && w.balls.filter((p) => p.minion && p.owner === b && p.alive).length < T.puppetMax) {
      b.timer = 0;
      const a = w.rand() * Math.PI * 2;
      const p = makeBall(w, "dalang", b.team, clamp(b.x + Math.cos(a) * 50, 30, ARENA - 30), clamp(b.y + Math.sin(a) * 50, 30, ARENA - 30), a, 0);
      p.minion = true; p.owner = b; p.r = T.puppetR; p.hp = p.maxHp = T.puppetHp; p.life = T.puppetLife;
      setSpeed(p, BASE_SPEED * 1.1);
      w.balls.push(p);
      w.fx.push({ kind: "ring", x: p.x, y: p.y, r: 30, color: TYPES.dalang.color, life: 0.4, max: 0.4 });
      emit(w, { kind: "skill", type: "dalang", id: b.id });
    }

    if (b.type === "totem" && b.timer >= T.totemEvery && countOwned(w, b, "totem") < T.totemMax) {
      b.timer = 0;
      w.hazards.push({ kind: "totem", x: b.x, y: b.y, r: T.totemR, life: T.totemLife, max: T.totemLife, tick: 0, team: b.team, owner: b });
      emit(w, { kind: "skill", type: "totem", id: b.id });
    }

    if (b.type === "gong" && b.timer >= T.gongEvery) {
      b.timer = 0;
      for (let i = 0; i < T.gongWaves; i++) {
        w.hazards.push({ kind: "gongwave", x: b.x, y: b.y, r: b.r, delay: i * T.gongGap, life: 1, hit: {}, team: b.team, owner: b });
      }
      emit(w, { kind: "skill", type: "gong", id: b.id });
    }
  }

  function poisonTick(w, b, dt) {
    if (b.bleed > 0) {
      b.bleed -= dt;
      b.bleedTick += dt;
      if (b.bleedTick >= T.bleedEvery) { b.bleedTick = 0; damage(w, b, T.bleedDmg, b.bleedSrc); }
    }
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
    if (o.type === "ksatria" && h.kind !== "bomb" && !h.mirrorRolled && (h.mirrorRolled = true) && w.rand() < T.mirrorShotChance) {
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
            if (o.alive && o.type !== "sihires") o.frozen = Math.max(o.frozen, T.snowFreeze + h.r * 0.02);
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
              if (h.silence) { o.silence = h.silenceTime || T.silenceTime; emit(w, { kind: "skill", type: h.card ? "peramalKunci" : "bayanganCuri", id: h.owner.id, target: o.id }); }
              if (h.freeze) o.frozen = Math.max(o.frozen, h.freeze);
              if (h.poison) applyPoison(w, h.owner, o);
              if (h.drunk) o.drunk = Math.max(o.drunk, h.drunk);
              if (h.sleepy) {
                o.dartN++;
                o.dartT = T.dartReset;
                if (o.dartN >= T.dartSleepN) { o.dartN = 0; o.sleep = Math.max(o.sleep, T.dartSleep); emit(w, { kind: "skill", type: "sumpitTidur", id: h.owner.id, target: o.id }); }
              }
              if (h.hook && !o.caughtBy && o.air <= 0 && !o.possessedBy && h.owner.alive) {
                setDir(o, Math.atan2(h.owner.y - o.y, h.owner.x - o.x));
                boost(o, T.hookPull, T.hookTime);
                o.hookT = T.hookTime; o.hookSrc = h.owner;
                emit(w, { kind: "skill", type: "nelayanTarik", id: h.owner.id, target: o.id });
              }
              if (h.drowsy && o.type !== "pemanah") {
                o.drowsy++;
                o.drowsyT = T.drowsyReset;
                if (o.drowsy >= T.drowsyMax) {
                  o.drowsy = 0;
                  o.stun = Math.max(o.stun, T.pinTime);
                  emit(w, { kind: "skill", type: "pemanahPaku", id: h.owner.id, target: o.id });
                }
              }
              if (h.prison && o.trapped <= 0) {
                o.trapped = T.prisonTime;
                o.trapSrc = h.owner;
                emit(w, { kind: "skill", type: "gladiatorPenjara", id: h.owner.id, target: o.id });
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
              if (o.type === "ksatria") { // ksatria menangkis tongnya
                const a = Math.atan2(h.y - o.y, h.x - o.x);
                h.vx = Math.cos(a) * sp; h.vy = Math.sin(a) * sp; h.team = o.team;
                emit(w, { kind: "reflect", id: o.id, x: h.x, y: h.y, tx: h.x, ty: h.y });
                continue;
              }
              h.state = "stuck";
              h.fuse = T.bombFuse;
              h.carrier = o;
              h.passCd = T.bombPass;
              emit(w, { kind: "skill", type: "bajaklautTempel", id: own.id, target: o.id });
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
      } else if (h.kind === "valkyrie") {
        h.delay -= dt;
        if (h.delay <= 0) {
          h.life = 0;
          blast(w, h.team, own, h.x, h.y, h.r, T.meteorDmg);
          w.hazards.push({ kind: "crater", x: h.x, y: h.y, r: T.craterR, life: T.craterLife, max: T.craterLife, team: h.team, owner: own });
          emit(w, { kind: "valkyrieHit", x: h.x, y: h.y });
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
            w.hazards.push({ kind: "shot", skin: "needle", color: TYPES.mekanik.color, x: h.x, y: h.y, vx: Math.cos(a) * T.needleSpeed, vy: Math.sin(a) * T.needleSpeed,
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
            if (o.type !== "druid") continue;
            h.life = 0;
            o.hp = Math.min(o.maxHp, o.hp + T.shroomHeal);
            emit(w, { kind: "heal", id: o.id, x: o.x, y: o.y, amt: T.shroomHeal });
            emit(w, { kind: "skill", type: "druidMakan", id: o.id });
          } else {
            h.life = 0;
            strike(w, o, T.shroomDmg, own);
            if (o.alive) o.drunk = Math.max(o.drunk, T.shroomDizzy);
            emit(w, { kind: "spore", x: h.x, y: h.y });
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
              emit(w, { kind: "skill", type: "pencuriJatuh", id: own.id, target: o.id, x: h.x, y: h.y });
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
            emit(w, { kind: "skill", type: "biksuLempar", id: own.id, target: c.id });
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
              emit(w, { kind: "skill", type: "biksuTangkap", id: own.id, target: t.id });
            }
          }
        }
      } else if (h.kind === "constellation") {
        if (h.warn > 0) {
          h.warn -= dt;
          if (h.warn <= 0) {
            h.life = T.starLife;
            h.max = T.starLife;
            emit(w, { kind: "skill", type: "silatRasi", id: own.id, pts: h.pts });
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
            emit(w, { kind: "skill", type: "kosmosMakan", id: own.id, x: h.x, y: h.y });
          } else if (p.vx != null) {
            p.vx += (dx / d) * 900 * dt;
            p.vy += (dy / d) * 900 * dt;
          }
        }
      } else if (h.kind === "mine") {
        h.life -= dt;
        h.arm -= dt;
        if (h.arm > 0 || !own.alive) { if (!own.alive) h.life = 0; continue; }
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.8) {
            h.life = 0;
            blast(w, h.team, own, h.x, h.y, T.mineBlast, T.mineDmg, (v) => slowDown(v, T.mineSlow, 0.5));
            w.fx.push({ kind: "boom", x: h.x, y: h.y, r: T.mineBlast, life: 0.35, max: 0.35 });
            emit(w, { kind: "boom" });
            break;
          }
        }
      } else if (h.kind === "timefield") {
        h.life -= dt;
        h.tick += dt;
        const doTick = h.tick >= T.slowFieldTick;
        if (doTick) h.tick = 0;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.5) {
            slowDown(o, 0.2, T.slowK);
            if (doTick) damage(w, o, T.slowFieldDmg, own);
          }
        }
      } else if (h.kind === "potion") {
        h.life -= dt;
        h.spin += dt * 12;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        let boom = h.life <= 0 || Math.hypot(h.tx - h.x, h.ty - h.y) < 14 || h.x < 0 || h.y < 0 || h.x > ARENA || h.y > ARENA;
        for (const o of w.balls) {
          if (boom || !targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < o.r + h.r && projectileHits(w, h, o)) boom = true;
        }
        if (boom) {
          h.life = 0;
          h.x = clamp(h.x, 10, ARENA - 10); h.y = clamp(h.y, 10, ARENA - 10);
          blast(w, h.team, h.owner, h.x, h.y, T.potionR, T.potionDmg);
          w.hazards.push({ kind: "acid", x: h.x, y: h.y, r: T.acidR, life: T.acidLife, max: T.acidLife, cd: {}, team: h.team, owner: h.owner });
          emit(w, { kind: "splash", x: h.x, y: h.y });
        }
      } else if (h.kind === "acid") {
        h.life -= dt;
        for (const k in h.cd) h.cd[k] -= dt;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.5) {
            slowDown(o, 0.3, 0.6);
            if ((h.cd[o.id] || 0) <= 0) { h.cd[o.id] = T.acidTick; damage(w, o, T.acidDmg, own); }
          }
        }
      } else if (h.kind === "rain") {
        h.life -= dt;
        if (!own.alive) { h.life = 0; continue; }
        const t = h.target;
        if (t && targetable(t)) {
          const dx = t.x - h.x, dy = t.y - h.y, d = Math.hypot(dx, dy);
          const step = Math.min(d, T.rainSpeed * dt);
          if (d > 0) { h.x += (dx / d) * step; h.y += (dy / d) * step; }
        }
        h.tick += dt;
        const doTick = h.tick >= T.rainTick;
        if (doTick) h.tick = 0;
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || o.air > 0) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) < h.r + o.r * 0.5) {
            slowDown(o, 0.3, T.rainSlow);
            if (doTick) damage(w, o, T.rainDmg, own);
          }
        }
      } else if (h.kind === "totem") {
        h.life -= dt;
        if (!own.alive) { h.life = 0; continue; }
        h.tick += dt;
        if (h.tick < T.totemTick) continue;
        h.tick = 0;
        for (const o of w.balls) {
          if (!targetable(o)) continue;
          if (Math.hypot(o.x - h.x, o.y - h.y) > h.r + o.r * 0.5) continue;
          if (o.team !== h.team) { slowDown(o, T.totemTick + 0.1, T.totemSlow); damage(w, o, T.totemDmg, own); }
          else if (o === own && o.hp < o.maxHp) {
            const heal = Math.min(T.totemHeal, o.maxHp - o.hp);
            o.hp += heal;
            emit(w, { kind: "heal", id: o.id, x: o.x, y: o.y, amt: heal, quiet: true });
          }
        }
      } else if (h.kind === "gongwave") {
        if (h.delay > 0) { h.delay -= dt; continue; }
        h.r += T.gongSpeed * dt;
        if (h.r >= T.gongMaxR) { h.life = 0; continue; }
        for (const o of w.balls) {
          if (!targetable(o) || o.team === h.team || h.hit[o.id] || o.air > 0) continue;
          const d = Math.hypot(o.x - h.x, o.y - h.y);
          if (Math.abs(d - h.r) < T.gongWidth / 2 + o.r * 0.6) {
            h.hit[o.id] = true;
            strike(w, o, T.gongDmg, own);
            if (o.alive && o.frozen <= 0 && !o.caughtBy) setDir(o, Math.atan2(o.y - h.y, o.x - h.x));
          }
        }
      }
    }
    w.hazards = w.hazards.filter((h) => h.life > 0 || (h.kind === "bomb" && h.fuse > 0 && h.fuse < 99));
  }

  // pilar golem: dinding bulat yang bikin bola memantul
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
        const ma = a.r * a.r * (a.type === "golem" ? T.rockMass : 1);
        const mb = b.r * b.r * (b.type === "golem" ? T.rockMass : 1);
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
            emit(w, { kind: "skill", type: "bajaklautPindah", id: h.owner.id, target: h.carrier.id });
          }
        }
        if (a.team === b.team) continue;
        for (const [m, o] of [[a, b], [b, a]]) {
          if (!m.minion || (m.hitCd[o.id] || 0) > 0) continue;
          m.hitCd[o.id] = T.puppetCd;
          strike(w, o, T.puppetDmg, m.owner && m.owner.alive ? m.owner : m);
        }
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
    if (b.slow > 0) { b.slow -= dt; if (b.slow <= 0) b.slowK = 1; }
    if (b.fear > 0) b.fear -= dt;
    if (b.hookT > 0) b.hookT -= dt;
    if (b.dartT > 0) { b.dartT -= dt; if (b.dartT <= 0) b.dartN = 0; }
    if (b.minion) for (const k in b.hitCd) b.hitCd[k] -= dt;
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
      if (b.minion) {
        b.life -= dt;
        if (b.life <= 0 || !b.owner || !b.owner.alive) {
          b.alive = false;
          b.hp = 0;
          w.fx.push({ kind: "pop", x: b.x, y: b.y, r: b.r, color: TYPES[b.type].color, life: 0.5, max: 0.5 });
          continue;
        }
        // wayang mengejar lawan terdekat
        const t = nearestEnemy(w, b);
        if (t && canMove(b) && b.boostT <= 0) steer(b, t.x, t.y, 2.5, dt);
      }

      // hantu yang sedang merasuki ikut posisi korbannya
      if (b.possess) {
        b.possessT -= dt;
        const o = b.possess;
        b.x = o.x; b.y = o.y;
        if (b.possessT <= 0 || !o.alive) releasePossess(w, b);
        poisonTick(w, b, dt);
        continue;
      }
      // jatuh ke pencuri: hilang, lalu muncul dari langit di tempat acak
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
          emit(w, { kind: "skill", type: "vikingInjak", id: b.id, r: R });
        }
        continue;
      }

      if (canMove(b)) {
        if (b.drunk > 0) {
          const a = Math.atan2(b.vy, b.vx) + Math.sin(w.t * 9 + b.id) * 5 * dt;
          setDir(b, a);
        }
        if (b.fear > 0 && b.fearSrc && b.fearSrc.alive) steer(b, 2 * b.x - b.fearSrc.x, 2 * b.y - b.fearSrc.y, 8, dt); // ketakutan: lari menjauh
        let k = b.trapped > 0 ? T.prisonFloat / Math.max(1, b.speed) : 1; // terjerat jaring: melayang pelan
        if (b.slow > 0) k *= b.slowK;
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
      if (b.alive && canAct(b) && !b.minion) skills(w, b, dt);
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

    const teams = new Set(w.balls.filter((b) => b.alive && !b.minion).map((b) => b.team));
    if (teams.size <= 1) {
      w.done = true;
      if (teams.size === 1) {
        w.winner = [...teams][0];
      } else {
        // semua mati di saat yang sama: yang sisa darahnya paling "tidak minus" menang
        const last = w.balls.filter((b) => b.diedAt === w.t && !b.minion).sort((a, b) => b.deathHp - a.deathHp);
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
    ARENA, OVERTIME_AT, T, TYPES, ROLES, rng, createWorld, step,
    bladeTip, bladeThrowPos, dronePositions, maxHpFor, laserPath, kembarPartner,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Watchsball = api;
})(this);
