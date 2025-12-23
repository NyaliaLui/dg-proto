import * as THREE from 'three';

export interface BoundingCapsule {
  start: THREE.Vector3; // Bottom center point of the capsule
  end: THREE.Vector3; // Top center point of the capsule
  radius: number; // Radius of the capsule
}

/**
 * Check if two capsules intersect
 */
export function checkCollision(
  capsule1: BoundingCapsule,
  capsule2: BoundingCapsule,
): boolean {
  const distance = closestDistanceBetweenSegments(
    capsule1.start,
    capsule1.end,
    capsule2.start,
    capsule2.end,
  );
  return distance <= capsule1.radius + capsule2.radius;
}

/**
 * Calculate the closest distance between two line segments
 */
function closestDistanceBetweenSegments(
  p1: THREE.Vector3,
  q1: THREE.Vector3,
  p2: THREE.Vector3,
  q2: THREE.Vector3,
): number {
  const d1 = new THREE.Vector3().subVectors(q1, p1); // Direction of segment 1
  const d2 = new THREE.Vector3().subVectors(q2, p2); // Direction of segment 2
  const r = new THREE.Vector3().subVectors(p1, p2);

  const a = d1.dot(d1); // Squared length of segment 1
  const e = d2.dot(d2); // Squared length of segment 2
  const f = d2.dot(r);

  const EPSILON = 1e-7;
  let s: number, t: number;

  if (a <= EPSILON && e <= EPSILON) {
    // Both segments are points
    return r.length();
  }

  if (a <= EPSILON) {
    // First segment is a point
    s = 0;
    t = Math.max(0, Math.min(1, f / e));
  } else {
    const c = d1.dot(r);
    if (e <= EPSILON) {
      // Second segment is a point
      t = 0;
      s = Math.max(0, Math.min(1, -c / a));
    } else {
      // General case
      const b = d1.dot(d2);
      const denom = a * e - b * b;

      if (denom !== 0) {
        s = Math.max(0, Math.min(1, (b * f - c * e) / denom));
      } else {
        s = 0;
      }

      t = (b * s + f) / e;

      if (t < 0) {
        t = 0;
        s = Math.max(0, Math.min(1, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.max(0, Math.min(1, (b - c) / a));
      }
    }
  }

  const closestPoint1 = new THREE.Vector3().addVectors(
    p1,
    d1.clone().multiplyScalar(s),
  );
  const closestPoint2 = new THREE.Vector3().addVectors(
    p2,
    d2.clone().multiplyScalar(t),
  );

  return closestPoint1.distanceTo(closestPoint2);
}

/**
 * Calculate bounding capsule from a THREE.Object3D (outMostCapsule)
 */
export function calculateBoundingCapsule(
  object: THREE.Object3D,
  radius: number = 0.5,
  height: number = 1.8,
): BoundingCapsule {
  const position = object.position.clone();
  return {
    start: new THREE.Vector3(position.x, position.y + radius, position.z),
    end: new THREE.Vector3(
      position.x,
      position.y + height - radius,
      position.z,
    ),
    radius: radius,
  };
}

/**
 * Calculate head capsule that fits inside the outMostCapsule
 * The top of the head capsule touches the top of the outMostCapsule
 */
export function calculateHeadCapsule(
  outMostCapsule: BoundingCapsule,
  headRadius: number = 0.15,
  headHeight: number = 0.4,
): BoundingCapsule {
  // The top of the head capsule (end + headRadius) should touch the top of outMostCapsule (end + radius)
  const topY = outMostCapsule.end.y + outMostCapsule.radius;
  const headEndY = topY - headRadius;
  const headStartY = headEndY - (headHeight - 2 * headRadius);

  return {
    start: new THREE.Vector3(
      outMostCapsule.end.x,
      headStartY,
      outMostCapsule.end.z,
    ),
    end: new THREE.Vector3(
      outMostCapsule.end.x,
      headEndY,
      outMostCapsule.end.z,
    ),
    radius: headRadius,
  };
}

/**
 * Get the center of a capsule
 */
export function getCapsuleCenter(capsule: BoundingCapsule): THREE.Vector3 {
  return new THREE.Vector3()
    .addVectors(capsule.start, capsule.end)
    .multiplyScalar(0.5);
}

/**
 * Get the height of a capsule (total height including radius caps)
 */
export function getCapsuleHeight(capsule: BoundingCapsule): number {
  return capsule.start.distanceTo(capsule.end) + 2 * capsule.radius;
}

/**
 * Expand a capsule's radius by a certain amount (useful for collision padding)
 */
export function expandCapsule(
  capsule: BoundingCapsule,
  amount: number,
): BoundingCapsule {
  return {
    start: capsule.start.clone(),
    end: capsule.end.clone(),
    radius: capsule.radius + amount,
  };
}
