/* eslint-disable react-hooks/immutability */
'use client';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping } from 'three';

import { ENVIRONMENT_DEFAULTS } from '@/app/constants';

export { World };

function World() {
  const grass = useTexture(ENVIRONMENT_DEFAULTS.texture.ground);
  grass.wrapS = grass.wrapT = RepeatWrapping;
  grass.repeat.set(10, 10);

  const sky = useTexture(ENVIRONMENT_DEFAULTS.texture.sky);
  const { scene } = useThree();
  scene.background = sky;

  return (
    <mesh
      rotation-x={ENVIRONMENT_DEFAULTS.groundRotation}
      receiveShadow={ENVIRONMENT_DEFAULTS.enableShadows}
    >
      <planeGeometry
        args={[ENVIRONMENT_DEFAULTS.groundDim, ENVIRONMENT_DEFAULTS.groundDim]}
      />
      <meshStandardMaterial map={grass} />
    </mesh>
  );
}
