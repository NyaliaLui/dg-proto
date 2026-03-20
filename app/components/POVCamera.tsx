'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_DEFAULTS } from '@/app/constants';

const HEAD_Y_OFFSET = 0.75;
const BEHIND_DIST = 2.2;
const ABOVE_DIST = 0.9;
const POS_LERP = 0.12;
const ROT_SLERP = 0.12;

const UP = new THREE.Vector3(0, 1, 0);

interface POVCameraProps {
  playerPosRef: { current: THREE.Vector3 };
  cameraYawRef: { current: number };
}

export function POVCamera({ playerPosRef, cameraYawRef }: POVCameraProps) {
  const { camera, gl } = useThree();
  const headPos = useRef(new THREE.Vector3());
  const targetCamPos = useRef(new THREE.Vector3());
  const targetQuat = useRef(new THREE.Quaternion());
  const lookAtMatrix = useRef(new THREE.Matrix4());

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      cameraYawRef.current -= e.movementX * CAMERA_DEFAULTS.MOUSE_SENSITIVITY;
      // Normalize to [-π, π]
      cameraYawRef.current =
        ((cameraYawRef.current + Math.PI) % (2 * Math.PI)) - Math.PI;
    };

    const onClick = () => {
      canvas.requestPointerLock();
    };

    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [gl, cameraYawRef]);

  useFrame(() => {
    const yaw = cameraYawRef.current;

    headPos.current.set(
      playerPosRef.current.x,
      playerPosRef.current.y + HEAD_Y_OFFSET,
      playerPosRef.current.z,
    );

    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);

    targetCamPos.current.set(
      headPos.current.x - fx * BEHIND_DIST,
      headPos.current.y + ABOVE_DIST,
      headPos.current.z - fz * BEHIND_DIST,
    );

    camera.position.lerp(targetCamPos.current, POS_LERP);

    lookAtMatrix.current.lookAt(camera.position, headPos.current, UP);
    targetQuat.current.setFromRotationMatrix(lookAtMatrix.current);
    camera.quaternion.slerp(targetQuat.current, ROT_SLERP);
  });

  return null;
}
