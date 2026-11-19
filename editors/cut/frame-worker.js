// A CutDeck frame worker (CutAround): its own copy of the engine renders monitor frames and
// thumbnails so the page's thread only shows them (src/frameworkers.rs). The page sends `init`
// first (the glue and wasm URLs of this build); anything that arrives before the engine is up
// waits here. A trap inside the engine ends the worker's usefulness: it reports `dead`.
let mod = null;
let dead = false;
const early = [];

function run(msg) {
  if (dead) return;
  try {
    mod.frame_worker_message(msg);
  } catch (err) {
    dead = true;
    postMessage({ type: "dead", error: String((err && (err.stack || err.message)) || err) });
  }
}

onmessage = async (e) => {
  const d = e.data;
  if (d && d.type === "init") {
    try {
      mod = await import(d.glue);
      await mod.default({ module_or_path: d.wasm });
      await mod.frame_worker_init();
    } catch (err) {
      dead = true;
      postMessage({ type: "dead", error: String((err && (err.stack || err.message)) || err) });
      return;
    }
    postMessage({ type: "ready" });
    for (const m of early.splice(0)) run(m);
    return;
  }
  if (!mod) {
    early.push(d);
    return;
  }
  run(d);
};
