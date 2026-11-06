// Simulasi balancing: duel semua pasangan hero + royale acak, lalu cetak win rate tiap hero.
// Pakai: node tools/sim.mjs [ulangan_per_pasangan=6] [jumlah_royale=400]
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const E = require("../public/engine.js");

const REP = +(process.argv[2] || 6);
const ROY = +(process.argv[3] || 400);
const ids = Object.keys(E.TYPES);
let seed = 12345;
const nextSeed = () => (seed = (seed * 1103515245 + 12345) >>> 0);

function run(entries) {
  const w = E.createWorld(entries, nextSeed());
  let n = 0;
  while (!w.done && n < 4000) { E.step(w, 1 / 30); n++; }
  return w;
}

const duel = {}, dur = {};
for (const id of ids) { duel[id] = { w: 0, g: 0 }; dur[id] = 0; }
for (const a of ids) for (const b of ids) {
  if (a === b) continue;
  for (let k = 0; k < REP; k++) {
    const w = run([{ type: a, team: 0 }, { type: b, team: 1 }]);
    duel[a].g++; duel[b].g++; dur[a] += w.t; dur[b] += w.t;
    if (w.winner === 0) duel[a].w++; else if (w.winner === 1) duel[b].w++;
  }
}

const roy = {};
for (const id of ids) roy[id] = { w: 0, g: 0 };
for (let k = 0; k < ROY; k++) {
  const pool = ids.slice().sort(() => Math.random() - 0.5).slice(0, 8);
  const w = run(pool.map((t, i) => ({ type: t, team: i })));
  for (const t of pool) roy[t].g++;
  if (w.winner != null) roy[pool[w.winner]].w++;
}

const rows = ids.map((id) => ({
  id, role: E.TYPES[id].role,
  duel: (duel[id].w / duel[id].g) * 100,
  royale: roy[id].g ? (roy[id].w / roy[id].g) * 100 : 0,
  t: dur[id] / duel[id].g,
})).sort((a, b) => b.duel - a.duel);
console.log("hero        role      duel%  royale%  rata2 detik");
for (const r of rows) console.log(r.id.padEnd(12), r.role.padEnd(9), r.duel.toFixed(0).padStart(5), r.royale.toFixed(0).padStart(7), r.t.toFixed(1).padStart(10));
const roles = {};
for (const r of rows) (roles[r.role] = roles[r.role] || []).push(r.duel);
console.log("\nrata-rata per role:", Object.entries(roles).map(([k, v]) => k + " " + (v.reduce((a, b) => a + b) / v.length).toFixed(0)).join(", "));
console.log("royale ideal ~12.5%. duel ideal 50%.");
