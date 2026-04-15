import React from 'react';
import { GroupProps } from '@react-three/fiber';
import { useEncryptedGLTF } from '../hooks/useEncryptedGLTF';

export function MacbookModel(props: GroupProps) {
  const { scene } = useEncryptedGLTF('/macbook_lowpoly_asset.techverse') as any;

  return (
    <group {...props} dispose={null}>
      {/* Scale adjusted for typical desktop dimensions, wrapped in primitive */}
      <primitive object={scene} scale={6.6} position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </group>
  );
}
