/**
 * LaptopScrollytellingSection.tsx
 *
 * 9-chapter scroll-driven storytelling for the ASUS TUF Dash F15.
 * Built-in GLB animation is scrubbed by scroll. Position/rotation keyframes
 * drift cinematically alongside. All animation happens inside useFrame —
 * zero React re-renders during scroll. 900vh total scroll height.
 */

import React, { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, useAnimations } from '@react-three/drei';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import { useEncryptedGLTF } from '../hooks/useEncryptedGLTF';
import * as THREE from 'three';

// Kick off decryption immediately — model is ready before user scrolls down
useEncryptedGLTF.preload('/asus_tuf_dash_f15_laptop.techverse');

// ─── TYPE ─────────────────────────────────────────────────────────────────────
type Align = 'left' | 'right' | 'center';
interface Keyframe {
  id: string;
  label: string;
  tag: string;
  title: string;
  body: string;
  specs: string[];        // floating spec pills
  statValue?: string;     // big highlighted number
  statLabel?: string;
  cta?: string | null;
  align: Align;
  position: [number, number, number];
  rotation: [number, number, number];
}

// ─── 9 CHAPTERS ───────────────────────────────────────────────────────────────
// ─── 9 CHAPTERS ───────────────────────────────────────────────────────────────
const KEYFRAMES: Keyframe[] = [
  {
    id: 'hero',
    label: '01 / 09',
    tag: 'SYSTEM BOOT: ACTIVE',
    title: 'CURATED',
    body: 'From enthusiast-grade GPUs to ultra-portable workstations. We rigorously test and verify every component entering our inventory so you only get the absolute best.',
    specs: ['SYS_STABLE', 'CORES_ONLINE', 'TUF_READY'],
    statValue: 'ACTV',
    statLabel: 'system status',
    cta: 'EXPLORE SYSTEM',
    align: 'left',
    position: [0.8, -0.6, 0.4],
    rotation: [0.1, -0.3, 0],
  },
  {
    id: 'vents',
    label: '02 / 09',
    tag: 'THERMAL_ARRAY: CALIBRATED',
    title: 'THERMALS',
    body: 'Engineering obsession meets gaming destiny. The TUF Dash F15 dominates every benchmark with industrial precision.',
    specs: ['FLOW_OPTIMIZED', 'ARC_BLADES', '84_FINS'],
    statValue: '76%',
    statLabel: 'airflow efficiency',
    cta: null,
    align: 'left',
    position: [0.0, -0.2, 0.5],
    rotation: [-0.1, 0.6, 0.05],
  },
  {
    id: 'execution',
    label: '03 / 09',
    tag: 'CORE_EXECUTION: PENDING',
    title: 'EXECUTION',
    body: 'Every custom build and repair is handled by certified engineers in our state-of-the-art facility. We treat your hardware with obsessive attention to detail.',
    specs: ['ISO_CERTIFIED', 'ESD_SAFE', 'QC_PASSED'],
    statValue: '0.01',
    statLabel: 'tolerance level',
    cta: 'EXPLORE SYSTEM',
    align: 'right',
    position: [-0.5, 0.0, 0.5],
    rotation: [0.4, 0.2, -0.05],
  },
  {
    id: 'flawless',
    label: '04 / 09',
    tag: 'PRECISION_ENG: ONLINE',
    title: 'FLAWLESS',
    body: 'A symphony of silicon and sweat. Our team pushes every component to its absolute limit, ensuring your build arrives stable, tuned, and ready for war.',
    specs: ['STRESS_TESTED', 'TENSIONED', 'CALIBRATED'],
    statValue: '100%',
    statLabel: 'stability index',
    cta: null,
    align: 'right',
    position: [-1.2, 0.0, 0.5],
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 'lid',
    label: '05 / 09',
    tag: 'CHASSIS_SYNC: ARMED',
    title: 'CHASSIS',
    body: 'The architecture of performance. A minimalist silhouette that hides a brutal interior. Ready for any deployment.',
    specs: ['MIL-STD-810H', 'SLIM_CHASSIS', 'STEALTH_FINISH'],
    statValue: '19.9mm',
    statLabel: 'chassis profile',
    cta: null,
    align: 'left',
    position: [0.6, -0.2, 0.2],
    rotation: [0.1, 2.5, 0],
  },
  {
    id: 'performance',
    label: '06 / 09',
    tag: 'COMPUTE_NODE: PRIME',
    title: 'POWER',
    body: 'Intel Core i9-12900H and RTX 3070 Ti. A combination that turns complex simulations and high-refresh gaming into child\'s play.',
    specs: ['i9-12900H', '3070ti', 'DDR5'],
    statValue: '14C',
    statLabel: 'compute cores',
    cta: null,
    align: 'left',
    position: [-0.2, 0.2, 2.0],
    rotation: [0.2, -0.1, 0],
  },
  {
    id: 'ports',
    label: '07 / 09',
    tag: 'I/O_ARRAY: LINKED',
    title: 'CONTROL',
    body: 'Thunderbolt 4, HDMI 2.1, and high-speed USB. Your battle station, sans adapters. Seamless expansion for any loadout.',
    specs: ['TBOLD_4', 'HDMI_2.1', 'WIFI_6E'],
    statValue: '40G',
    statLabel: 'data throughput',
    cta: null,
    align: 'right',
    position: [1.0, -0.2, 0.5],
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 'vault',
    label: '08 / 09',
    tag: 'VAULT_ACCESS: GRANTED',
    title: 'SYSTEM',
    body: 'Stress-tested, tuned, and shipped in 24 hours. Directly from the Techverse vault to your doorstep.',
    specs: ['SHIPS_24H', 'TESTED_QC', 'STEALTH_BOX'],
    statValue: '24hr',
    statLabel: 'dispatch cycle',
    cta: null,
    align: 'center',
    position: [0.0, 0.0, -0.5],
    rotation: [1.0, 0.0, 0.0],
  },
  {
    id: 'finale',
    label: '09 / 09',
    tag: 'READY_FOR_DEPLOYMENT',
    title: 'DEPLOY',
    body: 'Join the Techverse elite. Secure your build today and dominate the dimension of high-performance computing.',
    specs: ['ENLIST_NOW', 'TUF_DASH', 'TECHVERSE'],
    statValue: 'READY',
    statLabel: 'deployment status',
    cta: 'CONFIGURE BUILD →',
    align: 'center',
    position: [0.0, -0.6, 0.8],
    rotation: [0.05, 0.0, 0],
  },
];

