import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, useAnimations } from '@react-three/drei';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useEncryptedGLTF } from '../hooks/useEncryptedGLTF';
import * as THREE from 'three';

// ─── TYPES ────────────────────────────────────────────────────────
type Align = 'left' | 'right' | 'center';
interface SectionData {
  id: string;
  tag: string;
  title: string;
  body: string;
  align: Align;
  pos: [number, number, number];
  rot: [number, number, number];
  btn?: { label: string; href: string };
}

// ─── 7-STAGE CINEMATIC CONFIGURATION ──────────────────────────────
// COORDINATE MATH (camera at [0, 0, 8], FOV=40, inner group rot.x=+0.4):
//
//  Screen-facing trick: inner group has a permanent +0.4 X pitch.
//   → Stage rot.x = -0.4 → net X = 0   (keyboard faces camera, downward view dominant)
//   → Stage rot.x = -0.7 → net X = -0.3 (laptop rocks BACK → screen face tilts toward camera)
//
//  Y sweet-spot: canvas center = 287px. Navbar bottom ≈ 85px.
//   Visible-area center = 330px → offset = 43px → ≈ 0.43 world units below canvas center.
//   At Y = -1.3 → model base sits 1.3 units below canvas center (≈ 128px below).
//   Model extends ~2.5 units upward from base → top at Y ≈ +1.2 → 118px above canvas center.
//   118px above center > 85px navbar bottom → CLEARS navbar. ✓
//   Keeps model inside viewport. ✓
//
//  X limits: viewport half-width ≈ 5.2 units. Keep |x| ≤ 2.4 to avoid clipping edges.
const SECTIONS: SectionData[] = [
  {
    id: 'intro',
    tag: 'TECHVERSE · STORE',
    title: 'CURATED CATALOG',
    body: 'We hand-pick every single product that enters our store. Laptops, GPUs, monitors, peripherals, accessories — each item is rigorously tested, verified, and certified by our in-house tech team before it reaches your hands. No counterfeits, no compromises. Browse hundreds of premium products from industry-leading brands like ASUS, MSI, Lenovo, and Dell — all available for fast delivery or in-store pickup.',
    align: 'left',
    pos: [1.5, -1.3, 0],
    rot: [-0.6, -1.0, -0.40],
    btn: { label: 'Visit Store', href: '/store' },
  },
  {
    id: 'performance',
    tag: 'TECHVERSE · PERFORMANCE',
    title: 'PURE POWER',
    body: 'Whether you need a portable beast for creative work or a no-compromise gaming machine, we carry the hardware to match your ambition. Our selection includes Intel Core i7 & i9 laptops, AMD Ryzen powerhouses, and RTX 3070 – 4090 GPU configurations. Every machine in our performance category is benchmarked and validated by our team — so you know exactly what you’re getting before you buy.',
    align: 'right',
    pos: [-1.8, -1.8, 0.5],
    rot: [0.5, 0.3, -0.1],
    btn: { label: 'Shop Laptops', href: '/store' },
  },
  {
    id: 'repair',
    tag: 'TECHVERSE · SERVICES',
    title: 'EXPERT REPAIRS',
    body: 'Cracked screen? Dead battery? Overheating? We fix it all. Our certified technicians specialise in screen replacements, keyboard swaps, motherboard-level diagnosis, thermal repasting, SSD upgrades, and water damage recovery. We service all major brands and models. Most repairs are completed within 24–48 hours, and every job comes with a service warranty. Walk in, book online, or use our pickup service.',
    align: 'left',
    pos: [1.0, -1.3, 0.5],
    rot: [-0.2, 2.8, -0.1],
    btn: { label: 'Book a Service', href: '/services' },
  },
  {
    id: 'refurbished',
    tag: 'TECHVERSE · REFURBISHED',
    title: 'TOTAL VALUE',
    body: 'Get flagship-grade technology at prices that make sense. Every refurbished device in our inventory goes through a rigorous multi-point inspection: display quality check, battery health validation, performance stress testing, and a full factory reset. Cosmetically graded and honestly described — Grade A, B, or C — so you always know what you’re getting. Backed by our 30-day exchange policy.',
    align: 'right',
    pos: [-2.0, -1.3, 1.0],
    rot: [0.1, 1.6, 0.1],
    btn: { label: 'Shop Refurbished', href: '/store' },
  },
  {
    id: 'upgrade',
    tag: 'TECHVERSE · UPGRADE',
    title: 'UPGRADE YOUR RIG',
    body: 'You don’t always need a new machine — sometimes you just need the right upgrade. We offer RAM expansions up to 64GB, NVMe SSD slot upgrades, GPU thermal pads, and battery replacements that breathe new life into older hardware. Our upgrade service is transparent — we show you benchmarks before and after, so you can see exactly the performance gain you’re paying for.',
    align: 'left',
    pos: [1.8, -1.3, 1.0],
    rot: [0.6, -1.6, -0.1],
    btn: { label: 'Get an Upgrade', href: '/services' },
  },
  {
    id: 'smarthome',
    tag: 'TECHVERSE · SMART HOME',
    title: 'SMART LIVING',
    body: 'Your home deserves to be as advanced as your workstation. Techverse provides expert smart home consultations, hardware supply, and full professional setup — from voice-controlled lighting and smart locks to whole-home automation hubs and AI-powered CCTV. We handle the wiring, configuration, and setup for you, so you can enjoy seamless automation without the technical headache.',
    align: 'right',
    pos: [-2.0, 0.40, 0.0],
    rot: [1.6, 0.0, 0.0],
    btn: { label: 'Explore Services', href: '/services' },
  },
  {
    id: 'finale',
    tag: 'TECHVERSE · ELITE',
    title: 'JOIN THE VERSE',
    body: 'Techverse is more than a store — it’s your complete technology partner. Shop curated hardware, book certified repair services, upgrade your existing setup, or build your smart home from scratch. Every service is delivered with precision, every product guaranteed for quality. This is where serious tech users come to get exactly what they need. Welcome to the Verse.',
    align: 'left',
    pos: [1.5, -1.3, 0],
    rot: [-0.6, -1.0, -0.40],
    btn: { label: 'Enter Techverse', href: '/store' },
  },
];


