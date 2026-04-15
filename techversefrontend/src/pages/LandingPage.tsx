// LandingPage.tsx  — LogiCraft-structure adapted for TechVerse
// Hero: full-bleed image + left dark overlay + search bar
// Then: numbered services | stats | marquee | how-we-work | promo banner | products | testimonials
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceStore } from '../stores/serviceStore';
import { useProductStore } from '../stores/productStore';

import { VaultPreloader } from '../components/VaultPreloader';
import Showcase3D from '../components/Showcase3D';
import LaptopScrollSection from '../components/LaptopScrollSection';
import { BackgroundPaths } from '../components/ui/background-paths';
import apiClient, { getImageUrl } from '../api';

import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionValueEvent } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import RouterIcon from '@mui/icons-material/Router';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LaptopIcon from '@mui/icons-material/Laptop';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

/* ── PALETTE ─────────────────────────────────────────────── */
const PAGE = '#F6F5F1';   // warm cream page bg
const WHITE = '#FFFFFF';
const NAVY = '#1C2B4A';   // primary dark accent
const ORANGE = '#E85D04';   // CTA orange (same warmth as LogiCraft blue but orange)
const DARK = '#0D1521';   // hero overlay / dark sections
const TEXT = '#111827';
const MUTED = '#6B7280';
const LIGHT = '#ECEAE5';   // alternating section bg
const BORDER = '#E5E3DE';

/* ── STATIC DATA ──────────────────────────────────────────── */

const HOW_STEPS = [
  { n: '01', title: 'Browse & Choose', desc: 'Pick from 500+ products and 10+ service categories.', emoji: '🛍️' },
  { n: '02', title: 'Book or Order', desc: 'Seamless booking for repairs or instant checkout for products.', emoji: '📋' },
  { n: '03', title: 'Expert Execution', desc: 'Certified technicians handle everything with precision.', emoji: '⚙️' },
  { n: '04', title: 'Deliver & Delight', desc: 'Receive your product or repaired device — fully tested.', emoji: '🚀' },
];

const REVIEWS = [
  { name: 'Amit Sharma', role: 'Gamer & Streamer', text: 'Techverse built my dream rig. Flawless execution and amazing support from start to finish.' },
  { name: 'Priya Menon', role: 'UI/UX Designer', text: 'My laptop was fixed in under 3 hours. Genuine parts, honest pricing — I won\'t go anywhere else.' },
  { name: 'Rajan Pillai', role: 'Software Engineer', text: 'The custom PC build advice was exceptional. They really know their hardware inside and out.' },
];

const MARKS = ['Gaming PCs', 'Laptop Repair', 'Components', 'Peripherals', 'Data Recovery', 'CCTV Install', 'Networking', 'Smart Home', 'Monitors', 'Custom Builds', 'Refurbished PCs', 'PC Accessories'];

/* ── ANIMATED COUNTER ────────────────────────────────────── */
function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start: number;
      const run = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1800, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setN(Math.floor(ease * to));
        if (p < 1) requestAnimationFrame(run);
        else setN(to);
      };
      requestAnimationFrame(run);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return (
    <div ref={ref} style={{ fontFamily: 'Poppins,Manrope,sans-serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: NAVY, letterSpacing: '-0.04em', lineHeight: 1 }}>
      {to >= 1000 ? (n / 1000).toFixed(0) + 'K' : n}{suffix}
    </div>
  );
}

/* ── SCROLL REVEAL ───────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, v };
}
function rev(v: boolean, d = 0): React.CSSProperties {
  return { opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(48px)', transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${d}s, transform .9s cubic-bezier(.16,1,.3,1) ${d}s` };
}

/* Strips Docker-internal hostnames from image URLs so they load in the browser */
function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  // If it's an absolute URL with the Docker internal port (e.g. http://backend:8000/media/...), extract only the /media/... path
  try {
    const parsed = new URL(url);
    if (parsed.port === '8000' || !parsed.hostname.includes('.')) {
      return parsed.pathname + parsed.search; // returns /media/...
    }
  } catch {
    // Not a valid absolute URL — assume it's already a relative path
  }
  return url;
}

/* ───────────────────────────────────────────────────────
   MOUSE SCROLLYTELLING — Canvas-based scroll-linked image sequence
   240 frames: mouse explodes → floating parts → reassembles
─────────────────────────────────────────────────────── */
const TOTAL_FRAMES = 240;
const FRAME_DIR = '/mouse_frames_webp';

function padFrame(n: number) {
  return String(n).padStart(3, '0');
}

const COPY_BEATS = [
  { from: 0, to: 0.12, headline: 'Engineered to Perfection.', sub: 'Every component hand-selected for feel, speed, and longevity.' },
  { from: 0.18, to: 0.35, headline: '7 Independent Layers.', sub: 'Optical sensor, PCB, scroll encoder, side buttons — each isolated for zero interference.' },
  { from: 0.40, to: 0.58, headline: 'Physics at 8000 DPI.', sub: 'A sensor that reads 8,000 position samples per second. Precision so accurate, it feels like thought.' },
  { from: 0.62, to: 0.80, headline: 'Rebuilt. For You.', sub: 'Every part reassembled by hand. Tested at 20 million clicks before it reaches yours.' },
  { from: 0.85, to: 1.00, headline: 'The TechVerse Standard.', sub: "We never sell a product we wouldn't hand to our own engineers." },
];

// Hoisted out of React lifecycle! Preserves ~50MB of decoded RAM across route changes instantly.
const GLOBAL_BITMAP_CACHE = new Array(TOTAL_FRAMES).fill(null);
let GLOBAL_DECODED_COUNT = 0;

