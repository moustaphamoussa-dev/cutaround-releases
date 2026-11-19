
const workers = [];
export function fwStart(script, glue, wasm, on) {
  const index = workers.length;
  let w = null;
  try {
    w = new Worker(script, { type: "module", name: "cutdeck-frames-" + index });
  } catch (e) {
    workers.push(null);
    setTimeout(() => on(index, "dead", { error: String(e) }, null));
    return index;
  }
  w.onmessage = (e) => { const d = e.data || {}; on(index, d.type || "", d, d.bytes || null); };
  w.onerror = (e) => { on(index, "dead", { error: String((e && e.message) || e) }, null); };
  w.postMessage({ type: "init", glue, wasm });
  workers.push(w);
  return index;
}
export function fwPost(index, msg) { const w = workers[index]; if (w) w.postMessage(msg); }
export function fwStop(index) { const w = workers[index]; if (w) { w.terminate(); workers[index] = null; } }
export function fwReply(msg, bytes) {
  if (bytes) { msg.bytes = bytes; postMessage(msg, [bytes.buffer]); } else { postMessage(msg); }
}
export function fwCores() { return (globalThis.navigator && navigator.hardwareConcurrency) || 4; }
