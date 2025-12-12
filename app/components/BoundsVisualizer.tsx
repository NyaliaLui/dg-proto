'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BoundsVisualizerProps {
  box: THREE.Box3 | null;
  color?: string;
  isColliding?: boolean;
}

/**
 * Visualizes a Box3 bounding box as a wireframe in the scene
 */
export function BoundsVisualizer({
  box,
  color = '#00ff00',
  isColliding = false
}: BoundsVisualizerProps) {
  const meshRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!meshRef.current || !box) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Create box geometry
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const edges = new THREE.EdgesGeometry(geometry);

    if (meshRef.current.geometry) {
      meshRef.current.geometry.dispose();
    }

    meshRef.current.geometry = edges;
    meshRef.current.position.copy(center);

    return () => {
      geometry.dispose();
      edges.dispose();
    };
  }, [box]);

  useFrame(() => {
    if (meshRef.current && box) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      meshRef.current.position.copy(center);
    }
  });

  if (!box) return null;

  return (
    <lineSegments ref={meshRef}>
      <lineBasicMaterial
        color={isColliding ? '#ff0000' : color}
        linewidth={2}
      />
    </lineSegments>
  );
}
