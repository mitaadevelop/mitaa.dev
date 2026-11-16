// Build step: scan every project for a STEP-based 3D model and convert it to GLB.
//
// Authors set `pcb.model3d` in a project's frontmatter to a .step / .stp path under
// /public. Browsers can't render STEP, so before dev/build we
// tessellate each referenced STEP into a sibling .glb that <model-viewer> loads.
//
// Runs from `predev` / `prebuild` in package.json. Incremental: a STEP is reconverted
// only when its .glb is missing or older than the source.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { convertStepToGlb } from "./step-to-glb.mjs";

const root = process.cwd();
const projectsDir = path.join(root, "content/projects");
const publicDir = path.join(root, "public");
const STEP_EXT = /\.(step|stp)$/i;

function collectStepPaths() {
  if (!fs.existsSync(projectsDir)) return [];
  const paths = new Set();
  for (const file of fs.readdirSync(projectsDir)) {
    if (!file.endsWith(".md")) continue;
    const { data } = matter(fs.readFileSync(path.join(projectsDir, file), "utf8"));
    const model3d = data?.pcb?.model3d;
    if (typeof model3d === "string" && STEP_EXT.test(model3d)) paths.add(model3d);
  }
  return [...paths];
}

async function main() {
  const stepPaths = collectStepPaths();
  if (stepPaths.length === 0) {
    console.log("[step→glb] no STEP models referenced — nothing to convert.");
    return;
  }

  for (const webPath of stepPaths) {
    // webPath is a /public-relative URL like /pcb/board/board.step
    const src = path.join(publicDir, webPath.replace(/^\//, ""));
    const out = src.replace(STEP_EXT, ".glb");

    if (!fs.existsSync(src)) {
      console.warn(`[step→glb] ⚠ source not found, skipping: ${webPath}`);
      continue;
    }
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) {
      console.log(`[step→glb] up to date: ${path.basename(out)}`);
      continue;
    }
    try {
      const info = await convertStepToGlb(src, out);
      console.log(
        `[step→glb] ✓ ${path.relative(root, out)} — ${info.vertexCount} verts, ${info.primitiveCount} parts`,
      );
    } catch (err) {
      console.error(`[step→glb] ✗ failed for ${webPath}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();