const N = SECTIONS.length;
const STEP = 1 / (N - 1);

// ─── 3D DRIVER ──────────────────────────────────────────────────
function ModelDriver({ scrollProgress }: { scrollProgress: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useEncryptedGLTF('/asus_tuf_dash_f15_laptop.techverse') as any;
  const { actions, mixer } = useAnimations(animations, groupRef);

  const targetPos = useRef(new THREE.Vector3(...SECTIONS[0].pos));
  const targetRot = useRef(new THREE.Euler(...SECTIONS[0].rot));

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.transparent = false; // Fix transparency artifacts
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = scrollProgress.get();

    // 1. Scrub animation with scroll progress (original – no modifications).
    if (actions) {
      Object.values(actions).forEach((action: any) => {
        if (!action) return;
        const duration = action.getClip().duration;
        if (duration > 0) {
          action.time = THREE.MathUtils.lerp(action.time, t * duration, 0.1);
          action.play();
          action.paused = true;
        }
      });
    }
    if (mixer) mixer.update(0);

    // 2. Interpolate position and rotation
    const rawIndex = t / STEP;
    const fromIdx = Math.min(Math.floor(rawIndex), N - 2);
    const alpha = rawIndex - fromIdx;

    // Smooth transition curve
    const eased = alpha * alpha * (3 - 2 * alpha);

    const from = SECTIONS[fromIdx];
    const to = SECTIONS[fromIdx + 1];

    targetPos.current.set(
      THREE.MathUtils.lerp(from.pos[0], to.pos[0], eased),
      THREE.MathUtils.lerp(from.pos[1], to.pos[1], eased),
      THREE.MathUtils.lerp(from.pos[2], to.pos[2], eased)
    );
    targetRot.current.set(
      THREE.MathUtils.lerp(from.rot[0], to.rot[0], eased),
      THREE.MathUtils.lerp(from.rot[1], to.rot[1], eased),
      THREE.MathUtils.lerp(from.rot[2], to.rot[2], eased)
    );

    const LERP = 1 - Math.pow(0.02, delta);
    groupRef.current.position.lerp(targetPos.current, LERP);
    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * LERP;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * LERP;
    groupRef.current.rotation.z += (targetRot.current.z - groupRef.current.rotation.z) * LERP;
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* Global pitch: lifts the model so it reads as "looking down at the laptop".
          Stage 1 cancels this with rot.x = -0.4 to achieve a flat front-face at scroll start. */}
      <group rotation={[0.4, 0, 0]}>
        <primitive object={scene} scale={9.5} />
      </group>
    </group>
  );
}

