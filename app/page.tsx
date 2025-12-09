'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SpinningCube } from '@/app/components/SpinningCube';

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-zinc-900">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SpinningCube />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}
