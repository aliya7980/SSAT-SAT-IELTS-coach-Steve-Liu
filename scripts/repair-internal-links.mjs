import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitePrefix = "SSAT-SAT-IELTS-coach-Steve-Liu/";
const files = [];
const allFiles = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "output" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else {
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      allFiles.push(relative);
      if (/\.(?:html|css)$/i.test(entry.name)) files.push(absolute);
    }
  }
}
collect(root);

const byBasename = new Map();
for (const file of allFiles) {
  const basename = path.posix.basename(file);
  const matches = byBasename.get(basename) || [];
  matches.push(file);
  byBasename.set(basename, matches);
}

const aliases = new Map([
  ["miscellaneous.html", "pages/miscellaneous/index.html"],
  ["winding-trail.jpg", "assets/images/content/winding-trail.jpeg"],
]);

for (const absolute of files) {
  const relativeFile = path.relative(root, absolute).split(path.sep).join("/");
  const directory = path.posix.dirname(relativeFile);
  let contents = fs.readFileSync(absolute, "utf8");

  contents = contents.replace(
    /((?:href|src)\s*=\s*["']|url\(\s*["']?)([^"'()?#]+)([?#][^"'()]*)?(["']|\s*\))/gi,
    (match, prefix, reference, suffix = "", closing) => {
      if (/^(?:[a-z]+:|\/\/|#|data:|mailto:|tel:)/i.test(reference)) return match;
      const decoded = decodeURIComponent(reference);
      const resolved = decoded.startsWith("/")
        ? decoded.replace(/^\/+/, "").replace(sitePrefix, "")
        : path.posix.normalize(path.posix.join(directory, decoded));
      if (fs.existsSync(path.join(root, resolved))) return match;

      const basename = path.posix.basename(decoded);
      let destination = aliases.get(basename);
      if (!destination && basename === "index.html") destination = "index.html";
      if (!destination) {
        const matches = byBasename.get(basename) || [];
        if (matches.length === 1) [destination] = matches;
      }
      if (!destination) return match;

      let replacement = path.posix.relative(directory, destination);
      if (!replacement.startsWith(".")) replacement = `./${replacement}`;
      return `${prefix}${replacement}${suffix}${closing}`;
    },
  );

  fs.writeFileSync(absolute, contents);
}
