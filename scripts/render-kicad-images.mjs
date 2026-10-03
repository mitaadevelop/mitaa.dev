// Render static Diode-style artefacts (SVG) from KiCad files with kicad-cli:
//   - schematic image
//   - PCB top view, bottom view, and an "X-ray" (all copper overlaid)
//
// kicad-cli is NOT available on Vercel, so this is meant to be run LOCALLY (or in a
// hardware-repo CI) and the generated SVGs committed. The PcbViewer prefers these
// images when present and falls back to live KiCanvas otherwise.
//
//   node scripts/render-kicad-images.mjs <board.kicad_pcb> [schematic.kicad_sch] [outDir]
//
// Default outDir is an `img/` folder next to the board file. Prints the frontmatter
// snippet to paste into a project's `pcb:` block.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const KICAD_CLI = process.env.KICAD_CLI || "kicad-cli";
// Generous copper list; kicad-cli silently ignores layers a board doesn't have.
const COPPER = "F.Cu,In1.Cu,In2.Cu,In3.Cu,In4.Cu,In5.Cu,In6.Cu,B.Cu";

function cli(args) {
  execFileSync(KICAD_CLI, args, { stdio: ["ignore", "ignore", "inherit"] });
}

/** Export one combined SVG (single-file mode) with the given layers. */
function pcbSvg(pcbFile, outFile, layers, extra = []) {
  cli([
    "pcb", "export", "svg",
    "--mode-single", "--fit-page-to-board", "--exclude-drawing-sheet",
    "--layers", layers,
    ...extra,
    "-o", outFile,
    pcbFile,
  ]);
}

export function renderBoard(pcbFile, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  pcbSvg(pcbFile, path.join(outDir, "pcb-top.svg"), "F.Cu,F.SilkS,F.Mask,F.Paste,Edge.Cuts");
  pcbSvg(pcbFile, path.join(outDir, "pcb-bottom.svg"), "B.Cu,B.SilkS,B.Mask,B.Paste,Edge.Cuts", ["--mirror"]);
  pcbSvg(pcbFile, path.join(outDir, "pcb-xray.svg"), `${COPPER},Edge.Cuts`);
}

export function renderSchematic(schFile, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  // sch export svg writes one file per sheet into outDir.
  cli(["sch", "export", "svg", "--exclude-drawing-sheet", "-o", outDir, schFile]);
  return fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => path.join(outDir, f));
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [pcbFile, schFile, outArg] = process.argv.slice(2);
  if (!pcbFile) {
    console.error("usage: node scripts/render-kicad-images.mjs <board.kicad_pcb> [schematic.kicad_sch] [outDir]");
    process.exit(1);
  }
  const outDir = outArg || path.join(path.dirname(pcbFile), "img");
  renderBoard(pcbFile, outDir);
  let schName = null;
  if (schFile) {
    const files = renderSchematic(schFile, outDir);
    // Rename the (root) sheet to schematic.svg for a stable path.
    if (files.length) {
      schName = path.join(outDir, "schematic.svg");
      fs.copyFileSync(files[0], schName);
    }
  }
  // Print a /public-relative frontmatter snippet.
  const pub = (p) => "/" + path.relative(path.join(process.cwd(), "public"), p).split(path.sep).join("/");
  console.log("\nPaste into the project's pcb: block —\n");
  if (schName) console.log(`  schematicImage: ${pub(schName)}`);
  console.log(`  pcbImage: ${pub(path.join(outDir, "pcb-top.svg"))}`);
  console.log(`  pcbBackImage: ${pub(path.join(outDir, "pcb-bottom.svg"))}`);
  console.log(`  pcbXrayImage: ${pub(path.join(outDir, "pcb-xray.svg"))}`);
}
