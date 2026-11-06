// Tes render tanpa browser: jalankan battle semua hero dan gambar tiap frame ke canvas tiruan.
// Tujuannya menangkap error JavaScript di render.js sebelum dimainkan di HP.
// Pakai: node tools/render_test.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const noop = () => {};
const grad = { addColorStop: noop };
const ctx = new Proxy({}, {
  get: (o, k) => (k in o ? o[k] : k === "measureText" ? () => ({ width: 10 }) : k.startsWith("create") ? () => grad : noop),
  set: (o, k, v) => ((o[k] = v), true),
});
global.window = { devicePixelRatio: 1 };
global.performance = { now: () => Date.now() };
global.document = { createElement: () => ({ getContext: () => ctx, width: 0, height: 0, style: {} }) };
require("../public/render.js");
const E = require("../public/engine.js");
const R = global.window.WBRender;
R.init({ E, IMG: {}, sfx: noop });

const ids = Object.keys(E.TYPES);
let frames = 0;
for (let g = 0; g < ids.length; g += 6) {
  const pool = ids.slice(g, g + 6);
  for (const mode of ["royale", "duel"]) {
    const entries = mode === "royale" ? pool.map((t, i) => ({ type: t, team: i })) : [{ type: pool[0], team: 0 }, { type: pool[pool.length - 1], team: 1 }];
    const w = E.createWorld(entries, 1000 + g);
    const view = R.makeView();
    for (let i = 0; i < 1800 && !w.done; i++) {
      E.step(w, 1 / 30);
      R.popParticles(w, view);
      R.consumeEvents(w, view, true);
      R.updateView(view, w, 1 / 30);
      R.drawArena(ctx, w, view, 420, { mineTeam: 0, labels: true });
      frames++;
    }
  }
}
for (const t of ids) R.ballIcon(t, 64);
console.log("render ok,", frames, "frame digambar untuk", ids.length, "hero");
