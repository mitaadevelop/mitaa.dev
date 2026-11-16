/**
 * Resolve the src for <model-viewer>. STEP files are converted to a sibling .glb
 * at build time (scripts/convert-step-models.mjs & fetch-github-data.mjs), so a
 * .step / .stp path points at the generated .glb; a .glb / .gltf is used as-is.
 */
export function resolveModelSrc(model3d: string): string {
  return model3d.replace(/\.(step|stp)$/i, ".glb");
}
