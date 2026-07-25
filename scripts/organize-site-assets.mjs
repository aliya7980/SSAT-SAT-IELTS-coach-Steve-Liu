import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const moves = new Map([
  ["HuskyDaddy.png", "assets/images/branding/HuskyDaddy.png"],
  ["index image.jpg", "assets/images/site/index-image.jpg"],
  ["act image.jpg", "assets/images/services/act-image.jpg"],
  ["ielts image.jpg", "assets/images/services/ielts-image.jpg"],
  ["sat image.jpg", "assets/images/services/sat-image.jpg"],
  ["ssat image.jpg", "assets/images/services/ssat-image.jpg"],
  ["pages/PlotChart.jpg", "assets/images/reading/plot-chart.jpg"],
  ["style.css", "assets/styles/main.css"],
  ["pages/style.css", "assets/styles/pages.css"],
  ["pages/service folder/service style.css", "assets/styles/services.css"],
  ["pages/SSAT/MATH/math_style.css", "assets/styles/ssat-math.css"],
  ["pages/miscellaneous/cat-blog.css", "assets/styles/cat-blog.css"],
  ["pages/miscellaneous/arduino/arduino.css", "assets/styles/arduino.css"],
  ["pages/script.js", "assets/scripts/site.js"],
  ["pages/SSAT/ssat_vocabulary_lists_11_to_27.csv", "assets/data/ssat-vocabulary-lists-11-to-27.csv"],
  ["pages/service folder/IELTS Class notes #1.pdf", "assets/documents/ielts/ielts-class-notes-1.pdf"],
  ["ASSETS/ELEMENTSOFSTORY.pdf", "assets/documents/reading/elements-of-story.pdf"],
  ["ASSETS/ESSAY Outline Template.pdf", "assets/documents/writing/essay-outline-template.pdf"],
  ["ASSETS/SUMMARY WRITING.pdf", "assets/documents/writing/summary-writing.pdf"],
  ["ASSETS/identities.pdf", "assets/documents/math/identities.pdf"],
  ["ASSETS/sat-practice-test-1-digital.pdf", "assets/documents/sat/sat-practice-test-1-digital.pdf"],
  ["ASSETS/sat-practice-test-2-digital.pdf", "assets/documents/sat/sat-practice-test-2-digital.pdf"],
  ["ASSETS/sat-practice-test-3-digital.pdf", "assets/documents/sat/sat-practice-test-3-digital.pdf"],
  ["ASSETS/sat-practice-test-4-digital.pdf", "assets/documents/sat/sat-practice-test-4-digital.pdf"],
]);

const originalImages = path.join(root, "images");
if (fs.existsSync(originalImages)) {
  for (const filename of fs.readdirSync(originalImages)) {
    moves.set(`images/${filename}`, `assets/images/content/${filename}`);
  }
}
const organizedImages = path.join(root, "assets/images/content");
if (fs.existsSync(organizedImages)) {
  for (const filename of fs.readdirSync(organizedImages)) {
    moves.set(`images/${filename}`, `assets/images/content/${filename}`);
  }
}

const textFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "output" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (/\.(?:html|css|js|md)$/i.test(entry.name)) textFiles.push(absolute);
  }
}
collect(root);

const normalizedMoves = new Map(
  [...moves].map(([from, to]) => [path.posix.normalize(from), path.posix.normalize(to)]),
);

for (const absolute of textFiles) {
  const fileRelative = path.relative(root, absolute).split(path.sep).join("/");
  const directory = path.posix.dirname(fileRelative);
  let contents = fs.readFileSync(absolute, "utf8");
  let changed = false;

  contents = contents.replace(
    /((?:href|src)\s*=\s*["']|url\(\s*["']?)([^"'()?#]+)([?#][^"'()]*)?(["']|\s*\))/gi,
    (match, prefix, reference, suffix = "", closing) => {
      if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(reference)) return match;
      const decoded = decodeURIComponent(reference);
      const resolved = decoded.startsWith("/")
        ? decoded.replace(/^\/+/, "")
        : path.posix.normalize(path.posix.join(directory, decoded));
      const fallbackSource = [...normalizedMoves.keys()].find((source) => {
        const bareReference = decoded.replace(/^(\.\.\/|\.\/)+/, "");
        return resolved.endsWith(source)
          || source.endsWith(bareReference)
          || path.posix.basename(source) === path.posix.basename(bareReference);
      });
      const destination = normalizedMoves.get(resolved) || normalizedMoves.get(fallbackSource);
      if (!destination) return match;
      let replacement = path.posix.relative(directory, destination);
      if (!replacement.startsWith(".")) replacement = `./${replacement}`;
      changed = true;
      return `${prefix}${replacement}${suffix}${closing}`;
    },
  );

  if (changed) fs.writeFileSync(absolute, contents);
}

for (const [from, to] of normalizedMoves) {
  const source = path.join(root, from);
  const destination = path.join(root, to);
  if (!fs.existsSync(source)) continue;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
}

for (const directory of ["ASSETS", "images", "pages/service folder"]) {
  const absolute = path.join(root, directory);
  if (fs.existsSync(absolute) && fs.readdirSync(absolute).length === 0) fs.rmdirSync(absolute);
}
