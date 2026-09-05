#!/usr/bin/env node
/**
 * health — does every simulation actually run in a browser?
 *
 * The build plan's second check. The type-checker proves the code compiles and
 * the unit tests prove the physics, but neither of them has ever opened the
 * app: a sim can pass both and still paint a blank canvas, throw on the first
 * click, or die in `render` and leave a student staring at an empty stage. That
 * class of bug is invisible to every other check we run, and it is the only
 * class the student sees.
 *
 * So this loads every sim in the registry in a real Chromium, at the 6-8 band,
 * and asks four questions of each:
 *
 *   a. did the page throw?
 *   b. did the stage fall back to "this simulation hit an error"?
 *   c. is there anything on the canvas at all?
 *   d. does clicking it throw?
 *
 * It exits non-zero if any sim fails, so it can gate a build.
 *
 *   node scripts/health.mjs [--port 4173] [--only <substring>] [--jobs 4]
 *
 * Point it at a server that is already serving the app — `npx vite preview
 * --port 4173` after a build, or the dev server. Google Fonts is blocked, so a
 * run needs no network and takes the same time on every machine.
 */

import { createServer } from "vite";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Chromium is pinned to the image's browser rather than a downloaded one. */
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Fonts are the only third-party request the app makes. Blocking them keeps a
 *  run offline and stops a slow CDN from looking like a broken simulation. */
const BLOCKED = ["fonts.googleapis.com", "fonts.gstatic.com"];

const BAND = "6-8";
const NAV_TIMEOUT = 20_000;

/* ------------------------------------------------------------------ *
 * Arguments
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = { port: 4173, only: "", jobs: 4 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--port") opts.port = Number(argv[++i]);
    else if (arg === "--only") opts.only = String(argv[++i] ?? "");
    else if (arg === "--jobs") opts.jobs = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else {
      console.error(`health: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  if (!Number.isFinite(opts.port) || opts.port <= 0) {
    console.error("health: --port needs a port number");
    process.exit(2);
  }
  return opts;
}

/* ------------------------------------------------------------------ *
 * The registry
 * ------------------------------------------------------------------ */

/**
 * Read the ids out of the registry itself rather than scraping the catalog or
 * grepping for `id:`. A sim that is in the registry is a sim a student can
 * open, so the registry is the only list that cannot drift out of date.
 */
