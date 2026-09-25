import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

/* ------------------------------------------------------------------ *
 * The Smart Lab engine
 *
 * `smartlab/` at the repository root is the InsightVis engine and every lab
 * built on it: the Higher Secondary (Class 11–12, JEE/NEET) suite merged in
 * from pranshukesavmishra/insightvis, and every Grades 6–8 lab built since on
 * the same engine. It is plain JavaScript loaded by script tags, so it is not
 * bundled: this plugin serves it at /smartlab/ in dev and copies it into
 * dist/smartlab/ on build.
 *
 * Its index.html is BODY content (the form the InsightVis process keeps it
 * in, and the form its harness wraps), so it is wrapped into a full document
 * here. The harness itself — the .mjs scripts, their screenshots and their
 * node_modules — never ships.
 * ------------------------------------------------------------------ */

const SMARTLAB_DIR = fileURLToPath(new URL("../smartlab", import.meta.url));

const MIME: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Top-level engine and lab scripts, plus anything under assets/. */
function isShipped(rel: string): boolean {
  const parts = rel.split(/[\\/]/).filter(Boolean);
  if (parts.length === 1) return extname(parts[0]) === ".js";
  return parts[0] === "assets" && extname(rel) in MIME;
}

function shippedFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const full = join(dir, name);
      const rel = relative(SMARTLAB_DIR, full);
      if (statSync(full).isDirectory()) { if (rel === "assets" || rel.startsWith(`assets${sep}`)) walk(full); continue; }
      if (isShipped(rel)) out.push(rel);
    }
  };
  walk(SMARTLAB_DIR);
  return out;
}

/** index.html is body content: the title, font links and stylesheet go to the
 *  head, the console markup and its scripts to the body. The reset matches the
 *  harness's own wrapper, so the site renders exactly what the harness checks. */
function smartLabDocument(): string {
  const src = readFileSync(join(SMARTLAB_DIR, "index.html"), "utf8");
  const cut = src.indexOf('<div class="app">');
  const head = cut >= 0 ? src.slice(0, cut) : "";
  const body = cut >= 0 ? src.slice(cut) : src;
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<style>html{color-scheme:dark}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>",
    head.trim(),
    "</head>",
    "<body>",
    body.trim(),
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function smartLab(): Plugin {
  let outDir = "";
  return {
    name: "gradenext-smartlab",
    configResolved(cfg) {
      outDir = resolve(cfg.root, cfg.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use("/smartlab", (req, res, next) => {
        const path = decodeURIComponent((req.url ?? "/").split(/[?#]/)[0] || "/");
        if (path === "/" || path === "/index.html") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(smartLabDocument());
          return;
        }
        const rel = path.replace(/^\/+/, "");
        const file = resolve(SMARTLAB_DIR, rel);
        if (!file.startsWith(SMARTLAB_DIR + sep) || !isShipped(rel) || !existsSync(file)) { next(); return; }
        res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
        res.end(readFileSync(file));
      });
    },
    writeBundle() {
      const dest = join(outDir, "smartlab");
      for (const rel of shippedFiles()) {
        const to = join(dest, rel);
        mkdirSync(dirname(to), { recursive: true });
        copyFileSync(join(SMARTLAB_DIR, rel), to);
      }
      writeFileSync(join(dest, "index.html"), smartLabDocument());
    },
  };
}

export default defineConfig({
  plugins: [react(), smartLab()],
  base: "./",
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@sims": fileURLToPath(new URL("./src/sims", import.meta.url)),
      "@labs": fileURLToPath(new URL("./src/labs", import.meta.url)),
    },
  },
  build: { target: "es2022", chunkSizeWarningLimit: 700 },
});
