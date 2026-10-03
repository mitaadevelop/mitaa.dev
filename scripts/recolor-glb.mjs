// Recolor a KiCad-exported board GLB without touching KiCad: override the
// soldermask (board), silkscreen and/or copper-finish colors.
//
// The colors are baked into the GLB's materials at export time. This rewrites the
// glTF JSON chunk's baseColorFactor for the materials it can identify by role:
//   - soldermask  = translucent, non-white materials (the board body)
//   - silkscreen  = near-white material
//   - finish      = the metallic material (ENIG/HASL pads)
//
//   node scripts/recolor-glb.mjs <in.glb> <out.glb> --board "#1b2a4a" [--silk "#ffffff"] [--finish "#d4af37"]
import fs from "node:fs";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, "")] = argv[i + 1];
  return out;
}

/** Classify a material by its current PBR values. */
function roleOf(m) {
  const c = m.pbrMetallicRoughness?.baseColorFactor;
  if (!c) return null;
  const [r, g, b, a = 1] = c;
  const metal = m.pbrMetallicRoughness?.metallicFactor ?? 0;
  if (metal >= 0.5) return "finish";
  const nearWhite = r > 0.85 && g > 0.85 && b > 0.85;
  if (nearWhite) return "silk";
  if (a < 0.98) return "board"; // translucent, non-white → soldermask
  return null;
}

export function recolorGlb(inPath, outPath, colors) {
  const buf = fs.readFileSync(inPath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  const binChunk = buf.slice(20 + jsonLen); // [len,type,data] for BIN, kept verbatim

  let changed = 0;
  for (const m of json.materials || []) {
    const role = roleOf(m);
    const target = role && colors[role];
    if (!target) continue;
    const c = m.pbrMetallicRoughness.baseColorFactor;
    const [r, g, b] = hexToRgb(target);
    c[0] = r; c[1] = g; c[2] = b; // keep existing alpha
    changed++;
  }

  let jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
  const pad = (4 - (jsonBuf.length % 4)) % 4;
  if (pad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad, 0x20)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + binChunk.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  fs.writeFileSync(outPath, Buffer.concat([header, jsonHeader, jsonBuf, binChunk]));
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [inPath, outPath, ...rest] = process.argv.slice(2);
  if (!inPath || !outPath) {
    console.error('usage: node scripts/recolor-glb.mjs <in.glb> <out.glb> --board "#1b2a4a" [--silk "#fff"] [--finish "#d4af37"]');
    process.exit(1);
  }
  const a = parseArgs(rest);
  const n = recolorGlb(inPath, outPath, { board: a.board, silk: a.silk, finish: a.finish });
  console.log(`✓ recolored ${n} material(s) → ${outPath}`);
}
