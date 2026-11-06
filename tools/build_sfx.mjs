// Bangun efek suara, suara announcer, dan musik Watchsball jadi MP3 kecil.
// Pakai: node tools/build_sfx.mjs <folder1> [folder2 ...]
//   Folder berisi hasil unzip paket CC0:
//   - kenney.nl: Impact Sounds, Interface Sounds, Sci-fi Sounds, Music Jingles, Digital Audio, RPG Audio, Voiceover Pack: Fighter
//   - opengameart.org (Juhani Junkala): 5 Action Chiptunes, Chiptune Adventures
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const roots = process.argv.slice(2);
if (!roots.length) {
  console.error("Pakai: node tools/build_sfx.mjs <folder1> [folder2 ...]");
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const outSfx = join(here, "..", "public", "assets", "sfx");
const outMusic = join(here, "..", "public", "assets", "music");
for (const d of [outSfx, outMusic]) {
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
}

// nama file (tanpa ekstensi) -> path lengkap
const index = {};
for (const root of roots) {
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ogg|wav|mp3)$/i.test(f)) index[f.replace(/\.(ogg|wav|mp3)$/i, "")] = p;
    }
  })(root);
}

// kejadian di game -> suara (beberapa varian supaya tidak monoton). Opsi: max = potong (detik), gain = desibel
const MAP = {
  // benturan
  hit: { src: ["impactSoft_medium_000", "impactSoft_medium_001", "impactSoft_medium_002", "impactPlate_light_000"] },
  crit: { src: ["impactPunch_heavy_000", "impactPunch_heavy_001"] },
  heavy: { src: ["impactPlate_heavy_000", "impactPlate_heavy_001"], gain: -2 },
  boom: { src: ["explosionCrunch_000", "explosionCrunch_001"], max: 1.2 },
  ko: { src: ["impactBell_heavy_001"], max: 1.0, gain: -3 },
  // skill
  blade: { src: ["knifeSlice", "knifeSlice2"] },
  zap: { src: ["zap1", "zap2"], max: 0.6 },
  freeze: { src: ["impactGlass_light_000", "impactGlass_light_001"] },
  shot: { src: ["lowFrequency_explosion_000"], max: 0.7 },
  laser: { src: ["laser4", "laser6"], max: 0.7 },
  charge: { src: ["phaserUp3"], max: 0.6, gain: -6 },
  portal: { src: ["phaseJump2", "phaseJump4"], max: 0.6 },
  hole: { src: ["lowDown"], max: 1.0 },
  ghost: { src: ["phaserDown2"], max: 0.6 },
  whoosh: { src: ["thrusterFire_000", "thrusterFire_003"], max: 0.5, gain: -2 },
  dash: { src: ["phaseJump1", "phaseJump3"], max: 0.5 },
  flame: { src: ["thrusterFire_001"], max: 0.9 },
  launch: { src: ["thrusterFire_002"], max: 0.5, gain: -3 },
  pop: { src: ["pluck_001", "pluck_002"] },
  shieldup: { src: ["powerUp2"], gain: -3 },
  petal: { src: ["threeTone1", "twoTone1"], gain: -4 },
  sting: { src: ["pepSound1", "pepSound2"], gain: -6 },
  nova: { src: ["lowFrequency_explosion_001"], max: 1.2 },
  meteorfall: { src: ["spaceEngineSmall_000"], max: 0.85, gain: -3 },
  meteorhit: { src: ["explosionCrunch_002", "explosionCrunch_003"], max: 1.3 },
  reflect: { src: ["impactGlass_medium_000", "impactGlass_medium_001"] },
  heal: { src: ["powerUp7"], gain: -5 },
  split: { src: ["highUp"], gain: -3 },
  callout: { src: ["phaserUp5"], max: 0.45, gain: -6 },
  // antarmuka & gacha
  count: { src: ["tick_001"] },
  go: { src: ["confirmation_001"] },
  click: { src: ["click_001"] },
  coin: { src: ["handleCoins", "handleCoins2"] },
  pull: { src: ["forceField_000"], max: 1.2, gain: -4 },
  reveal: { src: ["jingles_NES09"] },
  legend: { src: ["jingles_NES08"] },
  win: { src: ["jingles_NES12"] },
  lose: { src: ["jingles_NES11"] },
  // announcer (Kenney Voiceover Pack: Fighter)
  v3: { src: ["3"] }, v2: { src: ["2"] }, v1: { src: ["1"] },
  fight: { src: ["fight"] },
  youwin: { src: ["you_win"] },
  youlose: { src: ["you_lose"] },
  flawless: { src: ["flawless_victory"] },
  suddendeath: { src: ["sudden_death"] },
  multikill: { src: ["multi_kill"] },
  winner: { src: ["winner"] },
};

// musik latar (Juhani Junkala, CC0)
const MUSIC = {
  menu: "Juhani Junkala [Chiptune Adventures] 4. Stage Select",
  battle1: "Juhani Junkala [Retro Game Music Pack] Level 1",
  battle2: "Juhani Junkala [Retro Game Music Pack] Level 2",
  battle3: "Juhani Junkala [Retro Game Music Pack] Level 3",
  battle4: "Juhani Junkala [Chiptune Adventures] 1. Stage 1",
  battle5: "Juhani Junkala [Chiptune Adventures] 2. Stage 2",
  boss: "Juhani Junkala [Chiptune Adventures] 3. Boss Fight",
};

function need(name) {
  const p = index[name];
  if (!p) throw new Error("Audio tidak ketemu: " + name);
  return p;
}

const manifest = {};
for (const [key, opt] of Object.entries(MAP)) {
  manifest[key] = [];
  opt.src.forEach((name, i) => {
    const file = `${key}${opt.src.length > 1 ? "-" + i : ""}.mp3`;
    const af = ["loudnorm=I=-16:TP=-1.5"];
    if (opt.gain) af.push(`volume=${opt.gain}dB`);
    if (opt.max) af.push(`afade=t=out:st=${Math.max(0, opt.max - 0.15)}:d=0.15`);
    const args = ["-y", "-v", "error", "-i", need(name)];
    if (opt.max) args.push("-t", String(opt.max));
    args.push("-ac", "1", "-ar", "44100", "-af", af.join(","), "-b:a", "64k", join(outSfx, file));
    execFileSync(ffmpeg, args);
    manifest[key].push(file);
  });
}
writeFileSync(join(outSfx, "sfx.json"), JSON.stringify(manifest, null, 2));

for (const [key, name] of Object.entries(MUSIC)) {
  execFileSync(ffmpeg, ["-y", "-v", "error", "-i", need(name), "-ac", "2", "-ar", "44100", "-af", "loudnorm=I=-20:TP=-2", "-b:a", "64k", join(outMusic, key + ".mp3")]);
}
console.log("Selesai:", Object.values(manifest).flat().length, "efek suara +", Object.keys(MUSIC).length, "musik");
