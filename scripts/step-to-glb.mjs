// Convert a STEP CAD file (.step / .stp) into a web-ready binary glTF (.glb).
//
// STEP is a CAD boundary-representation format that no browser 3D renderer can read
// directly; <model-viewer> only understands glTF/GLB. We tessellate the STEP solids
// into meshes with OpenCascade (via occt-import-js, WASM) and pack them into a GLB.
//
// Used as a library (convertStepToGlb) by scripts/convert-step-models.mjs, and as a
// CLI:  node scripts/step-to-glb.mjs input.step output.glb
import fs from "node:fs";
import occtimportjs from "occt-import-js";

let occtPromise;
function getOcct() {
  // The WASM module is expensive to init — reuse one instance across conversions.
  occtPromise ??= occtimportjs();
  return occtPromise;
}

/** Recompute vertex normals when the STEP tessellation didn't provide them. */
function computeNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const p of [a, b, c]) { n[p] += nx; n[p + 1] += ny; n[p + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

function pad4(n) { return (4 - (n % 4)) % 4; }

/**
 * A PCB is thin in one axis (its thickness). KiCad exports STEP as Z-up, but glTF
 * is Y-up, so boards otherwise render standing on edge. Rotate the model in place
 * so its thinnest bounding-box axis becomes Y — laying any board flat regardless
 * of the source CAD orientation. Mutates the positions/normals arrays.
 */
function normalizeUpAxis(positions, normals) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (positions[i + k] < min[k]) min[k] = positions[i + k];
      if (positions[i + k] > max[k]) max[k] = positions[i + k];
    }
  const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const thin = ext[0] < ext[1] ? (ext[0] < ext[2] ? 0 : 2) : ext[1] < ext[2] ? 1 : 2;
  if (thin === 1) return; // already thin in Y — nothing to do

  // Map the thin axis onto +Y with a 90° rotation.
  // thin=X: (x,y,z) -> (-y, x, z)   |   thin=Z: (x,y,z) -> (x, z, -y)
  const rot =
    thin === 0
      ? (x, y, z) => [-y, x, z]
      : (x, y, z) => [x, z, -y];
  for (const arr of [positions, normals]) {
    for (let i = 0; i < arr.length; i += 3) {
      const [x, y, z] = rot(arr[i], arr[i + 1], arr[i + 2]);
      arr[i] = x; arr[i + 1] = y; arr[i + 2] = z;
    }
  }
}

/** Build a single-buffer GLB (positions + normals + indices, one primitive per mesh). */
function meshesToGlb(meshes) {
  const positions = [], normals = [], indices = [];
  const prims = [];
  let vBase = 0;
  for (const mesh of meshes) {
    const pos = mesh.attributes.position.array;
    const idx = mesh.index.array;
    const norm = mesh.attributes.normal?.array ?? computeNormals(pos, idx);
    const vCount = pos.length / 3;
    for (let i = 0; i < pos.length; i++) positions.push(pos[i]);
    for (let i = 0; i < norm.length; i++) normals.push(norm[i]);
    const firstIndex = indices.length;
    for (let i = 0; i < idx.length; i++) indices.push(idx[i] + vBase);
    const c = mesh.color ?? [0.55, 0.57, 0.6];
    prims.push({ firstIndex, count: idx.length, color: [c[0], c[1], c[2], 1] });
    vBase += vCount;
  }

  normalizeUpAxis(positions, normals);

  const posBuf = Buffer.from(new Float32Array(positions).buffer);
  const normBuf = Buffer.from(new Float32Array(normals).buffer);
  const idxBuf = Buffer.from(new Uint32Array(indices).buffer);

  let offset = 0;
  const chunks = [];
  const bufferViews = [];
  const addView = (buf, target) => {
    const pad = pad4(offset);
    if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target ? { target } : {}) });
    chunks.push(buf); offset += buf.length;
    return bufferViews.length - 1;
  };
  const posView = addView(posBuf, 34962);
  const normView = addView(normBuf, 34962);
  const idxView = addView(idxBuf, 34963);

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], positions[i + k]); max[k] = Math.max(max[k], positions[i + k]); }

  const vertexCount = positions.length / 3;
  const accessors = [
    { bufferView: posView, componentType: 5126, count: vertexCount, type: "VEC3", min, max },
    { bufferView: normView, componentType: 5126, count: vertexCount, type: "VEC3" },
  ];
  const materials = [];
  const meshPrims = [];
  prims.forEach((pr, i) => {
    const accIdx = accessors.length;
    accessors.push({ bufferView: idxView, byteOffset: pr.firstIndex * 4, componentType: 5125, count: pr.count, type: "SCALAR" });
    materials.push({ pbrMetallicRoughness: { baseColorFactor: pr.color, metallicFactor: 0.2, roughnessFactor: 0.55 }, name: `part${i}`, doubleSided: true });
    meshPrims.push({ attributes: { POSITION: 0, NORMAL: 1 }, indices: accIdx, material: i });
  });

  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator: "step-to-glb (occt-import-js)" },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: "step-model" }],
    meshes: [{ primitives: meshPrims }], materials, accessors, bufferViews,
    buffers: [{ byteLength: bin.length }],
  };
  let json = Buffer.from(JSON.stringify(gltf), "utf8");
  if (pad4(json.length)) json = Buffer.concat([json, Buffer.alloc(pad4(json.length), 0x20)]);
  let binPadded = bin;
  if (pad4(bin.length)) binPadded = Buffer.concat([bin, Buffer.alloc(pad4(bin.length), 0)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);
  const chunk = (type, data) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(data.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, data]);
  };
  return { glb: Buffer.concat([header, chunk(0x4e4f534a, json), chunk(0x004e4942, binPadded)]), vertexCount, primitiveCount: prims.length };
}

/** Read a STEP file from disk and write a .glb. Returns { vertexCount, primitiveCount }. */
export async function convertStepToGlb(inPath, outPath) {
  const occt = await getOcct();
  const buf = fs.readFileSync(inPath);
  const result = occt.ReadStepFile(new Uint8Array(buf), null);
  if (!result.success || !result.meshes?.length) {
    throw new Error(`Could not tessellate STEP file: ${inPath}`);
  }
  const { glb, vertexCount, primitiveCount } = meshesToGlb(result.meshes);
  fs.writeFileSync(outPath, glb);
  return { vertexCount, primitiveCount, bytes: glb.length };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) {
    console.error("usage: node scripts/step-to-glb.mjs <input.step> <output.glb>");
    process.exit(1);
  }
  const info = await convertStepToGlb(inPath, outPath);
  console.log(`✓ ${outPath} — ${info.bytes} bytes, ${info.vertexCount} verts, ${info.primitiveCount} primitives`);
}
