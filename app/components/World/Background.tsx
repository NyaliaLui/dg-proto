/* eslint-disable react-hooks/immutability */
'use client';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping } from 'three';

import { ENVIRONMENT_DEFAULTS } from '@/app/constants';

export { Tree, Mountain, Background };

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 3, 5]} />
        <meshStandardMaterial color={0x5c3a1e} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[1.8, 6, 6]} />
        <meshStandardMaterial color={0x2d5a27} />
      </mesh>
    </group>
  );
}

function Mountain({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  return (
    <mesh position={position} castShadow>
      <coneGeometry args={[width, height, 5]} />
      <meshStandardMaterial color={0x7a7a7a} flatShading />
    </mesh>
  );
}

function Background() {
  const grass = useTexture(ENVIRONMENT_DEFAULTS.texture.ground);
  grass.wrapS = grass.wrapT = RepeatWrapping;
  grass.repeat.set(10, 10);

  const sky = useTexture(ENVIRONMENT_DEFAULTS.texture.sky);
  const { scene } = useThree();
  scene.background = sky;

  const BACKGROUND_Z = -5;
  const MOUNTAIN_Z_OFFSET = -20;

  return (
    <>
      <mesh
        rotation-x={ENVIRONMENT_DEFAULTS.groundRotation}
        receiveShadow={ENVIRONMENT_DEFAULTS.enableShadows}
      >
        <planeGeometry
          args={[
            ENVIRONMENT_DEFAULTS.groundDim,
            ENVIRONMENT_DEFAULTS.groundDim,
          ]}
        />
        <meshStandardMaterial map={grass} />
      </mesh>
      <Mountain
        position={[-22, 8, BACKGROUND_Z + MOUNTAIN_Z_OFFSET]}
        width={14}
        height={16}
      />
      <Mountain
        position={[6, 7, BACKGROUND_Z + MOUNTAIN_Z_OFFSET]}
        width={13}
        height={14}
      />
      <Mountain
        position={[32, 6, BACKGROUND_Z + MOUNTAIN_Z_OFFSET]}
        width={12}
        height={12}
      />
      <Tree position={[-8, 0, BACKGROUND_Z]} />
      <Tree position={[0, 0, BACKGROUND_Z]} />
      <Tree position={[10, 0, BACKGROUND_Z]} />
    </>
  );
}
