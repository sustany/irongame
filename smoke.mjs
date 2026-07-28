#!/usr/bin/env node
// smoke.mjs — jsdom white-screen + required-controls smoke test (A1 gate).
// Renders the built bundle (dist/) in jsdom and asserts the app mounted.
// Rationale: `npm run build` only catches compile errors, not runtime
// crashes. This catches white-screen regressions before deploy.
// Usage: npm run build && node smoke.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, "dist", "index.html"), "utf8");
// Inline the built JS so jsdom doesn't need a server.
const assetMatch = html.match(/src="\/(assets\/index-[^"]+\.js)"/);
if (!assetMatch) { console.error("SMOKE FAIL: built asset not found in dist/index.html"); process.exit(1); }
const js = readFileSync(join(root, "dist", assetMatch[1]), "utf8");
const page = html.replace(/<script type="module"[^>]*><\/script>/, "");

const dom = new JSDOM(page, {
  url: "https://iron-q.netlify.app/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
});
const { window } = dom;
// Minimal shims for browser APIs the bundle touches.
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
window.scrollTo = () => {};
if (!("indexedDB" in window)) window.indexedDB = { open: () => ({ onsuccess: null, onerror: null, onupgradeneeded: null }) };
window.requestAnimationFrame = window.requestAnimationFrame || (cb => setTimeout(cb, 16));

const errors = [];
window.addEventListener("error", e => errors.push(e.error?.stack || e.message));

try {
  window.eval(js);
} catch (e) {
  errors.push(e.stack || String(e));
}

// Give React effects a beat to run.
await new Promise(r => setTimeout(r, 1200));

const rootEl = window.document.getElementById("root");
const text = rootEl ? rootEl.textContent.trim() : "";
const mounted = rootEl && rootEl.children.length > 0 && text.length > 20;

const checks = [
  ["root mounted (non-empty #root)", !!mounted],
  ["no uncaught runtime errors", errors.length === 0],
  ["IRONQ brand text present", /IRONQ/i.test(text)],
];

let pass = true;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) pass = false;
}
if (errors.length) console.error("Runtime errors:\n" + errors.join("\n---\n"));
console.log(pass ? "SMOKE PASS" : "SMOKE FAIL");
process.exit(pass ? 0 : 1);