// ─── UI COMPONENT ────────────────────────────────────────────────
const LaptopScrollSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ── Mobile detection (safe: no SSR) ──────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Background gradients — slightly saturated darks on near-black base
  const BG_GRADIENTS = [
    'radial-gradient(ellipse at 65% 50%, #102040 0%, transparent 65%)',  // navy blue wash
    'radial-gradient(ellipse at 30% 60%, #2e1200 0%, transparent 65%)',  // ember wash
    'radial-gradient(ellipse at 70% 40%, #062236 0%, transparent 65%)',  // steel blue wash
    'radial-gradient(ellipse at 20% 50%, #0a1e10 0%, transparent 65%)',  // forest green wash
    'radial-gradient(ellipse at 80% 55%, #1a0c28 0%, transparent 65%)',  // violet wash
    'radial-gradient(ellipse at 50% 30%, #221400 0%, transparent 65%)',  // amber wash
    'radial-gradient(ellipse at 55% 55%, #102040 0%, transparent 65%)',  // back to navy
  ];

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: '1050vh', backgroundColor: '#08080e' }}
    >
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#08080e' }}>

        {/* ── Top-Left Corner Brand Label ─────────────────────── */}
        <div style={{
          position: 'absolute',
          top: '96px',
          left: '2.5vw',
          zIndex: 20,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '3.5px',
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            textTransform: 'uppercase',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}>
            TECHVERSE
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '9px',
            fontWeight: 400,
            letterSpacing: '1.5px',
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            textTransform: 'uppercase',
            lineHeight: 1.4,
          }}>
            Not just a brand, an immersive tech store
          </div>
        </div>

        {/* ── Bottom-Center Asset Copyright Notice ────────────── */}
        <div style={{
          position: 'absolute',
          bottom: '18px',
          left: 0,
          right: 0,
          zIndex: 20,
          pointerEvents: 'none',
          userSelect: 'none',
          textAlign: 'center',
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.28)',
            fontSize: '9px',
            fontWeight: 400,
            letterSpacing: '2px',
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            textTransform: 'uppercase',
          }}>
            This 3D asset is the exclusive property of Techverse™. Unauthorized use is prohibited.
          </div>
        </div>

        {/* ── Scroll-Driven Background Layers ────────────────── */}
        {SECTIONS.map((_, index) => {
          const center = index * STEP;
          // Wide window: gradient visible for most of the section's scroll range
          const fadeIn = Math.max(0, center - STEP * 0.7);
          // Last gradient never fades out — persists to end of scroll
          const fadeOut = index === N - 1 ? 1.0 : Math.min(1, center + STEP * 0.7);
          const bgOpacity = useTransform(
            scrollYProgress,
            index === N - 1 ? [fadeIn, center, 1.0] : [fadeIn, center, fadeOut],
            index === N - 1 ? [0, 0.85, 0.85] : [0, 0.85, 0]
          );
          return (
            <motion.div
              key={'bg-' + index}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: bgOpacity,
                background: BG_GRADIENTS[index],
                zIndex: 0,
              }}
            />
          );
        })}

        {/* ── Noise / grain overlay for cinematic texture ─────────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          opacity: 0.6,
        }} />

        {/* ── TECHVERSE Clean Outline Watermark ─────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
          {SECTIONS.map((section, index) => {
            const center = index * STEP;
            const isLast = index === N - 1;
            const wmFadeIn = Math.max(0, center - STEP * 0.4);
            const wmFadeOut = isLast ? 1.0 : Math.min(1, center + STEP * 0.55);
            const wmOpacity = useTransform(
              scrollYProgress,
              isLast ? [wmFadeIn, center, 1.0] : [wmFadeIn, center, wmFadeOut],
              isLast ? [0, 1, 1] : [0, 1, 0]
            );
            const wmScale = useTransform(scrollYProgress, [wmFadeIn, center, wmFadeOut], [0.94, 1, 1.06]);
            const wmLetterSpacing = useTransform(scrollYProgress, [wmFadeIn, center, wmFadeOut], ['0.02em', '0.22em', '0.44em']);

            return (
              <motion.div
                key={'wm-' + section.id}
                style={{
                  position: 'absolute',
                  top: '52%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: wmOpacity,
                  scale: wmScale,
                  letterSpacing: wmLetterSpacing,
                  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                  fontWeight: 400,
                  fontSize: 'clamp(110px, 20vw, 340px)',
                  lineHeight: 1,
                  // PURE OUTLINE — no fill, just stroke
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(255, 85, 25, 0.45)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                TECHVERSE
              </motion.div>
            );
          })}
        </div>

        {/* ── Horizontal scan line accent ───────────────────────────── */}
        {SECTIONS.map((section, index) => {
          const center = index * STEP;
          const fadeIn = Math.max(0, center - STEP * 0.3);
          const fadeOut = Math.min(1, center + STEP * 0.3);
          const lineOpacity = useTransform(scrollYProgress, [fadeIn, center, fadeOut], [0, 1, 0]);
          const lineScaleX = useTransform(scrollYProgress, [fadeIn, center, fadeOut], [0, 1, 0]);
          return (
            <motion.div
              key={'line-' + index}
              style={{
                position: 'absolute',
                bottom: '18%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,90,31,0.35) 30%, rgba(255,90,31,0.6) 50%, rgba(255,90,31,0.35) 70%, transparent 100%)',
                opacity: lineOpacity,
                scaleX: lineScaleX,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* ── 3D Canvas ──────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={2.0} color="#FFFFFF" />
            <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#FF5A1F" />
            <pointLight position={[0, 0, 5]} intensity={1.2} />

            <Suspense fallback={null}>
              <ModelDriver scrollProgress={scrollYProgress} />
              <ContactShadows position={[0, -2.2, 0]} opacity={0.5} scale={15} blur={2.5} far={4} />
              <Environment preset="city" environmentIntensity={0.8} />
            </Suspense>
          </Canvas>
        </div>

        {/* ── Foreground Text Overlays ───────────────────────── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {SECTIONS.map((section, index) => {
            const center = index * STEP;
            const isLast = index === N - 1;

            const txFadeIn = Math.max(0, center - STEP * 0.12);
            const txHoldEnd = isLast ? 1.0 : Math.min(1, center + STEP * 0.5);
            const txFadeOut = isLast ? 1.0 : Math.min(1, center + STEP * 0.65);

            // Container — controls overall fade + big slide
            const opacity = useTransform(
              scrollYProgress,
              isLast ? [txFadeIn, center, 1.0] : [txFadeIn, center, txHoldEnd, txFadeOut],
              isLast ? [0, 1, 1] : [0, 1, 1, 0]
            );
            const containerY = useTransform(
              scrollYProgress,
              isLast ? [txFadeIn, center, 1.0] : [txFadeIn, center, txHoldEnd, txFadeOut],
              isLast ? [80, 0, 0] : [80, 0, 0, -12]
            );

            // TAG — slides in from left, leads slightly before title
            const tagX = useTransform(
              scrollYProgress,
              [txFadeIn, Math.min(1, txFadeIn + STEP * 0.1)],
              [-32, 0]
            );
            const tagOpacity = useTransform(
              scrollYProgress,
              [txFadeIn, Math.min(1, txFadeIn + STEP * 0.12)],
              [0, 1]
            );

            // TITLE — slightly after tag, slides up
            const titleDelay = Math.min(1, txFadeIn + STEP * 0.06);
            const titleY = useTransform(
              scrollYProgress,
              [titleDelay, Math.min(1, titleDelay + STEP * 0.12)],
              [50, 0]
            );
            const titleOpacity = useTransform(
              scrollYProgress,
              [titleDelay, Math.min(1, titleDelay + STEP * 0.14)],
              [0, 1]
            );

            // DIVIDER — scales from 0 to 1 after title
            const divDelay = Math.min(1, txFadeIn + STEP * 0.13);
            const divScaleX = useTransform(
              scrollYProgress,
              [divDelay, Math.min(1, divDelay + STEP * 0.12)],
              [0, 1]
            );

            // BODY — last to appear, fades with slight upward drift
            const bodyDelay = Math.min(1, txFadeIn + STEP * 0.17);
            const bodyOpacity = useTransform(
              scrollYProgress,
              [bodyDelay, Math.min(1, bodyDelay + STEP * 0.14)],
              [0, 1]
            );
            const bodyY = useTransform(
              scrollYProgress,
              [bodyDelay, Math.min(1, bodyDelay + STEP * 0.14)],
              [20, 0]
            );

            // BUTTON — pops in last with scale
            const btnDelay = Math.min(1, txFadeIn + STEP * 0.22);
            const btnScale = useTransform(
              scrollYProgress,
              [btnDelay, Math.min(1, btnDelay + STEP * 0.10)],
              [0.85, 1]
            );
            const btnOpacity = useTransform(
              scrollYProgress,
              [btnDelay, Math.min(1, btnDelay + STEP * 0.12)],
              [0, 1]
            );

            const isCenter = section.align === 'center';
            const isRight = section.align === 'right';

            return (
              <motion.div
                key={'ui-' + section.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                  padding: '0 8vw',
                  height: '100%',
                  width: '100%',
                  pointerEvents: 'none',
                  opacity,
                  y: containerY,
                }}
              >
                <div style={{ maxWidth: '540px', textAlign: isCenter ? 'center' : 'left' }}>

                  {/* TAG — slides in from left */}
                  <motion.div style={{ x: tagX, opacity: tagOpacity }} >
                    <div style={{
                      color: '#FF5A1F',
                      letterSpacing: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      marginBottom: '16px',
                      fontFamily: "'Bebas Neue', sans-serif",
                      textTransform: 'uppercase',
                      textShadow: '0 2px 12px rgba(0,0,0,1)',
                    }}>
                      {section.tag}
                    </div>
                  </motion.div>

                  {/* TITLE — clipped reveal from below */}
                  <div style={{ overflow: 'hidden', marginBottom: '20px' }}>
                    <motion.h2 style={{ y: titleY, opacity: titleOpacity, margin: 0 }} >
                      <span style={{
                        display: 'block',
                        color: '#FFFFFF',
                        fontSize: 'clamp(60px, 8vw, 100px)',
                        fontWeight: 800,
                        lineHeight: 0.92,
                        fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 4px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.9)',
                      }}>
                        {section.title}
                      </span>
                    </motion.h2>
                  </div>

                  {/* DIVIDER — scales from origin */}
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: isRight ? 'flex-end' : isCenter ? 'center' : 'flex-start' }}>
                    <motion.div style={{ scaleX: divScaleX, transformOrigin: isRight ? 'right' : 'left' }}>
                      <div style={{
                        width: '52px', height: '2px',
                        background: 'linear-gradient(90deg, #FF5A1F, rgba(255,90,31,0.15))',
                        borderRadius: '2px',
                        boxShadow: '0 0 10px rgba(255,90,31,0.7)',
                      }} />
                    </motion.div>
                  </div>

                  {/* BODY — fades in with upward drift */}
                  <motion.p style={{ opacity: bodyOpacity, y: bodyY, margin: 0, marginBottom: section.btn ? '28px' : '0' }}>
                    <span style={{
                      display: 'block',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '15.5px',
                      lineHeight: 1.75,
                      fontWeight: 400,
                      fontFamily: "'Inter', 'Space Grotesk', sans-serif",
                      letterSpacing: '0.1px',
                      textShadow: '0 1px 8px rgba(0,0,0,1), 0 2px 20px rgba(0,0,0,0.9)',
                    }}>
                      {section.body}
                    </span>
                  </motion.p>

                  {/* BUTTON — pops in with scale */}
                  {section.btn && (
                    <motion.div style={{ scale: btnScale, opacity: btnOpacity, transformOrigin: isRight ? 'right' : 'left', pointerEvents: 'all' }}>
                      <a
                        href={section.btn.href}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '13px 32px',
                          background: 'linear-gradient(135deg, #FF5A1F 0%, #c93a00 100%)',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: '2.5px',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          borderRadius: '50px',
                          boxShadow: '0 0 36px rgba(255,90,31,0.5), 0 4px 20px rgba(0,0,0,0.9)',
                          cursor: 'pointer',
                        }}
                      >
                        {section.btn.label}
                        <span style={{ fontSize: '16px' }}>→</span>
                      </a>
                    </motion.div>
                  )}

                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LaptopScrollSection;

