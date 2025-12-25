import * as THREE from 'three';

export function getAnimation(model: THREE.Group<THREE.Object3DEventMap>) {
  if (model.animations.length !== 1)
    throw new Error(`Unexpected number of animations: ${model.name}`);
  return model.animations[0];
}

// Log all children of a model with their positions
export function logModelChildren(
  object: THREE.Object3D,
  indent: number = 0,
): void {
  const prefix = '  '.repeat(indent);
  const pos = object.position;
  const worldPos = new THREE.Vector3();
  object.getWorldPosition(worldPos);

  console.log(
    `${prefix}${object.name || '(unnamed)'} [${object.type}]`,
    `local: (${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})`,
    `world: (${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)})`,
  );
}