async function readSimIds() {
  const server = await createServer({
    root: APP_ROOT,
    configFile: resolve(APP_ROOT, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const mod = await server.ssrLoadModule("/src/sims/registry.ts");
    return mod.SIMS.map((sim) => sim.id);
  } finally {
    await server.close();
  }
}

/* ------------------------------------------------------------------ *
 * In-page instrumentation
 * ------------------------------------------------------------------ */

/**
 * The stage catches a failing `render` and writes an apology onto the canvas,
 * which is right for a student and useless for a checker: there is no DOM node
 * to look for. So before any app code runs, wrap `fillText` and keep what was
 * drawn. Every apology the shell can print goes through it.
 */
const INSTRUMENT = `
(() => {
  window.__health = { text: [], errors: [] };
  const proto = CanvasRenderingContext2D.prototype;
  for (const name of ["fillText", "strokeText"]) {
    const original = proto[name];
    proto[name] = function (str, ...rest) {
      try { window.__health.text.push(String(str)); } catch {}
      return original.call(this, str, ...rest);
    };
  }
  window.addEventListener("error", (e) => {
    window.__health.errors.push(String(e.message || e.error || e));
  });
  window.addEventListener("unhandledrejection", (e) => {
    window.__health.errors.push("unhandled rejection: " + String(e.reason));
  });
})();
`;

/**
 * Is there anything on the canvas?
 *
 * The stage always paints the theme's surface colour first, so a dead sim is
 * not a blank bitmap — it is one flat colour. What separates a drawing from a
 * wash is therefore *variety*: how many distinct colours there are, and how
 * much of the picture is not the single most common one.
 *
 * The stage is measured by drawing it into a small canvas rather than by
 * reading a grid of pixels out of the big one. A grid can step straight over a
 * feature — a 2px horizontal line lands between two sample rows and the sim is
 * declared blank — and a checker that cries wolf gets switched off, which costs
 * more than the bug it was meant to find. A filtered downscale averages every
 * source pixel into the result, so nothing that was drawn can go unseen.
 */
const SAMPLE_CANVAS = `
(() => {
  const canvas = document.querySelector("canvas.stage-canvas");
  if (!canvas) return { ok: false, reason: "no canvas" };
  const { width, height } = canvas;
  if (width < 8 || height < 8) return { ok: false, reason: "canvas is " + width + "x" + height };

  const w = 200;
  const h = Math.max(1, Math.round((w * height) / width));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  if (!sctx) return { ok: false, reason: "no 2d context" };
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(canvas, 0, 0, w, h);

  const data = sctx.getImageData(0, 0, w, h).data;
  const counts = new Map();
  const total = w * h;
  for (let i = 0; i < data.length; i += 4) {
    // Quantise to 5 bits a channel: two shades a student could not tell apart
    // must not count as two colours.
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let dominant = 0;
  for (const n of counts.values()) if (n > dominant) dominant = n;
  return {
    ok: true,
    colors: counts.size,
    varied: (total - dominant) / total,
    size: width + "x" + height,
  };
})();
`;

/**
 * Blank means *nothing was drawn*, not *not much was drawn*.
 *
 * One number decides it: the share of the stage that is not the background
 * wash. A colour count sounds like a second opinion but is really the same
 * opinion with a worse failure mode — an austere sim that draws two flat shapes
 * has two colours and is perfectly healthy. The sparsest simulation in the
 * catalogue sits several times above this floor, and a sim that draws nothing
 * sits at zero, so there is a wide gap to fail in.
 */
const MIN_VARIED = 0.004;

/* ------------------------------------------------------------------ *
 * One simulation
 * ------------------------------------------------------------------ */

async function checkSim(context, baseUrl, id) {
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message || String(err)));
  // The stage swallows a render error and paints an apology, logging the cause
  // only in a dev build. Keeping the console means a run against `npm run dev`
  // names the actual exception instead of leaving someone to go and find it.
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    const url = `${baseUrl}/#/sim/${encodeURIComponent(id)}/${BAND}`;
    await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT });
    const canvas = await page.waitForSelector("canvas.stage-canvas", {
      state: "visible",
      timeout: NAV_TIMEOUT,
    });
    // Let the model tick and the stage paint a few frames before judging it.
    await page.waitForTimeout(450);

    if (pageErrors.length) return fail(`page error: ${first(pageErrors)}`);

    const drawn = await page.evaluate("window.__health");
    if (drawn.errors.length) return fail(`page error: ${first(drawn.errors)}`);
    const apology = drawn.text.find((t) => t.toLowerCase().includes("hit an error"));
    if (apology) return fail(`render threw${because()}`);
    if ((await page.textContent("body"))?.toLowerCase().includes("hit an error")) {
      return fail("page text reported an error");
    }

    const pixels = await page.evaluate(SAMPLE_CANVAS);
    if (!pixels.ok) return fail(`blank canvas: ${pixels.reason}`);
    if (pixels.varied < MIN_VARIED) {
      return fail(
        `blank canvas: only ${(pixels.varied * 100).toFixed(2)}% of ${pixels.size} ` +
        `differs from the background (${pixels.colors} colours)`,
      );
    }

    // (d) A student's first instinct is to poke the picture. Centre-bottom is
    // where the ground, the launcher and the controls tend to live, so it is
    // the most likely thing to be dragged and the most likely to throw.
    const box = await canvas.boundingBox();
    if (!box) return fail("canvas has no box");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 10);
    await page.waitForTimeout(200);

    if (pageErrors.length) return fail(`click threw: ${first(pageErrors)}`);
    const after = await page.evaluate("window.__health");
    if (after.errors.length) return fail(`click threw: ${first(after.errors)}`);
    const clickApology = after.text.find((t) => t.toLowerCase().includes("hit an error"));
    if (clickApology) return fail(`click made render throw${because()}`);

    return { id, ok: true };
  } catch (err) {
    return fail(String(err?.message ?? err).split("\n")[0]);
  } finally {
    await page.close();
  }

  function fail(reason) {
    return { id, ok: false, reason };
  }

  /** The logged cause, when the build was built with one. */
  function because() {
    const cause = consoleErrors.find((t) => t.includes(`[sim:${id}]`)) ?? "";
    return cause ? ` — ${first([cause.replace(`[sim:${id}] `, "")])}` : "";
  }
}

function first(list) {
  return String(list[0]).split("\n")[0].slice(0, 140);
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("usage: node scripts/health.mjs [--port 4173] [--only <substring>] [--jobs 4]");
    return 0;
  }

  const baseUrl = `http://localhost:${opts.port}`;
  const all = await readSimIds();
  const ids = opts.only ? all.filter((id) => id.includes(opts.only)) : all;

  if (ids.length === 0) {
    console.error(opts.only
      ? `health: no simulation id contains "${opts.only}" (${all.length} in the registry)`
      : "health: the registry is empty");
    return 2;
  }

  // Software GL. Headless Chromium has no GPU, so without this every
  // simulation silently takes the 2D fallback and the 3D layer — which is now
  // most of what a student looks at — would never be checked at all.
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return BLOCKED.includes(host) ? route.abort() : route.continue();
  });
  await context.addInitScript(INSTRUMENT);

  // Fail loudly and immediately when nothing is serving, rather than reporting
  // 153 identical timeouts three minutes later.
  const probe = await context.newPage();
  try {
    await probe.goto(baseUrl, { waitUntil: "load", timeout: 8000 });
  } catch {
    await browser.close();
    console.error(`health: nothing is serving ${baseUrl} — run "npx vite preview --port ${opts.port}" first`);
    return 2;
  } finally {
    await probe.close();
  }

  const started = Date.now();
  const results = new Array(ids.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(opts.jobs, ids.length) }, async () => {
    for (let i = next++; i < ids.length; i = next++) {
      results[i] = await checkSim(context, baseUrl, ids[i]);
    }
  });
  await Promise.all(workers);
  await browser.close();

  // Report in registry order however the work was scheduled, so two runs of the
  // same commit print byte-identical output.
  const failures = results.filter((r) => !r.ok);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`OK ${ids.length - failures.length}/${ids.length}  (${seconds}s, ${baseUrl})`);
  const width = failures.reduce((w, f) => Math.max(w, f.id.length), 0);
  for (const f of failures) console.log(`  ${f.id.padEnd(width)}  ${f.reason}`);
  return failures.length ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`health: ${err?.stack ?? err}`);
    process.exit(2);
  },
);