const N = KEYFRAMES.length;
const STEP = 1 / (N - 1);

// ─── MODEL DRIVER ─────────────────────────────────────────────────────────────
function ModelDriver({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useEncryptedGLTF('/asus_tuf_dash_f15_laptop.techverse') as any;
  const { actions, mixer } = useAnimations(animations, groupRef);

  const targetPos = useRef(new THREE.Vector3(...KEYFRAMES[0].position));
  const targetRot = useRef(new THREE.Euler(...KEYFRAMES[0].rotation));

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;
        }
      });
    }
    if (actions) {
      Object.values(actions).forEach((action: any) => {
        if (!action) return;
        action.reset();
        action.play();
        action.paused = true;
        action.time = 0;
      });
    }
  }, [actions, scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = scrollYProgress.get();

    // 1. Scrub the built-in GLB animation with scroll
    if (actions) {
      Object.values(actions).forEach((action: any) => {
        if (!action) return;
        const duration = action.getClip().duration;
        if (duration > 0) {
          action.time = THREE.MathUtils.lerp(action.time, t * duration, 0.12);
        }
      });
    }
    if (mixer) mixer.update(0);

    // 2. Drift model position + rotation through keyframes
    const rawIndex = t / STEP;
    const fromIdx = Math.min(Math.floor(rawIndex), N - 2);
    const alpha = rawIndex - fromIdx;
    
    // Smooth, cinematic sine-based curve for elegant easing (no bouncing)
    const eased = 0.5 - Math.cos(alpha * Math.PI) / 2;

    const from = KEYFRAMES[fromIdx];
    const to = KEYFRAMES[fromIdx + 1];

    targetPos.current.set(
      THREE.MathUtils.lerp(from.position[0], to.position[0], eased),
      THREE.MathUtils.lerp(from.position[1], to.position[1], eased),
      THREE.MathUtils.lerp(from.position[2], to.position[2], eased)
    );
    
    targetRot.current.set(
      THREE.MathUtils.lerp(from.rotation[0], to.rotation[0], eased),
      THREE.MathUtils.lerp(from.rotation[1], to.rotation[1], eased),
      THREE.MathUtils.lerp(from.rotation[2], to.rotation[2], eased)
    );

    // Responsive fluid damping for the camera
    const LERP = 1 - Math.pow(0.025, delta);
    groupRef.current.position.lerp(targetPos.current, LERP);
    
    // Exact continuous rotation
    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * LERP;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * LERP;
    groupRef.current.rotation.z += (targetRot.current.z - groupRef.current.rotation.z) * LERP;
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} scale={8.5} />
    </group>
  );
}

