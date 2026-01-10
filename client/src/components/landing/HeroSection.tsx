import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Globe, Sparkles } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Stars } from "@react-three/drei";
import * as THREE from "three";

// 3D Animated Background Component
const NebulaScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00D9FF" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Sphere args={[1.5, 64, 64]} position={[2, 0, -2]}>
            <MeshDistortMaterial
              color="#00D9FF"
              attach="material"
              distort={0.4}
              speed={1.5}
              roughness={0}
              metalness={1}
              opacity={0.1}
              transparent
            />
          </Sphere>
        </Float>
        <Float speed={3} rotationIntensity={2} floatIntensity={2}>
          <Sphere args={[1, 64, 64]} position={[-2, 1, -1]}>
            <MeshDistortMaterial
              color="#3b82f6"
              attach="material"
              distort={0.5}
              speed={2}
              roughness={0}
              metalness={1}
              opacity={0.1}
              transparent
            />
          </Sphere>
        </Float>
      </Canvas>
    </div>
  );
};

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set(clientX - rect.left);
        mouseY.set(clientY - rect.top);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Mask for the "AUDNIX" reveal effect
  const maskImage = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const mouseGlow = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(0, 217, 255, 0.08), transparent)`;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden bg-black font-sans cursor-none"
    >
      {/* 1. 3D Background Vibes */}
      <Suspense fallback={null}>
        <NebulaScene />
      </Suspense>

      {/* 2. Hidden "AUDNIX" Reveal Layer (Background) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
        {/* Static base (extremely faint) */}
        <h2 className="text-[25vw] font-extralight tracking-tighter text-white/5 opacity-20 blur-[2px]">
          AUDNIX
        </h2>

        {/* Revealed Layer on Hover */}
        <motion.div
          style={{ maskImage, WebkitMaskImage: maskImage }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <h2 className="text-[25vw] font-light tracking-tighter text-primary/10 blur-[10px]">
            AUDNIX
          </h2>
        </motion.div>
      </div>

      {/* 2.5 Dynamic Background Glows (Gemini/Apple style) */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] z-0 pointer-events-none opacity-30"
        style={{
          background: useMotionTemplate`radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(34, 211, 238, 0.1), transparent 60%)`
        }}
      />

      <div className="max-w-7xl mx-auto relative z-20 w-full">
        <div className="flex flex-col items-center text-center">

          {/* Protocol Chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-medium">
                Neural Sync Active v4.2
              </span>
            </div>
          </motion.div>

          {/* New "Clean" Content Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-8xl font-medium tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
              The next evolution of <br />
              <span className="text-white/40 italic">autonomous intelligence.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-normal leading-relaxed">
              Deploy surgical-grade AI agents that architect revenue while you sleep.
              Zero latency. Zero friction. Total dominance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-black font-semibold uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all duration-300">
                  Initialize Control <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" className="h-16 px-10 rounded-2xl border border-white/5 text-white/60 font-semibold uppercase tracking-widest text-[11px] hover:bg-white/5 hover:text-white transition-all">
                  Explore Architecture
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Footer Trust Bar - Clean */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="mt-32 w-full max-w-3xl flex flex-wrap justify-center items-center gap-10 text-[10px] font-medium uppercase tracking-[0.2em] text-white/10"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Global Infrastructure
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div>Enterprise Encryption</div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div>Deterministic Logic</div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}
