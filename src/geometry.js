import { Matrix4, Mesh } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Batch static geometry by material while preserving animated subtrees. */
export function batchMeshes(root, { exclude = [], system } = {}) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map();
  function collect(object) {
    if (exclude.includes(object)) return;
    if (object.isMesh && !Array.isArray(object.material)) {
      const bucket = buckets.get(object.material) ?? [];
      bucket.push(object);
      buckets.set(object.material, bucket);
    }
    for (const child of object.children) collect(child);
  }
  collect(root);
  let before = 0;
  for (const [material, originals] of buckets) {
    const transformed = originals.map(object => object.geometry.clone().applyMatrix4(
      new Matrix4().multiplyMatrices(inverse, object.matrixWorld),
    ));
    const geometry = mergeGeometries(transformed, false);
    transformed.forEach(part => part.dispose());
    if (!geometry) throw new Error('Station geometry has incompatible vertex attributes.');
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const merged = new Mesh(geometry, material);
    if (system) merged.userData.system = system;
    for (const object of originals) {
      object.removeFromParent();
      object.geometry.dispose();
    }
    root.add(merged);
    before += originals.length;
  }
  return { before, after: buckets.size };
}