// ─── SPEC PILL ────────────────────────────────────────────────────────────────
function SpecPill({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '999px',
        border: '1px solid rgba(232,93,4,0.35)',
        background: 'rgba(232,93,4,0.08)',
        backdropFilter: 'blur(8px)',
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.75)',
        fontFamily: 'monospace',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E85D04', flexShrink: 0 }} />
      {label}
    </motion.div>
  );
}

// ─── SECTION TEXT PANEL ───────────────────────────────────────────────────────
function SectionPanel({
  section,
  index,
  scrollYProgress,
}: {
  section: Keyframe;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const center = index * STEP;
  const fadeInStart = Math.max(0, center - STEP * 0.3);
  const fadeInEnd = Math.min(1, center + STEP * 0.1);
  const fadeOutStart = Math.min(1, center + STEP * 0.18);
  const fadeOutEnd = Math.min(1, center + STEP * 0.42);

  const opacity = useTransform(scrollYProgress, [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd], [0, 1, 1, 0]);
  const translateY = useTransform(scrollYProgress, [fadeInStart, fadeInEnd], ['30px', '0px']);
  const isVisible = useTransform(scrollYProgress, [fadeInStart, fadeOutEnd], [0, 0]); // used as key trigger

  const isCenter = section.align === 'center';
  const isRight = section.align === 'right';

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
        padding: '0 6vw',
        pointerEvents: 'none',
        opacity,
        y: translateY,
      }}
    >
      <div style={{
        maxWidth: '500px',
        textAlign: isCenter ? 'center' : 'left',
        pointerEvents: 'auto',
      }}
      >
        {/* Chapter tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          justifyContent: isCenter ? 'center' : 'flex-start',
        }}>
          <div style={{ width: '30px', height: '2px', background: 'linear-gradient(90deg,#E85D04,#FF8C42)', borderRadius: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#E85D04', letterSpacing: '0.25em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>
            {section.tag}
          </span>
        </div>

        {/* Title */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <h2 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(52px, 8vw, 130px)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#FFFFFF',
            margin: '0',
            textTransform: 'uppercase',
          }}>
            {section.title}
          </h2>
        </div>
        
        {/* Massive Background Stroked Text */}
        <motion.div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(100px, 20vw, 300px)',
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.03)',
            zIndex: -1,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.05em',
        }}>
            {section.title}
        </motion.div>

        {/* Body */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(15px, 1.4vw, 19px)',
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.65)',
          fontWeight: 400,
          margin: '0 0 32px 0',
          maxWidth: '460px',
          ...(isCenter ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
        }}>
          {section.body}
        </p>

        {/* Spec pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '40px',
          justifyContent: isCenter ? 'center' : 'flex-start',
        }}>
          {section.specs.map((spec, i) => (
            <SpecPill key={spec} label={spec} delay={i * 0.1} />
          ))}
        </div>

        {/* CTA */}
        {section.cta && (
          <button
            style={{
              padding: '16px 40px',
              background: 'transparent',
              border: '1px solid rgba(232,93,4,0.6)',
              borderRadius: '2px',
              color: '#FFFFFF',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(232,93,4,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = '#E85D04';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,93,4,0.6)';
            }}
          >
            {/* Shimmer Effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(232,93,4,0.2), transparent)',
                pointerEvents: 'none'
              }}
            />
            {section.cta}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── PROGRESS DOT ─────────────────────────────────────────────────────────────
function ProgressDot({ index, scrollYProgress }: { index: number; scrollYProgress: MotionValue<number> }) {
  const center = index * STEP;
  const opacity = useTransform(scrollYProgress, [Math.max(0, center - STEP * 0.4), center, Math.min(1, center + STEP * 0.4)], [0.2, 1, 0.2]);
  const scale = useTransform(scrollYProgress, [Math.max(0, center - STEP * 0.4), center, Math.min(1, center + STEP * 0.4)], [0.55, 1, 0.55]);
  return (
    <motion.div title={KEYFRAMES[index].tag} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E85D04', opacity, scale, cursor: 'default' }} />
  );
}

// ─── HORIZONTAL PROGRESS BAR ──────────────────────────────────────────────────
function ProgressBar({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 20 }}>
      <motion.div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #E85D04, #FF9F45)',
          transformOrigin: 'left center',
          scaleX,
        }}
      />
    </div>
  );
}

// ─── TACTICAL OVERLAY ────────────────────────────────────────────────────────
function TacticalUI() {
  return (
    <>
      {/* Scanlines Effect - Highest layer for CRT feel */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 4px, 3px 100%',
        opacity: 0.15,
      }} />

      {/* Frame Corners */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', width: '20px', height: '20px', borderLeft: '2px solid rgba(232,93,4,0.3)', borderTop: '2px solid rgba(232,93,4,0.3)', zIndex: 40, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40px', right: '40px', width: '20px', height: '20px', borderRight: '2px solid rgba(232,93,4,0.3)', borderTop: '2px solid rgba(232,93,4,0.3)', zIndex: 40, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '40px', left: '40px', width: '20px', height: '20px', borderLeft: '2px solid rgba(232,93,4,0.3)', borderBottom: '2px solid rgba(232,93,4,0.3)', zIndex: 40, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', width: '20px', height: '20px', borderRight: '2px solid rgba(232,93,4,0.3)', borderBottom: '2px solid rgba(232,93,4,0.3)', zIndex: 40, pointerEvents: 'none' }} />

      {/* Top Left Labels */}
      <motion.div
        animate={{ opacity: [0.6, 0.4, 0.6, 0.5, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', top: '90px', left: '60px', zIndex: 40,
          fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,93,4,0.6)',
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '4px', height: '4px', background: '#E85D04', boxShadow: '0 0 8px #E85D04' }} />
          <span>[SYS OVERRIDE ACTIVE]</span>
        </div>
        <div style={{ opacity: 0.5 }}>ENG_CALIBRATION_8X9</div>
      </motion.div>

      {/* Bottom Right Labels */}
      <motion.div
        animate={{ opacity: [0.6, 0.5, 0.6, 0.4, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: 1 }}
        style={{
          position: 'absolute', bottom: '90px', right: '60px', zIndex: 40, textAlign: 'right',
          fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,93,4,0.6)',
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', pointerEvents: 'none'
        }}
      >
        <div style={{ opacity: 0.5, marginBottom: '4px' }}>// TACTICAL CORE ONLINE</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <span>ASUS_TUF_F15_DEPLOYED</span>
          <div style={{ width: '4px', height: '4px', background: '#E85D04', boxShadow: '0 0 8px #E85D04' }} />
        </div>
      </motion.div>

      {/* Side Label */}
      <div style={{
        position: 'absolute', top: '50%', left: '25px', transform: 'translateY(-50%) rotate(-90deg)',
        zIndex: 40, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(232,93,4,0.15)',
        fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.6em', pointerEvents: 'none'
      }}>
        CAL.DEPLOY_V0.0.1
      </div>

      {/* Grid Lines - Behind the Canvas (Canvas is zIndex 10) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: `
          linear-gradient(rgba(232,93,4,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232,93,4,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />
    </>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function LaptopScrollytellingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: `${N * 100}vh`, backgroundColor: '#0F0808' }}
    >
      {/* ── STICKY VIEWPORT ── */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>

        <TacticalUI />

        {/* 3D Canvas - Moved to Z=10 to be in front of background glow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <Canvas
            camera={{ position: [0, 0, 9], fov: 35, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={2.5} color="#FFFFFF" castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={1.2} color="#4488FF" />
            <pointLight position={[0, 0, 10]} intensity={1.5} color="#FFFFFF" />
            <Suspense fallback={null}>
              <ModelDriver scrollYProgress={scrollYProgress} />
              <ContactShadows position={[0, -2.4, 0]} opacity={0.4} scale={14} blur={2.8} far={5} />
              <Environment preset="city" environmentIntensity={0.8} />
            </Suspense>
          </Canvas>
        </div>

        {/* Ambient background glow - Moved to Z=0 to be behind the model */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 55% at 50% 100%, rgba(15,8,8,0) 0%, #0F0808 100%), radial-gradient(circle at 50% 50%, rgba(232,93,4,0.02) 0%, transparent 60%)',
        }} />

        {/* Section text panels - Moved to Z=100 to stay on top of everything */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
          {KEYFRAMES.map((s, i) => (
            <SectionPanel key={s.id} section={s} index={i} scrollYProgress={scrollYProgress} />
          ))}
        </div>

        {/* Right-side progress dots */}
        <div style={{
          position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: '9px', zIndex: 20,
        }}>
          {KEYFRAMES.map((_, i) => (
            <ProgressDot key={i} index={i} scrollYProgress={scrollYProgress} />
          ))}
        </div>

        {/* Bottom scroll progress bar */}
        <ProgressBar scrollYProgress={scrollYProgress} />

        {/* Scroll hint — fades out after first section */}
        <motion.div style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          opacity: useTransform(scrollYProgress, [0, 0.06], [1, 0]),
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, rgba(232,93,4,0.9), transparent)', borderRadius: '1px' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
