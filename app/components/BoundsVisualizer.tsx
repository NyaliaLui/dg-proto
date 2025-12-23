'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BoundingCapsule, getCapsuleCenter } from '@/app/collision';

interface BoundsVisualizerProps {
  capsule: BoundingCapsule | null;
  color?: string;
  isColliding?: boolean;
}

/**
 * Visualizes a BoundingCapsule as a wireframe in the scene
 */
export function BoundsVisualizer({
  capsule,
  color = '#00ff00',
  isColliding = false,
}: BoundsVisualizerProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current || !capsule) return;

    // Clear previous geometry
    while (groupRef.current.children.length > 0) {
      const child = groupRef.current.children[0];
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      groupRef.current.remove(child);
    }

    const { start, end, radius } = capsule;
    const height = start.distanceTo(end);
    const material = new THREE.LineBasicMaterial({
      color: isColliding ? '#ff0000' : color,
    });

    // Create cylinder for the middle section
    const cylinderGeometry = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      16,
      1,
      true,
    );
    const cylinderEdges = new THREE.EdgesGeometry(cylinderGeometry);
    const cylinderLines = new THREE.LineSegments(cylinderEdges, material);

    // Create top hemisphere
    const topSphereGeometry = new THREE.SphereGeometry(
      radius,
      16,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    const topSphereEdges = new THREE.EdgesGeometry(topSphereGeometry);
    const topSphereLines = new THREE.LineSegments(
      topSphereEdges,
      material.clone(),
    );
    topSphereLines.position.y = height / 2;

    // Create bottom hemisphere
    const bottomSphereGeometry = new THREE.SphereGeometry(
      radius,
      16,
      8,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    );
    const bottomSphereEdges = new THREE.EdgesGeometry(bottomSphereGeometry);
    const bottomSphereLines = new THREE.LineSegments(
      bottomSphereEdges,
      material.clone(),
    );
    bottomSphereLines.position.y = -height / 2;

    // Create small sphere at center
    const centerSphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const centerSphereMaterial = new THREE.MeshBasicMaterial({
      color: isColliding ? '#ff0000' : color,
    });
    const centerSphere = new THREE.Mesh(
      centerSphereGeometry,
      centerSphereMaterial,
    );

    groupRef.current.add(cylinderLines);
    groupRef.current.add(topSphereLines);
    groupRef.current.add(bottomSphereLines);
    groupRef.current.add(centerSphere);

    // Position at capsule center
    const center = getCapsuleCenter(capsule);
    groupRef.current.position.copy(center);

    return () => {
      cylinderGeometry.dispose();
      cylinderEdges.dispose();
      topSphereGeometry.dispose();
      topSphereEdges.dispose();
      bottomSphereGeometry.dispose();
      bottomSphereEdges.dispose();
      centerSphereGeometry.dispose();
      centerSphereMaterial.dispose();
      material.dispose();
    };
  }, [capsule, color, isColliding]);

  useFrame(() => {
    if (groupRef.current && capsule) {
      const center = getCapsuleCenter(capsule);
      groupRef.current.position.copy(center);
    }
  });

  if (!capsule) return null;

  return <group ref={groupRef} />;
}
