import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/tmp/claude-0/-home-user-GradeNextAILab/cab651ca-ba1e-5d3f-b80e-a9208800d96c/scratchpad/shots";
const BASE = "http://localhost:4189";

// id, archetype kind, and for explore/assemble the first part's offset.
const SIMS = [
  ["g7d1-runs-out-first", "sort"],
  ["g7d1-where-it-levels", "investigate"],
  ["g7d1-st-matthew", "process"],
  ["g7d1-the-dry-summer", "trace"],
  ["g7d1-same-food-bowl", "compare"],
  ["g7d2-three-jobs", "sort"],
  ["g7d2-build-the-web", "assemble", -0.55, -0.42],
  ["g7d2-five-floors", "explore", -0.56, -0.44],
  ["g7d2-tenth-of-a-tenth", "investigate"],
  ["g7d2-silver-springs", "process"],
  ["g7d3-one-carbon-atom", "trace"],
  ["g7d3-litter-bag", "investigate"],
  ["g7d3-fast-and-slow", "sort"],
  ["g7d3-breaking-n2", "explore", -0.56, -0.44],
  ["g7d3-cycles-and-flows", "compare"],
  ["g7d4-wolves-and-moose", "investigate"],
  ["g7d4-who-gains", "sort"],
  ["g7d4-same-deal-twice", "compare"],
  ["g7d4-when-it-turns", "process"],
  ["g7d4-ten-year-rhythm", "trace"],
  ["g7d5-how-long-to-heal", "sort"],
  ["g7d5-mussel-arithmetic", "investigate"],
  ["g7d5-what-took-the-cod", "compare"],
  ["g7d5-glacier-bay", "process"],
  ["g7d5-hubbard-brook", "trace"],
  ["g7d6-what-it-does-for-us", "sort"],
  ["g7d6-half-the-forest", "investigate"],
  ["g7d6-five-kinds-of-fix", "explore", -0.56, -0.44],
  ["g7d6-dam-or-ladder", "compare"],
  ["g7d6-fourteen-wolves", "process"],
];

const only = process.argv[2] ? process.argv.slice(2) : null;
const list = only ? SIMS.filter((s) => only.includes(s[0])) : SIMS;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });

let errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });

const report = [];
for (const [id, kind, ax, ay] of list) {
  errors = [];
  await page.goto(`${BASE}/#/sim/${id}/6-8`, { waitUntil: "load" });
  // Force a hashchange-driven remount when navigating between sims.
  await page.waitForSelector("canvas.stage-canvas", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1600);

  const stats = await page.evaluate(() => {
    const c = document.querySelector("canvas.stage-canvas");
    if (!c) return { ok: false, why: "no canvas" };
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const counts = new Map();
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 17) {
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      counts.set(k, (counts.get(k) || 0) + 1);
      n++;
    }
    let top = 0;
    for (const v of counts.values()) if (v > top) top = v;
    return {
      ok: true, w: c.width, h: c.height,
      uniqueColours: counts.size,
      nonBackgroundFraction: 1 - top / n,
    };
  });

  const box = await page.locator("canvas.stage-canvas").boundingBox();
  // Kind-appropriate primary interaction on the stage.
  let px = 0.5, py = 0.5;
  if (kind === "sort") { px = 0.25; py = 0.86; }
  else if (kind === "explore" || kind === "assemble") { px = 0.44 + ax * 0.3; py = 0.5 + ay * 0.3; }
  else if (kind === "investigate") { px = 0.25; py = 0.5; }
  if (box) await page.mouse.click(box.x + box.width * px, box.y + box.height * py);
  await page.waitForTimeout(400);

  // The shell's own primary control: a slider for investigate, the A/B switch
  // for compare, the speed control for process and trace.
  const ranges = await page.locator("input[type=range]").count();
  if (ranges > 0) {
    await page.locator("input[type=range]").first().focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  }
  const boxes = await page.locator("input[type=checkbox]").count();
  if (kind === "compare" && boxes > 0) {
    await page.locator("input[type=checkbox]").first().click({ force: true });
    await page.waitForTimeout(300);
    await page.locator("input[type=checkbox]").first().click({ force: true });
  }
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => {
    const c = document.querySelector("canvas.stage-canvas");
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const s = new Set();
    for (let i = 0; i < d.length; i += 4 * 29) s.add(((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3));
    return s.size;
  });

  await page.locator("canvas.stage-canvas").screenshot({ path: `${OUT}/${id}.png` });
  report.push({ id, kind, ...stats, afterColours: after, errors: [...errors], ranges, boxes });
  const bad = errors.length ? "ERRORS:" + errors.length : "clean";
  console.log(`${id.padEnd(28)} ${String(kind).padEnd(12)} colours=${String(stats.uniqueColours).padStart(5)} ink=${(stats.nonBackgroundFraction * 100).toFixed(1)}% after=${after} ${bad}`);
  for (const e of errors) console.log("   " + e.slice(0, 200));
}
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
