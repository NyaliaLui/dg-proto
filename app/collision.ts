import * as THREE from 'three';

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
export function calculateBoundingBox(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  box.setFromObject(object);
  box.expandByVector(new THREE.Vector3(0.3, 0.3, 0.3));
  box.set(
    new THREE.Vector3(box.min.x, 0, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y + 1.5, box.max.z),
  );
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
