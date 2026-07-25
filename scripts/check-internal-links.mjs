import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "output" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (/\.(?:html|css)$/i.test(entry.name)) files.push(absolute);
  }
}
collect(root);

const missing = [];
for (const absolute of files) {
  const relativeFile = path.relative(root, absolute).split(path.sep).join("/");
  const directory = path.posix.dirname(relativeFile);
  const contents = fs.readFileSync(absolute, "utf8");
  const pattern = /(?:href|src)\s*=\s*["']([^"'#]+)|url\(\s*["']?([^"'()]+)["']?\s*\)/gi;
  for (const match of contents.matchAll(pattern)) {
    const reference = (match[1] || match[2]).split(/[?#]/, 1)[0];
    if (!reference || /^(?:[a-z]+:|\/\/|data:|mailto:|tel:)/i.test(reference)) continue;
    const decoded = decodeURIComponent(reference);
    const sitePrefix = "SSAT-SAT-IELTS-coach-Steve-Liu/";
    const resolved = decoded.startsWith("/")
      ? decoded.replace(/^\/+/, "").replace(sitePrefix, "")
      : path.posix.normalize(path.posix.join(directory, decoded));
    const candidates = [resolved];
    if (resolved.endsWith("/")) candidates.push(`${resolved}index.html`);
    if (!path.posix.extname(resolved)) candidates.push(`${resolved}.html`, `${resolved}/index.html`);
    if (!candidates.some((candidate) => fs.existsSync(path.join(root, candidate)))) {
      missing.push(`${relativeFile}: ${reference}`);
    }
  }
}

if (missing.length) {
  console.error(`Missing internal targets (${missing.length}):`);
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} HTML/CSS files: all internal file references resolve.`);
}
