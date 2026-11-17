/**
 * npm run icons:build
 *
 * Rasterises src/app/icon.svg into the two files browsers and phones ask for
 * by name: src/app/favicon.ico (16, 32 and 48 px) and src/app/apple-icon.png
 * (180 px, full bleed: iOS rounds the corners itself).
 *
 * Next.js serves all three from src/app/ without any configuration. Edit
 * icon.svg, run this, commit the result.
 *
 * Runs locally, like pcb:render: it draws with headless Chrome (CHROME=/path
 * to override, default is the macOS one) and writes the .ico container itself,
 * so there is nothing to install. The raster copies always use the light-browser
 * look (the dark tile): `prefers-color-scheme` only means something for the SVG
 * in a browser tab.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const svgFile = path.join(root, "src/app/icon.svg");

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME=/path/to/chrome.`);
  process.exit(1);
}

/** The SVG with its dark-mode block removed, and optionally with square corners. */
function flatSvg({ bleed }) {
  let svg = readFileSync(svgFile, "utf8").replace(/@media[^{]*\{[\s\S]*?\}\s*\}/, "");
  if (bleed) svg = svg.replace(/(<rect[^>]*?)\srx="[^"]*"/, "$1");
  return svg;
}

/** Draw `svg` at each size in a headless page; the page writes the PNGs (base64) into the DOM. */
function rasterise(svg, sizes) {
  const dir = mkdtempSync(path.join(tmpdir(), "icons-"));
  try {
    const page = path.join(dir, "draw.html");
    writeFileSync(
      page,
      `<!doctype html><meta charset="utf-8"><pre id="out">pending</pre><script>
const svg = ${JSON.stringify(svg)};
const sizes = ${JSON.stringify(sizes)};
const image = new Image();
image.onload = () => {
  const out = {};
  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(image, 0, 0, size, size);
    out[size] = canvas.toDataURL("image/png").split(",")[1];
  }
  document.getElementById("out").textContent = JSON.stringify(out);
};
image.onerror = () => { document.getElementById("out").textContent = "error"; };
image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
</script>`
    );
    const dom = execFileSync(
      CHROME,
      ["--headless=new", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `file://${page}`],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }
    );
    const match = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
    const text = match ? match[1].replaceAll("&quot;", '"') : "";
    if (!text.startsWith("{")) throw new Error(`Chrome did not draw the icon (got "${text.slice(0, 40)}")`);
    return Object.fromEntries(Object.entries(JSON.parse(text)).map(([size, b64]) => [size, Buffer.from(b64, "base64")]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** An .ico holding PNG images (supported everywhere since Windows Vista and by every browser). */
function ico(images) {
  const entries = Object.entries(images).map(([size, data]) => ({ size: Number(size), data }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length + 16 * entries.length;
  const directory = entries.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]);
}

const small = rasterise(flatSvg({ bleed: false }), [16, 32, 48]);
writeFileSync(path.join(root, "src/app/favicon.ico"), ico(small));
console.log("src/app/favicon.ico   16 + 32 + 48 px");

const apple = rasterise(flatSvg({ bleed: true }), [180]);
writeFileSync(path.join(root, "src/app/apple-icon.png"), apple[180]);
console.log("src/app/apple-icon.png 180 px");
