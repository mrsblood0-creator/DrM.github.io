import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("library-data.js", "utf8"), ctx);
const d = ctx.window.LIBRARY;
fs.mkdirSync("dist", { recursive: true });
for (const file of [
  "index.html",
  "academy.css",
  "brand-theme.css",
  "academy.js",
  "flashcards.js",
  "library-data.js",
  "article.js",
  "notes-tools.js",
  "analytics.js",
  "consent.js",
])
  fs.copyFileSync(file, "dist/" + file);
fs.mkdirSync("dist/images", { recursive: true });
for (const asset of ["logo.png", "banner.jpg"]) fs.copyFileSync("images/" + asset, "dist/images/" + asset);
fs.rmSync("dist/originals.js", { force: true });
const refs = new Set(
  d.videos.flatMap((v) =>
    [
      ...(v.notesHtml || "").matchAll(
        /(?:src|href)="((?:slide-assets|video-frames|illustrations)\/[^"]+)"/g,
      ),
    ].map((m) => m[1]),
  ),
);
for (const file of refs) {
  const target = path.join("dist", file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
// Prune only generated media files inside these exact deployment directories.
// This keeps removed annotation layers out of the downloadable website too.
for (const folder of ['slide-assets', 'video-frames', 'illustrations']) {
  const root = path.resolve('dist', folder);
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root, {withFileTypes:true})) {
    if (!entry.isFile() || refs.has(folder+'/'+entry.name)) continue;
    const target = path.resolve(root, entry.name);
    if (path.dirname(target) !== root) throw Error('Invalid generated asset path');
    fs.unlinkSync(target);
  }
}
console.log(`Packaged application and ${refs.size} referenced media files.`);
