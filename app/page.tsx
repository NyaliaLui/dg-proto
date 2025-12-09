'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Character } from '@/app/components/Character';
import { useKeyboardControls } from '@/app/components/hooks/useKeyboardControls';
import { Controls } from '@/app/components/Controls';

export default function Home() {
  const { keys, updateKey } = useKeyboardControls();
  return (
    <div className="flex h-screen w-full bg-zinc-900">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Character keys={keys} />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
      <Controls updateKey={updateKey} />
    </div>
  );
}