function MouseScrollytelling() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bind to global cache!
  const bitmaps = useRef<(ImageBitmap | null)[]>(GLOBAL_BITMAP_CACHE);
  const drawCache = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const rafId = useRef<number>(0);
  const pendingIdx = useRef<number>(0);
  const currentIdx = useRef<number>(-1);
  const ready = useRef(false);
  const loadStarted = useRef(false);

  const [loadProgress, setLoadProgress] = useState(
    Math.round((GLOBAL_DECODED_COUNT / TOTAL_FRAMES) * 100)
  );
  const [beat, setBeat] = useState<typeof COPY_BEATS[0] | null>(COPY_BEATS[0]);
  const [beatVisible, setBeatVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // On mobile, the animation trigger must wait until the card actually sits cleanly under the fixed navbar
    // instead of firing immediately when the hidden top edge reaches the absolute top of the screen.
    offset: isMobile ? ['start 12vh', 'end end'] : ['start start', 'end end'],
  });

  // ── Size canvas once; cache geometry ─────────────────────────────
  function sizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Cap DPR at 1.5 — above that, the visual gain is imperceptible but memory doubles
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    if (cw === 0 || ch === 0) return;

    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    const ctx = canvas.getContext('2d', { alpha: false })!; // alpha:false = faster compositing
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Find first available bitmap to calculate geometry
    const firstBm = bitmaps.current.find(b => b !== null);
    if (firstBm) {
      const bw = firstBm.width;
      const bh = firstBm.height;
      // Use constrained scaling with a slight zoom (1.2x)
      // Since the raw image mouse is positioned at the bottom, we anchor the drawing to the bottom
      const scale = Math.min(cw / bw, ch / bh) * 1.25;
      drawCache.current = {
        x: (cw - bw * scale) / 2,     // center horizontally
        y: ch - (bh * scale) * 0.95,  // anchor to bottom
        w: bw * scale,
        h: bh * scale,
      };
    }
  }

  // ── Fast draw — single drawImage call, no layout read ────────────
  function renderFrame(idx: number) {
    const canvas = canvasRef.current;

    // Fallback to highest loaded frame if exact scroll index isn't decoded yet (progressive enhancement)
    let safeIdx = idx;
    while (safeIdx >= 0 && !bitmaps.current[safeIdx]) {
      safeIdx--;
    }

    const bm = bitmaps.current[safeIdx];
    const geo = drawCache.current;
    if (!canvas || !bm || !geo) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.drawImage(bm, geo.x, geo.y, geo.w, geo.h);
  }

  // ── rAF render loop — decoupled from scroll events ───────────────
  function scheduleRender(idx: number) {
    pendingIdx.current = idx;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (pendingIdx.current !== currentIdx.current) {
        renderFrame(pendingIdx.current);
        currentIdx.current = pendingIdx.current;
      }
    });
  }

  // ── Progressive Preload Pipeline — deferred until section near viewport ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // IntersectionObserver: only start loading when section is 200px from viewport
    const startLoading = () => {
      if (loadStarted.current) return;
      loadStarted.current = true;

      // INSTANT CACHE HIT: If already decoded in a previous session, skip fetch entirely!
      if (GLOBAL_DECODED_COUNT >= TOTAL_FRAMES) {
        setLoadProgress(100);
        ready.current = true;
        sizeCanvas();
        renderFrame(currentIdx.current > -1 ? currentIdx.current : 0);
        return;
      }

      setLoadProgress(Math.round((GLOBAL_DECODED_COUNT / TOTAL_FRAMES) * 100));
      const total = TOTAL_FRAMES;
      let nextIdxToQueue = GLOBAL_DECODED_COUNT;
      // 45 concurrent workers — fills pipe faster, modern browsers handle 6+ parallel fetches
      const WORKERS = 45;
      let isMounted = true;

      const decodeNext = async () => {
        if (!isMounted || nextIdxToQueue >= total) return;
        const i = nextIdxToQueue++;
        try {
          const res = await fetch(`${FRAME_DIR}/ezgif-frame-${padFrame(i + 1)}.webp`, { cache: 'force-cache' });
          const blob = await res.blob();
          // premultiplyAlpha:'none' skips alpha premultiplication — faster decode for opaque JPEGs
          bitmaps.current[i] = await createImageBitmap(blob, { premultiplyAlpha: 'none', resizeQuality: 'medium' });

          if (!ready.current) {
            ready.current = true;
            sizeCanvas();
          }

          if (currentIdx.current === i || (i === 0 && currentIdx.current <= 0)) {
            renderFrame(i);
            if (currentIdx.current < 0) currentIdx.current = 0;
          }
        } catch { /* Suppress broken frame errors */ }

        GLOBAL_DECODED_COUNT++;
        // Dispatch a global event so the VaultPreloader can track the progress remotely!
        const percentage = Math.round((GLOBAL_DECODED_COUNT / total) * 100);
        setLoadProgress(percentage);
        window.dispatchEvent(new CustomEvent('mouse-scroll-progress', { detail: { progress: percentage } }));

        if (GLOBAL_DECODED_COUNT === total) { }
        decodeNext();
      };

      for (let k = 0; k < WORKERS; k++) decodeNext();

      const ro = new ResizeObserver(() => { sizeCanvas(); renderFrame(currentIdx.current); });
      if (canvasRef.current) ro.observe(canvasRef.current);

      return () => {
        isMounted = false;
        ro.disconnect();
        cancelAnimationFrame(rafId.current);
      };
    };

    // Start loading immediately if already in viewport, else wait until 300px away
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        startLoading();
        io.disconnect();
      }
    }, { rootMargin: '300px' });
    io.observe(section);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // ── Map scroll → frame index via rAF ─────────────────────────────
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const idx = Math.min(Math.floor(progress * TOTAL_FRAMES), TOTAL_FRAMES - 1);
    if (ready.current) scheduleRender(idx);

    const activeBeat = COPY_BEATS.find(b => progress >= b.from && progress <= b.to) ?? null;
    setBeat(activeBeat);
    setBeatVisible(!!activeBeat);
  });

  const beatIndex = beat ? COPY_BEATS.indexOf(beat) : -1;

  return (
    <div style={{ padding: '0 2vw 4vw 2vw', background: PAGE }}>
      <section
        ref={sectionRef}
        style={{
          position: 'relative',
          height: '2800px', // Extended timeline so animation and text beats read slowly and naturally
        }}
      >
        {/* ── Floating Sticky Viewport Card ── */}
        <div className="scrolly-card" style={{
          position: 'sticky',
          top: isMobile ? '12vh' : '10vh',     // Push lower on mobile to comfortably clear the fixed Navigation bar
          height: isMobile ? '90vh' : '80vh',  // Give more vertical room on mobile
          background: '#0B0E14',
          borderRadius: isMobile ? '24px' : '32px',
          overflow: 'hidden',
          boxShadow: '0 20px 80px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row', // Stack instead of slice on mobile
          alignItems: isMobile ? 'stretch' : 'center', // Fix Desktop regression
          padding: isMobile ? '0px' : '0 5vw', // Zero padding on mobile to maximize edge-to-edge mouse size
          gap: isMobile ? '24px' : '3vw',
        }}>

          {/* ── Premium Tech Grid & Orbs Background ── */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
            backgroundSize: '80px 80px',
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`
          }} />
          <div style={{ position: 'absolute', top: '10vh', left: '-5vw', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,93,4,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10vh', right: '-10vw', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,44,79,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />


          {/* ── LEFT/TOP: Canvas Region ── */}
          <div className="scrolly-canvas" style={{
            flex: isMobile ? '0 0 45%' : '0 0 48%', // Fixed height proportion
            height: isMobile ? '45%' : '56vh',
            width: isMobile ? '100%' : undefined, // Fix desktop regression
            borderRadius: isMobile ? '0px' : '28px', // Straight edges on mobile so it seamlessly touches the card borders
            overflow: 'hidden',
            background: '#000000', // Matches the raw jpeg exactly
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            position: 'relative',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Subtle inner shadows to blend the sharp boundaries of the image frame */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 100%)', pointerEvents: 'none' }} />

            {/* Loading bar overlay removed for seamless background loading */}

            {/* Frame badge */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, display: 'block', boxShadow: `0 0 6px ${ORANGE}`, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'monospace' }}>Live Disassembly</span>
            </div>
          </div>

          {/* ── RIGHT/BOTTOM: Animated copy panel ── */}
          <div className="scrolly-text" style={{
            flex: 1,
            width: isMobile ? '100%' : undefined, // Fix desktop regression
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isMobile ? '0 24px 24px' : '0 2vw 0 1vw', // Safely pad the interior since the container wrapper has 0 padding on mobile now
            position: 'relative',
          }}>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 12 : 36 }}>
              <div style={{ width: 28, height: 2, background: ORANGE, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Inside the Machine
              </span>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 20 : 40 }}>
              {COPY_BEATS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === beatIndex ? 24 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === beatIndex ? ORANGE : 'rgba(0,0,0,0.15)',
                    transition: 'all 0.4s cubic-bezier(.16,1,.3,1)',
                  }}
                />
              ))}
            </div>

            {/* Animated text — fades and slides per beat */}
            <div style={{ position: 'relative', minHeight: 220, overflow: 'hidden' }}>
              {COPY_BEATS.map((b, i) => (
                <div
                  key={i}
                  style={{
                    position: i === 0 ? 'relative' : 'absolute',
                    top: 0, left: 0, width: '100%',
                    opacity: beatIndex === i ? 1 : 0,
                    transform: `translateY(${beatIndex === i ? '0px' : beatIndex > i ? '-24px' : '24px'})`,
                    transition: 'opacity 0.55s cubic-bezier(.16,1,.3,1), transform 0.55s cubic-bezier(.16,1,.3,1)',
                    pointerEvents: beatIndex === i ? 'auto' : 'none',
                  }}
                >
                  {/* Step number */}
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: ORANGE,
                    letterSpacing: '0.1em',
                    display: 'block',
                    marginBottom: 18,
                    opacity: 0.8,
                  }}>
                    {String(i + 1).padStart(2, '0')} / {String(COPY_BEATS.length).padStart(2, '0')}
                  </span>

                  {/* Headline */}
                  <h2 className="scrolly-headline" style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 900,
                    fontSize: isMobile ? '28px' : 'clamp(28px, 3.2vw, 52px)',
                    color: WHITE, // Inverted for dark mode
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    marginBottom: isMobile ? 12 : 20,
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}>
                    {b.headline}
                  </h2>

                  {/* Divider */}
                  <div style={{ width: 48, height: 3, background: `linear-gradient(90deg, ${ORANGE}, rgba(232,93,4,0.2))`, borderRadius: 2, marginBottom: isMobile ? 12 : 20 }} />

                  {/* Sub copy */}
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 'clamp(14px, 1.1vw, 18px)',
                    color: 'rgba(255,255,255,0.65)', // Inverted for dark mode
                    lineHeight: 1.8,
                    fontWeight: 400,
                    maxWidth: 400,
                  }}>
                    {b.sub}
                  </p>
                </div>
              ))}

              {/* "Scroll to explore" shown when no beat is active */}
              {beatIndex === -1 && (
                <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 1, height: 32, background: WHITE }} />
                  <span style={{ fontSize: 12, color: WHITE, fontWeight: 600, letterSpacing: '0.06em' }}>Scroll to explore</span>
                </div>
              )}
            </div>

            {/* Scroll progress track */}
            <div style={{ marginTop: isMobile ? 24 : 48, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${ORANGE}, rgba(232,93,4,0.3))`,
                  borderRadius: 2,
                  scaleX: scrollYProgress,
                  transformOrigin: 'left',
                }} />
              </div>
              <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {beatIndex >= 0 ? beatIndex + 1 : 0} of {COPY_BEATS.length}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HolographicCategoryCard({ cat, index, isTrending, navigate, isMobile }: any) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [0, 1], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [0, 1], ["-25deg", "25deg"]);
  const glareX = useTransform(mouseXSpring, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // If mobile, ignore the heavy 3D hover physics for better performance/ux
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    x.set(0.5);
    y.set(0.5);
  };

  let IconMatch = ComputerIcon;
  const lname = (cat.name || '').toLowerCase();
  if (lname.includes('audio') || lname.includes('headphone')) IconMatch = HeadphonesIcon;
  else if (lname.includes('phone') || lname.includes('tablet')) IconMatch = PhoneAndroidIcon;
  else if (lname.includes('laptop')) IconMatch = LaptopIcon;
  else if (lname.includes('camera') || lname.includes('cctv')) IconMatch = CameraAltIcon;
  else if (lname.includes('network') || lname.includes('router')) IconMatch = RouterIcon;
  else if (lname.includes('storage') || lname.includes('drive')) IconMatch = StorageIcon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '20px', flexShrink: 0, margin: isMobile ? '10px 0' : '20px 0' }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/store?category=${encodeURIComponent(cat.name)}`)}
        style={{
          perspective: 1200,
          /* Normalize mobile widths and heights so no single card monopolizes the screen */
          width: isMobile ? '160px' : (isTrending ? '400px' : '300px'),
          height: isMobile ? '180px' : '340px',
          cursor: 'pointer'
        }}
      >
        <motion.div
          style={{
            width: '100%', height: '100%',
            rotateX: isMobile ? 0 : rotateX, rotateY: isMobile ? 0 : rotateY, transformStyle: "preserve-3d", position: "relative",
            borderRadius: isMobile ? "20px" : "32px",
            background: isTrending ? `linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(255,90,31,0.02) 100%)` : `rgba(255,255,255,0.02)`,
            border: '2px solid rgba(0,0,0,0.1)',
            backdropFilter: 'blur(30px)',
            boxShadow: isTrending ? `0 30px 60px rgba(13,21,33,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(255,90,31,0.1)` : `0 20px 40px rgba(0,0,0,0.1)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden',
            zIndex: isTrending ? 10 : 1
          }}
        >
          {isTrending && <motion.div style={{ position: 'absolute', inset: 0, opacity: 0.9, background: `radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`, '--gx': glareX, '--gy': glareY, pointerEvents: 'none' } as any} />}
          {!isTrending && <motion.div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: `radial-gradient(circle at var(--gx) var(--gy), rgba(0,0,0,0.1) 0%, rgba(255,255,255,0) 50%)`, '--gx': glareX, '--gy': glareY, pointerEvents: 'none' } as any} />}

          <div style={{ transform: isMobile ? "none" : "translateZ(60px)", width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {cat.top_image ? (
              <img src={sanitizeImageUrl(cat.top_image)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', mixBlendMode: 'multiply' }} />
            ) : (
              <div style={{ width: isMobile ? '50px' : '80px', height: isMobile ? '50px' : '80px', borderRadius: isMobile ? '16px' : '24px', background: isTrending ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: isTrending ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isTrending ? '0 10px 20px rgba(0,0,0,0.3)' : 'none' }}>
                <IconMatch sx={{ color: isTrending ? WHITE : ORANGE, fontSize: isMobile ? '24px' : '40px' }} />
              </div>
            )}

            {isTrending && (
              <motion.div
                initial={{ opacity: 0.8, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1.05 }}
                transition={{ repeat: Infinity, direction: 'alternate', duration: 1.5, ease: "easeInOut" }}
                style={{ position: 'absolute', top: isMobile ? 12 : 20, right: isMobile ? 12 : 20, background: 'linear-gradient(90deg, #FF5A1F, #FF8C00)', padding: isMobile ? '4px 8px' : '8px 16px', borderRadius: '100px', color: WHITE, fontSize: isMobile ? '9px' : '12px', fontWeight: 900, letterSpacing: '0.06em', boxShadow: '0 8px 24px rgba(255,90,31,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                #1 TRENDING
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', color: TEXT, fontSize: isMobile ? (isTrending ? '15px' : '13px') : (isTrending ? '28px' : '20px'), fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {cat.name}
        </h3>
        {cat.recent_sales > 0 && isTrending && (
          <div style={{ color: ORANGE, fontSize: isMobile ? '10px' : '14px', marginTop: '6px', fontWeight: 700, letterSpacing: '0.02em' }}>
            {cat.recent_sales} units initialized
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const {
    loading: storeLoading,
    error: storeError,
    trendingCategories: productTrendingCategories,
    fetchTrendingCategories: fetchProductTrendingCategories
  } = useProductStore();

  const {
    categories: serviceCategories,
    trendingCategories,
    fetchTrendingCategories,
    fetchCategories,
    loading: svcLoading,
    error: svcError
  } = useServiceStore();

  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [prodCats, setProdCats] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const catScrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const scrollLoop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      accumulatedTime += deltaTime;

      // Only push a pixel roughly every 30ms to maintain consistent speed
      // across 60Hz, 120Hz, and 144Hz monitors, without jitter.
      if (accumulatedTime > 30) {
        if (catScrollRef.current && catScrollRef.current.dataset.paused !== "true") {
          catScrollRef.current.scrollLeft += 1;
          if (catScrollRef.current.scrollLeft >= catScrollRef.current.scrollWidth - catScrollRef.current.clientWidth) {
            catScrollRef.current.scrollLeft = 0;
          }
        }
        accumulatedTime = 0;
      }

      if (isAutoScrolling) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    if (isAutoScrolling && !isMobile) {
      animationFrameId = requestAnimationFrame(scrollLoop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => {
    fetchTrendingCategories();
    fetchProductTrendingCategories();
    Promise.all([
      apiClient.get('/api/products/').catch(() => ({ data: [] })),
      apiClient.get('/api/categories/').catch(() => ({ data: [] })),
    ]).then(([pr, cr]) => {
      const prods = Array.isArray(pr.data) ? pr.data : (pr.data?.results ?? []);
      const cats = Array.isArray(cr.data) ? cr.data : (cr.data?.results ?? []);
      setProducts(prods);
      setProdCats(cats);
    });
  }, []);

  const svcs = serviceCategories.slice(0, 6);
  const cats = prodCats.slice(0, 10);
  const featProds = products.slice(0, 6);

  const s1 = useReveal();
  const s2 = useReveal();
  const s3 = useReveal();
  const s4 = useReveal();
  const s5 = useReveal();
  const s6 = useReveal();

  const handleSearch = () => {
    if (search.trim()) navigate(`/store?search=${encodeURIComponent(search)}`);
    else navigate('/store');
  };

  return (
    <>
      <VaultPreloader />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${PAGE}; font-family: 'Poppins', 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${NAVY}; border-radius: 3px; }

        /* ── Keyframes ── */
        @keyframes marquee-left  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes marquee-right { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        @keyframes hero-scale    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes bounce-in     { 0%{opacity:0;transform:translateY(24px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes slide-up      { 0%{opacity:0;transform:translateY(40px)} 100%{opacity:1;transform:translateY(0)} }

        .track-l { animation: marquee-left  28s linear infinite; display:inline-flex; gap:48px; white-space:nowrap; width:max-content; }
        .track-r { animation: marquee-right 24s linear infinite; display:inline-flex; gap:48px; white-space:nowrap; width:max-content; }
        .track-l:hover, .track-r:hover { animation-play-state: paused; }

        /* ══ HERO CARD — the rounded rectangle (LogiCraft key feature) ══ */
        .hero-card {
          position: relative;
          width: calc(100% - 48px);
          margin: 0 24px;
          border-radius: 28px;
          overflow: hidden;
          min-height: 72vh;
          display: flex;
          align-items: center;
        }
        @media(max-width: 900px) {
          .hero-card { 
            min-height: 0 !important; 
            width: calc(100% - 24px) !important;
            margin: 0 12px !important;
          }
        }
        .hero-bg-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center 25%;
          animation: hero-scale 16s ease-in-out infinite;
        }
        /* Gradient: heavy dark on left, fades out to the right — exactly like LogiCraft */
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            100deg,
            rgba(5,10,20,0.92) 0%,
            rgba(5,10,20,0.80) 30%,
            rgba(5,10,20,0.45) 55%,
            rgba(5,10,20,0.12) 75%,
            rgba(5,10,20,0.0)  100%
          );
        }
        /* Floating white search card — bottom-left, partially overlapping hero */
        .hero-search-card {
          position: absolute;
          bottom: -1px;
          left: 48px;
          background: ${WHITE};
          border-radius: 20px 20px 0 0;
          padding: 20px 24px 24px;
          width: 380px;
          box-shadow: 0 -4px 40px rgba(0,0,0,0.12);
          animation: slide-up 1.2s .5s both;
        }
        .hero-search-input {
          display: flex;
          align-items: center;
          gap: 0;
          background: ${PAGE};
          border-radius: 10px;
          overflow: hidden;
          margin-top: 12px;
        }
        .hero-search-input input {
          flex: 1; border: none; outline: none;
          padding: 13px 16px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          background: transparent;
          color: ${TEXT};
        }
        .hero-search-input button {
          background: ${ORANGE}; border: none; cursor: pointer;
          padding: 0 18px; height: 46px; color: ${WHITE};
          display: flex; align-items: center; gap: 6px;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px;
          white-space: nowrap;
          transition: background .25s;
          border-radius: 0 8px 8px 0;
        }
        .hero-search-input button:hover { background: #c94d00; }

        /* ── Buttons ── */
        .btn-primary {
          background: ${ORANGE}; color: ${WHITE};
          padding: 14px 32px; border-radius: 8px;
          border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all .3s cubic-bezier(.16,1,.3,1);
        }
        .btn-primary:hover { background: #c94d00; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(232,93,4,.35); }

        .btn-navy {
          background: ${NAVY}; color: ${WHITE};
          padding: 14px 32px; border-radius: 8px;
          border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all .3s cubic-bezier(.16,1,.3,1);
        }
        .btn-navy:hover { background: #0f1d36; transform: translateY(-3px); box-shadow: 0 12px 32px rgba(28,43,74,.35); }

        .btn-outline {
          background: transparent; color: ${NAVY};
          padding: 13px 28px; border-radius: 8px;
          border: 2px solid ${NAVY}; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all .3s ease;
        }
        .btn-outline:hover { background: ${NAVY}; color: ${WHITE}; }

        /* ═══ BENTO GRID CARDS ═══ */
        .bento-hero {
          border-radius: 24px; cursor: pointer;
          padding: 36px 36px 32px; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #0C1A30 0%, #1B2D4A 50%, #0C1A30 100%);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all .5s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 8px 32px rgba(12,26,48,0.25);
        }
        .bento-hero:hover {
          transform: translateY(-4px); box-shadow: 0 20px 50px rgba(12,26,48,0.35);
          border-color: rgba(255,90,31,0.3);
        }
        .bento-hero::after {
          content: ''; position: absolute; top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: conic-gradient(from 0deg, transparent, rgba(255,90,31,0.06), transparent, transparent);
          animation: bento-spin 8s linear infinite;
        }
        @keyframes bento-spin { 100% { transform: rotate(360deg); } }
        .bento-cell {
          border-radius: 20px; cursor: pointer;
          padding: 24px 22px; position: relative; overflow: hidden;
          background: ${WHITE};
          border: 1px solid ${BORDER};
          transition: all .4s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 2px 8px rgba(28,43,74,0.05);
          display: flex; flex-direction: column; justify-content: space-between;
          min-height: 140px;
        }
        .bento-cell::before {
          content: ''; position: absolute; bottom:0; left:0; right:0; height: 3px;
          background: linear-gradient(90deg, ${ORANGE}, #FF8C00);
          transform: scaleX(0); transform-origin: left;
          transition: transform .4s ease;
        }
        .bento-cell:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(28,43,74,0.1); border-color: rgba(255,140,0,0.25); }
        .bento-cell:hover::before { transform: scaleX(1); }
        /* heat bar */
        .heat-bar { height:3px; border-radius:2px; background:${BORDER}; overflow:hidden; }
        .heat-fill { height:100%; border-radius:2px; background: linear-gradient(90deg, ${ORANGE}, #FF8C00); transition: width .8s ease; }
        /* live dot */
        .live-dot {
          display: inline-block; width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34,197,94,0.5);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        /* ═══ TERMINAL ═══ */
        .term-window {
          background: #0D0D0D;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
          font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
        }
        .term-bar {
          display: flex; align-items: center; gap: 7px;
          padding: 12px 16px;
          background: #1A1A1A;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .term-dot { width:11px; height:11px; border-radius:50%; }
        .term-body {
          padding: 20px 18px;
          font-size: 13px;
          line-height: 2;
          color: rgba(255,255,255,0.5);
          min-height: 250px;
        }
        .term-line {
          opacity: 0;
          animation: term-in .3s ease forwards;
        }
        .term-line:nth-child(1) { animation-delay: 0.4s; }
        .term-line:nth-child(2) { animation-delay: 1.2s; }
        .term-line:nth-child(3) { animation-delay: 2.0s; }
        .term-line:nth-child(4) { animation-delay: 2.8s; }
        .term-line:nth-child(5) { animation-delay: 3.6s; }
        .term-line:nth-child(6) { animation-delay: 4.4s; }
        .term-line:nth-child(7) { animation-delay: 5.0s; }
        .term-line:nth-child(8) { animation-delay: 5.6s; }
        @keyframes term-in {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .term-cursor {
          display: inline-block; width: 8px; height: 16px;
          background: #22c55e;
          animation: blink-cursor 1s step-end infinite;
          vertical-align: middle; margin-left: 4px;
        }
        @keyframes blink-cursor { 50% { opacity: 0; } }

        /* ── Stats card ── */
        .stat-card {
          background: ${WHITE}; border-radius: 16px;
          padding: 36px 28px; text-align: center;
          border: 1px solid ${BORDER};
          transition: all .35s cubic-bezier(.16,1,.3,1);
        }
        .stat-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(28,43,74,0.08); }

        /* ── Product card ── */
        .prod-card {
          background: ${WHITE}; border-radius: 16px;
          overflow: hidden; cursor: pointer;
          border: 1px solid ${BORDER};
          transition: all .35s cubic-bezier(.16,1,.3,1);
        }
        .prod-card:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(28,43,74,0.1); border-color: rgba(28,43,74,0.2); }
        .prod-card .prod-img { transition: transform .5s ease; display:block; }
        .prod-card:hover .prod-img { transform: scale(1.06); }

        /* ── Review card ── */
        .rev-card {
          background: ${WHITE}; border-radius: 16px; padding: 28px;
          border: 1px solid ${BORDER};
          transition: all .35s ease;
        }
        .rev-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(28,43,74,0.08); }

        /* ── How-step card ── */
        .step-card {
          background: ${WHITE}; border-radius: 16px; padding: 28px;
          border: 1px solid ${BORDER};
          transition: all .35s cubic-bezier(.16,1,.3,1);
          position: relative; overflow: hidden;
        }
        .step-card::before {
          content: ''; position: absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg, ${NAVY}, ${ORANGE});
          transform: scaleX(0); transform-origin: left;
          transition: transform .4s ease;
        }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(28,43,74,0.1); }
        .step-card:hover::before { transform: scaleX(1); }

        /* ── Cat pill ── */
        .cat-chip {
          background: ${WHITE}; border: 1px solid ${BORDER};
          border-radius: 100px; padding: 10px 20px;
          cursor: pointer; font-size: 13px; font-weight: 600; color: ${TEXT};
          transition: all .3s ease;
          white-space: nowrap;
        }
        .cat-chip:hover { background: ${NAVY}; color: ${WHITE}; border-color: ${NAVY}; transform: translateY(-2px); }

        @media(max-width:900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .svc-grid  { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
          .step-grid { grid-template-columns: 1fr 1fr !important; }
          .prod-grid { grid-template-columns: 1fr 1fr !important; }
          .rev-grid  { grid-template-columns: 1fr !important; }
        }
        @media(max-width:600px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
          .step-grid { grid-template-columns: 1fr !important; }
          .prod-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════
          §1  HERO — LogiCraft exact structure:
              • White page BG visible AROUND the hero card
              • Hero is a ROUNDED RECTANGLE (28px border-radius)
              • Inside: full-bleed image + left dark-to-transparent gradient
              • TECHVERSE brand + headline over the dark side
              • Floating WHITE search card at bottom-left (partially overlaps)
      ════════════════════════════════════════════════════════ */}
      <div style={{ background: PAGE, paddingTop: 88, paddingBottom: 0 }}>
        {/* Hero card: min-height:72vh from CSS class overrides everything — we MUST override it inline */}
        <div
          className="hero-card"
          style={{
            overflow: 'hidden',
            borderRadius: isMobile ? 20 : 28,
            position: 'relative',
            backgroundColor: '#050A14',
            transform: 'translateZ(0)',
            margin: isMobile ? '0 12px' : undefined,
            /* Inline minHeight beats the .hero-card { min-height: 72vh } CSS rule */
            minHeight: isMobile ? 0 : undefined,
          }}
        >
          <BackgroundPaths>
            {/* Dark semi-transparent overlay to support content */}
            <div className="hero-overlay" style={{ position: 'absolute', inset: 0, zIndex: 1, background: isMobile ? 'linear-gradient(280deg, rgba(5,10,20,0.7) 0%, rgba(5,10,20,0.3) 40%, rgba(5,10,20,0.0) 100%)' : 'linear-gradient(280deg, rgba(5,10,20,0.92) 0%, rgba(5,10,20,0.60) 40%, rgba(5,10,20,0.3) 100%)' }} />

            {/* HERO SPLIT LAYOUT — text left, 3D floats right on ALL sizes */}
            <div
              style={{
                position: 'relative', zIndex: 3, width: '100%',
                display: 'flex', alignItems: 'center',
                overflow: 'hidden',
                minHeight: isMobile ? 'auto' : '650px',
              }}
            >

              {/* ── LEFT: CREATIVE TEXT ── */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 20,
                  pointerEvents: 'auto',
                  flex: 'none',
                  width: isMobile ? '65%' : '50%',
                  minWidth: isMobile ? 'auto' : '400px',
                  padding: isMobile ? '30px 0 30px 16px' : '40px 40px 40px 6vw',
                  textAlign: 'left',
                }}
              >
                <div style={{ animation: 'bounce-in 1.2s .4s ease both' }}>
                  {/* Label */}
                  <span style={{
                    fontSize: isMobile ? 9 : 13, fontWeight: 700, letterSpacing: '0.2em',
                    color: ORANGE, textTransform: 'uppercase', marginBottom: isMobile ? 8 : 16,
                    display: 'inline-block', borderBottom: `2px solid ${ORANGE}`, paddingBottom: 3,
                  }}>
                    The Next Dimension
                  </span>

                  {/* Main headline */}
                  <h1 style={{
                    fontFamily: 'Poppins, sans-serif', fontWeight: 900,
                    fontSize: isMobile ? 'clamp(22px, 6.5vw, 36px)' : 'clamp(46px, 6vw, 84px)',
                    color: WHITE, lineHeight: 1.0, letterSpacing: '-0.02em',
                    marginBottom: isMobile ? 10 : 24,
                    marginTop: isMobile ? 6 : 12,
                  }}>
                    Unleash<br />
                    <span style={{ color: 'transparent', WebkitTextStroke: isMobile ? '1.5px rgba(255,255,255,0.85)' : '2px rgba(255,255,255,0.85)', WebkitTextFillColor: 'transparent', position: 'relative' }}>
                      Ultimate
                      <span style={{ position: 'absolute', left: 0, color: ORANGE, opacity: 0.1, WebkitTextStroke: 'none', filter: 'blur(12px)' }}>Ultimate</span>
                    </span>
                    <br />Performance.
                  </h1>

                  {/* Description paragraph — Hidden on mobile to match the provided screenshot compact layout */}
                  <p style={{
                    fontSize: 'clamp(14px, 1.5vw, 17px)',
                    color: 'rgba(255,255,255,0.7)', lineHeight: 1.7,
                    maxWidth: 480,
                    fontWeight: 300,
                    marginBottom: 44,
                    animation: 'bounce-in 1.2s .6s ease both',
                    display: isMobile ? 'none' : 'block',
                  }}>
                    Interact with the future. Premium hardware seamlessly rendered in breathtaking 3D. Precision engineering meets cutting-edge retail experience. Drag to explore.
                  </p>
                  <div style={{
                    position: 'relative', zIndex: 30, pointerEvents: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 8 : 16,
                    animation: 'bounce-in 1.2s .8s ease both',
                    /* Shrink the button wrap width on mobile to make them less violently long */
                    width: isMobile ? '80%' : 'auto',
                    alignItems: 'stretch',
                  }}>
                    <button
                      className="btn-primary hover-btn"
                      style={{
                        padding: isMobile ? '10px 14px' : '16px 36px',
                        fontSize: isMobile ? 11 : 15,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                      onClick={() => navigate('/store')}
                    >
                      Explore Masterpieces <ArrowForwardIcon sx={{ ml: 0.5, fontSize: isMobile ? 13 : 18 }} />
                    </button>
                    <button
                      className="btn-outline hover-btn"
                      style={{
                        borderColor: 'rgba(255,255,255,0.3)', color: WHITE,
                        padding: isMobile ? '10px 14px' : '16px 36px',
                        fontSize: isMobile ? 11 : 15,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                      onClick={() => navigate('/services')}
                    >
                      View Services <ArrowForwardIcon sx={{ ml: 0.5, fontSize: isMobile ? 13 : 18 }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: 3D MODEL ──
                  Mobile: absolute so it doesn't affect document flow height.
                  Desktop: relative flex child so it takes up 50% of the flex row.
              */}
              <div
                style={{
                  position: isMobile ? 'absolute' : 'relative',
                  /* Push to the top of the card rather than centering it vertically */
                  top: isMobile ? '0%' : undefined,
                  right: isMobile ? '-5%' : undefined,
                  /* Shift the entire canvas structurally to the right on mobile */
                  transform: isMobile ? 'translateX(12%)' : undefined,
                  flex: isMobile ? 'none' : '1 1 50%',
                  /* Bigger on mobile — more model visible */
                  width: isMobile ? '100%' : undefined,
                  minWidth: isMobile ? 'auto' : '400px',
                  height: isMobile ? '400px' : '650px',
                  zIndex: 0,
                  pointerEvents: isMobile ? 'none' : 'auto',
                  background: 'transparent',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, animation: 'slide-up 1.2s .2s both', background: 'transparent' }}>
                  <Showcase3D isMobile={isMobile} />
                </div>
              </div>

            </div>
          </BackgroundPaths>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          §2  TRENDING SERVICES — Bento Grid + CLI Terminal
      ════════════════════════════════════════════════════════ */}
      <section ref={s1.ref} style={{ background: PAGE, padding: isMobile ? '40px 16px 50px' : '90px 6vw 70px', position: 'relative' }}>

        {/* Editorial Header */}
        <div style={rev(s1.v, 0)}>
          <div style={{ marginBottom: isMobile ? 24 : 48 }}>
            {/* Live badge — hidden on mobile to keep clean like screenshot */}
            {!isMobile && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 100, padding: '6px 14px 6px 10px', marginBottom: 20, boxShadow: '0 2px 8px rgba(28,43,74,0.06)' }}>
                <span className="live-dot" />
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: '.04em' }}>Live — Updated This Week</span>
              </div>
            )}
            <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: isMobile ? '28px' : 'clamp(32px,4.5vw,56px)', color: TEXT, lineHeight: 1, letterSpacing: '-0.035em', margin: 0 }}>
              Our services
            </h2>
            <p style={{ fontSize: isMobile ? 13 : 15, color: MUTED, marginTop: 8, maxWidth: 420, lineHeight: 1.6 }}>
              The top 5 most-booked categories this week, powered by real customer data.
            </p>
          </div>
        </div>

        {/* Layout: bento on top, terminal below on mobile; side-by-side on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 20 : '4vw',
          alignItems: 'start',
        }}>

          {/* LEFT — Bento Grid */}
          <div style={rev(s1.v, 0.1)}>
            {(() => {
              // 1. Initialize with whatever trending data exists (even if empty)
              let safeCategories = trendingCategories ? [...trendingCategories] : [];

              // 2. Preemptive DB Padding Check: If trending is 0 or less than 5, IMMEDIATELY pad it 
              // from the master database before letting the UI decide if it's "empty".
              if (safeCategories.length < 5 && serviceCategories && serviceCategories.length > safeCategories.length) {
                const needed = 5 - safeCategories.length;
                const dbFillers = serviceCategories
                  .filter(sc => !safeCategories.find(tc => tc.id === sc.id))
                  .slice(0, needed);
                safeCategories = [...safeCategories, ...dbFillers];
              }

              // 3. Absolute Empty Check: ONLY show loading/empty if BOTH databases have absolutely nothing.
              if (safeCategories.length === 0) {
                return (
                  <div style={{ color: MUTED, fontSize: 15, padding: '40px 0' }}>
                    {svcLoading ? 'Loading live services...' : 'No services currently available.'}
                  </div>
                );
              }

              const top = safeCategories.slice(0, 5);
              const hero = top[0];
              const rest = top.slice(1);

              return (
                <>
                  {/* #1 — Hero Bento Card */}
                  <div className="bento-hero" onClick={() => navigate(`/services/request/${hero.id}`)}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ background: 'linear-gradient(135deg, #FF5A1F, #FF8C00)', borderRadius: 10, padding: '6px 14px', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '.04em' }}>🔥 #1 TRENDING</span>
                          <span className="live-dot" />
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowForwardIcon sx={{ fontSize: 17, color: '#fff' }} />
                        </div>
                      </div>
                      <h3 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 900, fontSize: 'clamp(22px, 2.5vw, 32px)', color: '#fff', letterSpacing: '-.03em', marginBottom: 8, lineHeight: 1.1 }}>
                        {hero.name}
                      </h3>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                        {hero.issues && hero.issues.length > 0 ? `${hero.issues.length} issue types covered` : 'Most booked service this week'}
                      </div>
                      {/* Heat bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: '92%', borderRadius: 2, background: 'linear-gradient(90deg, #FF5A1F, #FF8C00)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>92%</span>
                      </div>
                    </div>
                  </div>

                  {/* #2–#5 — 2×2 Bento Grid: stays 2-col on mobile like the screenshot */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 14, marginTop: isMobile ? 10 : 14 }}>
                    {rest.map((svc: any, i: number) => {
                      const heat = [78, 65, 51, 40][i];
                      return (
                        <div key={svc.id || i} className="bento-cell" onClick={() => navigate(`/services/request/${svc.id}`)}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '.02em' }}>#{i + 2}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: MUTED }}>Trending</span>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, lineHeight: 1.3, marginBottom: 6 }}>{svc.name}</div>
                            <div style={{ fontSize: 11, color: MUTED }}>
                              {svc.issues && svc.issues.length > 0 ? `${svc.issues.length} types` : 'Expert service'}
                            </div>
                          </div>
                          <div className="heat-bar" style={{ marginTop: 12 }}>
                            <div className="heat-fill" style={{ width: `${heat}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* RIGHT — CLI Terminal */}
          <div style={rev(s1.v, 0.25)}>
            <div className="term-window">
              {/* Title bar with macOS dots */}
              <div className="term-bar">
                <div className="term-dot" style={{ background: '#FF5F57' }} />
                <div className="term-dot" style={{ background: '#FEBC2E' }} />
                <div className="term-dot" style={{ background: '#28C840' }} />
                <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '.04em' }}>techverse — booking-cli</span>
              </div>
              {/* Terminal body with auto-reveal lines */}
              <div className="term-body">
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>$</span> techverse <span style={{ color: '#60a5fa' }}>diagnose</span> --device <span style={{ color: '#fbbf24' }}>"Customer Device"</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Scanning hardware... Issue detected.</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>$</span> techverse <span style={{ color: '#60a5fa' }}>repair</span> --parts <span style={{ color: '#fbbf24' }}>genuine</span> --priority <span style={{ color: '#fbbf24' }}>express</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#f97316' }}>⧗</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Assigning certified technician...</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Same-day slot confirmed — Tech #T-4821</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>$</span> techverse <span style={{ color: '#60a5fa' }}>warranty</span> --duration <span style={{ color: '#fbbf24' }}>90d</span> --coverage <span style={{ color: '#fbbf24' }}>full</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>✓</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>Warranty activated. Your device is protected.</span>
                </div>
                <div className="term-line">
                  <span style={{ color: '#22c55e' }}>$</span> <span className="term-cursor" />
                </div>
              </div>
              {/* Trust strip at bottom */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111' }}>
                {[
                  { emoji: '⭐', val: '4.9', lbl: 'Rating' },
                  { emoji: '⚡', val: '24hr', lbl: 'Response' },
                  { emoji: '🛡️', val: '90 Day', lbl: 'Warranty' },
                ].map((m, i) => (
                  <div key={m.lbl} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', borderLeft: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{m.emoji} {m.val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 2 }}>{m.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA below terminal */}
            <button
              style={{ width: '100%', marginTop: 16, padding: '17px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ORANGE}, #FF8C00)`, color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Poppins,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .3s ease', boxShadow: '0 8px 24px rgba(255,90,31,0.35)', letterSpacing: '-.01em' }}
              onClick={() => navigate('/services')}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(255,90,31,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,90,31,0.35)'; }}
            >
              Start Booking Now <ArrowForwardIcon sx={{ fontSize: 17 }} />
            </button>
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: MUTED }}>Prepayment · Fast service · Genuine parts only</p>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          §3  HOLOGRAPHIC 3D CATEGORIES SHOWCASE
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: PAGE, padding: '40px 0 20px', overflow: 'hidden', position: 'relative' }}>
        <div className="max-lg:!flex-col max-lg:!items-start" style={{ padding: '0 6vw', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
          <div>
            <h2 style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,4vw,48px)', color: TEXT, letterSpacing: '-0.02em', margin: 0 }}>
              Product Categories.
            </h2>
            <p style={{ color: MUTED, fontSize: '16px', marginTop: '12px' }}>
              Immersive hardware discovery. Driven by real-time market trends.
            </p>
          </div>
          <div className="max-lg:!mt-4" style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (catScrollRef.current) catScrollRef.current.dataset.paused = "true";
                catScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
                setTimeout(() => { if (catScrollRef.current) catScrollRef.current.dataset.paused = ""; }, 800);
              }}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, color: TEXT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              ←
            </button>
            <button
              onClick={() => {
                if (catScrollRef.current) catScrollRef.current.dataset.paused = "true";
                catScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
                setTimeout(() => { if (catScrollRef.current) catScrollRef.current.dataset.paused = ""; }, 800);
              }}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, color: TEXT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={catScrollRef}
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
          onTouchStart={() => {
            if (catScrollRef.current) catScrollRef.current.dataset.paused = "true";
          }}
          onTouchEnd={() => {
            // Wait 3 full seconds to absolutely guarantee that native browser
            // swipe/momentum physics have completely settled before waking the auto-scroller
            setTimeout(() => {
              if (catScrollRef.current) catScrollRef.current.dataset.paused = "";
            }, 3000);
          }}
          style={{
            overflowX: 'auto',
            padding: isMobile ? '5px 4vw 20px' : '10px 6vw 40px',
            display: 'flex',
            /* Close the slider gap considerably on mobile */
            gap: isMobile ? '12px' : '40px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            perspective: '1500px',
            position: 'relative',
            zIndex: 2
          }}
        >
          {(() => {
            const list = productTrendingCategories && productTrendingCategories.length > 0 ? productTrendingCategories : cats;
            return (
              <>
                {list.map((c: any, i: number) => (
                  <HolographicCategoryCard
                    key={i}
                    cat={c}
                    index={i}
                    isTrending={i === 0}
                    navigate={navigate}
                    isMobile={isMobile}
                  />
                ))}

                {/* EXPLORE MORE CARD COMPONENT APENDED TO END OF CAROUSEL */}
                <div
                  onClick={() => navigate('/store')}
                  style={{
                    flexShrink: 0,
                    margin: isMobile ? '10px 0' : '20px 0',
                    width: isMobile ? '160px' : '300px',
                    height: isMobile ? '180px' : '340px',
                    borderRadius: isMobile ? '20px' : '32px',
                    background: 'rgba(255,255,255,1)',
                    border: '2px dashed rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    transition: 'transform 0.3s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ padding: isMobile ? '12px' : '24px', background: 'rgba(255,90,31,0.1)', borderRadius: '50%', color: '#FF5A1F', marginBottom: isMobile ? '8px' : '16px' }}>
                    <ArrowForwardIcon sx={{ fontSize: isMobile ? 24 : 40 }} />
                  </div>
                  <div style={{ color: '#000', fontWeight: 800, fontSize: isMobile ? '12px' : '18px', textAlign: 'center' }}>
                    Explore<br />All Categories
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ══ SCROLLYTELLING ══ */}
      <MouseScrollytelling />

      {/* ══ 3D LAPTOP SCROLLYTELLING ══ */}
      <LaptopScrollSection />

    </>
  );
};

export default LandingPage;
