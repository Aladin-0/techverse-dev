import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { MacbookModel } from './MacbookModel';

interface Showcase3DProps {
  isMobile: boolean;
}

const Showcase3D: React.FC<Showcase3DProps> = ({ isMobile }) => {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      camera={{ position: [0, isMobile ? 5.0 : 4.5, isMobile ? 4.0 : 2.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      className="transition-opacity duration-1000 ease-in-out"
    >
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.8} color="#ff6b35" />
      <spotLight position={[0, -10, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#4ea8de" />

      <Suspense fallback={null}>
        <group position={[0, 0, 0]} scale={isMobile ? 0.82 : 1}>
          <MacbookModel />
        </group>

        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.35}
          scale={10}
          blur={3}
          far={5}
          color="#000000"
        />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 4.0}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
};

export default Showcase3D;
