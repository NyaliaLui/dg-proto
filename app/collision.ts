import * as THREE from 'three';

export const logVector = (v: THREE.Vector3) => {
  console.log(v.x, v.y, v.z);
};

export const logBox = (box: THREE.Box3) => {
  console.log(
    `min: ${box.min.x}, ${box.min.y}, ${box.min.z}, max: ${box.max.x}, ${box.max.y}, ${box.max.z}`,
  );
};

export const logSize = (box: THREE.Box3) => {
  const size = new THREE.Vector3();
  box.getSize(size);
  logVector(size);
};

export interface BoundingBox {
  box: THREE.Box3;
  position: THREE.Vector3;
}

/**
 * Check if two Box3 bounding boxes intersect
 */
export function checkCollision(box1: THREE.Box3, box2: THREE.Box3): boolean {
  return box1.intersectsBox(box2);
}

/**
 * Calculate bounding box from a THREE.Object3D
 */
export function calculateBoundingBox(
  lbl: string,
  object: THREE.Object3D,
): THREE.Box3 {
  const box = new THREE.Box3();
  box.setFromObject(object);
  // box.expandByVector(new THREE.Vector3(0.3, 0.3, 0.3));
  console.log(`${lbl}: ${object.name}`);
  logBox(box);
  box.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 0.2, 0.2));
  return box;
}

/**
 * Get the center of a Box3
 */
export function getBoxCenter(box: THREE.Box3): THREE.Vector3 {
  return box.getCenter(new THREE.Vector3());
}

/**
 * Get the size of a Box3
 */
export function getBoxSize(box: THREE.Box3): THREE.Vector3 {
  return box.getSize(new THREE.Vector3());
}

/**
 * Expand a box by a certain amount (useful for collision padding)
 */
export function expandBox(box: THREE.Box3, amount: number): THREE.Box3 {
  const expanded = box.clone();
  expanded.expandByScalar(amount);
  return expanded;
}
