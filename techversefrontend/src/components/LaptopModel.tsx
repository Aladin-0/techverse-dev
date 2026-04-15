/**
 * LaptopModel.tsx
 *
 * Pure render-only component. No auto-animation, no self-driven motion.
 * All position/rotation is controlled externally via the forwarded ref.
 * This keeps the component perfectly predictable and scroll-driven.
 */
import React, { useRef, useEffect, forwardRef } from 'react';
import { GroupProps } from '@react-three/fiber';
import { useEncryptedGLTF } from '../hooks/useEncryptedGLTF';
import * as THREE from 'three';

export const LaptopModel = forwardRef<THREE.Group, GroupProps>((props, forwardedRef) => {
  const { scene } = useEncryptedGLTF('/asus_tuf_dash_f15_laptop.techverse') as any;
  const localRef = useRef<THREE.Group>(null);

  // Expose the inner group to the parent via forwardRef
  React.useImperativeHandle(forwardedRef, () => localRef.current as THREE.Group);

  // Fix common Sketchfab export issues: transparent materials, missing shadows
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <group ref={localRef} {...props} dispose={null}>
      <primitive object={scene} scale={8.5} />
    </group>
  );
});

LaptopModel.displayName = 'LaptopModel';
useEncryptedGLTF.preload('/asus_tuf_dash_f15_laptop.techverse');
