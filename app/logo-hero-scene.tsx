"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/* ---------- Config ---------- */

const CONFIG = {
  camera: { fov: 45, position: [0, 0, 8.5] as [number, number, number] },
  logo: {
    size: 4.4,
    z: 0.5,
    distortSpeed: 0.3,
    distortStrength: 0.08,
  },
  icosahedron: {
    radius: 4.1,
    detail: 1,
    rotationSpeed: 0.05,
    color: "#00f2ff",
    opacity: 0.06,
  },
  octahedron: {
    radius: 3.2,
    detail: 0,
    rotationSpeed: -0.08,
    color: "#a855f7",
    opacity: 0.03,
  },
  particles: {
    count: 250,
    spread: 12,
    size: 0.03,
    color: "#00f2ff",
    opacity: 0.4,
    driftSpeed: 0.02,
  },
  bloom: {
    intensity: 0.2,
    luminanceThreshold: 0.35,
    luminanceSmoothing: 0.9,
    mipmapBlur: true,
  },
  float: { speed: 1.8, rotationIntensity: 0.15, floatIntensity: 1.2 },
  modelPlanets: {
    color: "#39ff88",
    streamCount: 16,
    streamSpeed: 0.16,
    orbitYScale: 0.5,
  },
} as const;

const DEFAULT_MODEL_LABELS = ["GLM", "Kimi", "DeepSeek", "Minimax", "GPT"];
const MIN_INTRO_MS = 1200;

const PLANET_LAYOUT = [
  { position: [-3.9, 1.25, -0.45] as [number, number, number], size: 0.26, color: "#39ff88", rotationSpeed: 0.82 },
  { position: [3.9, 1.05, -0.35] as [number, number, number], size: 0.28, color: "#00f2ff", rotationSpeed: 0.55 },
  { position: [-4.25, -0.75, -0.5] as [number, number, number], size: 0.23, color: "#7cffb2", rotationSpeed: 1.08 },
  { position: [4.25, -0.95, -0.55] as [number, number, number], size: 0.24, color: "#b7ff4a", rotationSpeed: 0.68 },
  { position: [0, 2.25, -0.65] as [number, number, number], size: 0.22, color: "#64ffda", rotationSpeed: 0.94 },
] as const;

type ModelPlanetConfig = (typeof PLANET_LAYOUT)[number] & { label: string };

/* ---------- Hook ---------- */

function subscribePrefersReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServer() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServer
  );
}

/* ---------- Helpers ---------- */

function generateParticlePositions(count: number, spread: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    arr[i] = (Math.random() - 0.5) * spread;
  }
  return arr;
}

function getShortModelLabel(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("deepseek")) return "DeepSeek";
  if (normalized.includes("kimi")) return "Kimi";
  if (normalized.includes("glm") || normalized.includes("zai")) return "GLM";
  if (normalized.includes("minimax")) return "Minimax";
  if (normalized.includes("gpt") || normalized.includes("chatgpt")) return "GPT";

  return name.split(/[\s/-]+/).filter(Boolean).slice(0, 2).join(" ");
}

function getModelLabels(modelLabels: string[]): string[] {
  const incomingLabels = modelLabels.map(getShortModelLabel);
  const labels = [
    ...DEFAULT_MODEL_LABELS.filter((label) => incomingLabels.includes(label) || label === "DeepSeek"),
    ...incomingLabels,
    ...DEFAULT_MODEL_LABELS,
  ];
  return labels.filter((label, index) => label && labels.indexOf(label) === index);
}

function getOrbitPosition(
  position: readonly [number, number, number],
  time: number,
  orbitSpeed: number
): [number, number, number] {
  const [x, y, z] = position;
  const radius = Math.hypot(x, y / CONFIG.modelPlanets.orbitYScale);
  const startAngle = Math.atan2(y / CONFIG.modelPlanets.orbitYScale, x);
  const angle = startAngle + time * orbitSpeed * 0.18;

  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * CONFIG.modelPlanets.orbitYScale,
    z,
  ];
}

/* ---------- Logo with subtle vertex distort ---------- */

function DistortLogo({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/logo.png");
  const originalPositions = useRef<Float32Array | null>(null);
  const { size, z, distortSpeed, distortStrength } = CONFIG.logo;

  // Set color space on first load - texture is a THREE.js object, not React state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  useFrame((state) => {
    if (!meshRef.current || prefersReducedMotion) return;
    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position as THREE.BufferAttribute;

    if (!originalPositions.current) {
      originalPositions.current = Float32Array.from(positions.array as Float32Array);
    }

    const time = state.clock.elapsedTime;
    const orig = originalPositions.current;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const ox = orig[i3];
      const oy = orig[i3 + 1];
      const wave = Math.sin(ox * 1.5 + time * distortSpeed) * Math.cos(oy * 1.5 + time * distortSpeed * 0.7);
      positions.setZ(i, wave * distortStrength);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, z]}>
      <planeGeometry args={[size, size, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ---------- Wireframe icosahedron ---------- */

function WireIcosahedron({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { radius, detail, rotationSpeed, color, opacity } = CONFIG.icosahedron;

  useFrame(() => {
    if (!meshRef.current || prefersReducedMotion) return;
    meshRef.current.rotation.y += rotationSpeed * 0.01;
    meshRef.current.rotation.x += rotationSpeed * 0.005;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <icosahedronGeometry args={[radius, detail]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/* ---------- Wireframe octahedron ---------- */

function WireOctahedron({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { radius, detail, rotationSpeed, color, opacity } = CONFIG.octahedron;

  useFrame(() => {
    if (!meshRef.current || prefersReducedMotion) return;
    meshRef.current.rotation.y += rotationSpeed * 0.01;
    meshRef.current.rotation.z += rotationSpeed * 0.005;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1.5]}>
      <octahedronGeometry args={[radius, detail]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

/* ---------- Particles ---------- */

function Particles({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions] = useState(() =>
    generateParticlePositions(CONFIG.particles.count, CONFIG.particles.spread)
  );
  const { count, size, color, opacity, driftSpeed } = CONFIG.particles;

  useFrame((state) => {
    if (!pointsRef.current || prefersReducedMotion) return;
    pointsRef.current.rotation.y += driftSpeed * 0.001;
    pointsRef.current.rotation.x += driftSpeed * 0.0005;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += Math.sin(time * 0.3 + i) * 0.0008;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, 0, -1]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------- Model planets and API streams ---------- */

function ModelPlanet({
  label,
  position,
  size,
  color,
  rotationSpeed,
  prefersReducedMotion,
}: {
  label: string;
  position: [number, number, number];
  size: number;
  color: string;
  rotationSpeed: number;
  prefersReducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const labelX = position[0] < 0 ? -0.52 : 0.52;
  const anchorX = position[0] < 0 ? "right" : "left";

  useFrame((state) => {
    const [x, y, z] = getOrbitPosition(
      position,
      prefersReducedMotion ? 0 : state.clock.elapsedTime,
      rotationSpeed
    );
    groupRef.current?.position.set(x, y, z);

    if (prefersReducedMotion) {
      return;
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * 0.012;
      planetRef.current.rotation.x += rotationSpeed * 0.004;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += rotationSpeed * 0.006;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0, Math.PI / 8]}>
        <torusGeometry args={[size * 1.45, 0.01, 8, 42]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
      <Text
        position={[labelX, 0.02, 0]}
        fontSize={0.16}
        color="#dfffee"
        anchorX={anchorX}
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#02130b"
      >
        {label}
      </Text>
    </group>
  );
}

function ApiStreams({
  targets,
  prefersReducedMotion,
}: {
  targets: ModelPlanetConfig[];
  prefersReducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const linePositions = useMemo(() => new Float32Array(targets.length * 6), [targets.length]);
  const particleSeeds = useMemo(() => {
    const seeds: { targetIndex: number; offset: number }[] = [];
    targets.forEach((_, targetIndex) => {
      for (let i = 0; i < CONFIG.modelPlanets.streamCount; i++) {
        seeds.push({ targetIndex, offset: i / CONFIG.modelPlanets.streamCount });
      }
    });
    return seeds;
  }, [targets]);
  const particlePositions = useMemo(() => new Float32Array(particleSeeds.length * 3), [particleSeeds.length]);

  useFrame((state) => {
    const orbitTime = prefersReducedMotion ? 0 : state.clock.elapsedTime;

    if (linesRef.current) {
      const lineAttribute = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const lineArr = lineAttribute.array as Float32Array;

      targets.forEach((target, index) => {
        const [x, y, z] = getOrbitPosition(target.position, orbitTime, target.rotationSpeed);
        const i6 = index * 6;

        lineArr[i6] = 0;
        lineArr[i6 + 1] = 0;
        lineArr[i6 + 2] = -0.15;
        lineArr[i6 + 3] = x;
        lineArr[i6 + 4] = y;
        lineArr[i6 + 5] = z;
      });

      lineAttribute.needsUpdate = true;
    }

    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;
    const streamTime = orbitTime * CONFIG.modelPlanets.streamSpeed;

    particleSeeds.forEach((seed, index) => {
      const target = targets[seed.targetIndex];
      const [x, y, z] = getOrbitPosition(target.position, orbitTime, target.rotationSpeed);
      const progress = (seed.offset + streamTime) % 1;
      const pulse = Math.sin(progress * Math.PI);
      const i3 = index * 3;

      arr[i3] = x * progress;
      arr[i3 + 1] = y * progress + pulse * 0.12;
      arr[i3 + 2] = -0.15 + (z + 0.15) * progress;
    });

    positions.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={CONFIG.modelPlanets.color} transparent opacity={0.22} />
      </lineSegments>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color={CONFIG.modelPlanets.color}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function OrbitPath({ position, color }: { position: readonly [number, number, number]; color: string }) {
  const orbitPoints = useMemo(() => {
    const radius = Math.hypot(position[0], position[1] / CONFIG.modelPlanets.orbitYScale);
    const points: number[] = [];

    for (let i = 0; i <= 96; i++) {
      const angle = (i / 96) * Math.PI * 2;
      points.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * CONFIG.modelPlanets.orbitYScale,
        position[2] - 0.02
      );
    }

    return new Float32Array(points);
  }, [position]);

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[orbitPoints, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.1} />
    </lineLoop>
  );
}

function ModelNetwork({
  modelLabels,
  prefersReducedMotion,
}: {
  modelLabels: string[];
  prefersReducedMotion: boolean;
}) {
  const { viewport } = useThree();
  const isCompact = viewport.width < 7;
  const planets = useMemo(() => {
    const labels = getModelLabels(modelLabels);
    return PLANET_LAYOUT.slice(0, isCompact ? 3 : PLANET_LAYOUT.length).map((planet, index) => ({
      ...planet,
      label: labels[index] ?? DEFAULT_MODEL_LABELS[index],
    }));
  }, [isCompact, modelLabels]);

  return (
    <group>
      {planets.map((planet) => (
        <OrbitPath key={`${planet.label}-orbit`} position={planet.position} color={planet.color} />
      ))}
      <ApiStreams targets={planets} prefersReducedMotion={prefersReducedMotion} />
      {planets.map((planet) => (
        <ModelPlanet
          key={planet.label}
          label={planet.label}
          position={planet.position}
          size={planet.size}
          color={planet.color}
          rotationSpeed={planet.rotationSpeed}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </group>
  );
}

/* ---------- Scene ---------- */

function Scene({
  modelLabels,
  prefersReducedMotion,
  onReady,
}: {
  modelLabels: string[];
  prefersReducedMotion: boolean;
  onReady: () => void;
}) {
  const { speed, rotationIntensity, floatIntensity } = CONFIG.float;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 4]} intensity={0.5} color="#00f2ff" />
      <pointLight position={[-3, -2, 2]} intensity={0.15} color="#a855f7" />

      <Suspense fallback={null}>
        <Float
          speed={prefersReducedMotion ? 0 : speed}
          rotationIntensity={prefersReducedMotion ? 0 : rotationIntensity}
          floatIntensity={prefersReducedMotion ? 0 : floatIntensity}
        >
          <DistortLogo prefersReducedMotion={prefersReducedMotion} />
        </Float>

        <ModelNetwork modelLabels={modelLabels} prefersReducedMotion={prefersReducedMotion} />
        <WireIcosahedron prefersReducedMotion={prefersReducedMotion} />
        <WireOctahedron prefersReducedMotion={prefersReducedMotion} />
        <Particles prefersReducedMotion={prefersReducedMotion} />
        <SceneReady onReady={onReady} />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={CONFIG.bloom.intensity}
          luminanceThreshold={CONFIG.bloom.luminanceThreshold}
          luminanceSmoothing={CONFIG.bloom.luminanceSmoothing}
          mipmapBlur={CONFIG.bloom.mipmapBlur}
        />
      </EffectComposer>
    </>
  );
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}

/* ---------- Main ---------- */

export function LogoHeroScene({ modelLabels = [] }: { modelLabels?: string[] }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [introElapsed, setIntroElapsed] = useState(false);
  const sceneReady = sceneLoaded && introElapsed;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroElapsed(true);
    }, prefersReducedMotion ? 0 : MIN_INTRO_MS);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const handleSceneReady = useCallback(() => {
    setSceneLoaded(true);
  }, []);

  return (
    <div className="pointer-events-none relative mx-auto h-[420px] w-full max-w-5xl overflow-hidden md:h-[600px]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 75%)",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(0,242,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        aria-hidden="true"
        className={`hero-logo-intro absolute inset-0 z-10 transition duration-700 ${
          sceneReady ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="hero-logo-intro__grid" />
        <div className="hero-logo-intro__beam hero-logo-intro__beam--left" />
        <div className="hero-logo-intro__beam hero-logo-intro__beam--right" />
        <div className="hero-logo-intro__orb" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="hero-logo-intro__logo"
        />
      </div>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Dekadans AI"
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 object-contain md:h-52 md:w-52"
        />
      </noscript>

      <Canvas
        className={`relative h-full w-full transition duration-700 ${
          sceneReady ? "opacity-100" : "opacity-0"
        }`}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: CONFIG.camera.fov, position: CONFIG.camera.position }}
        dpr={[1, 2]}
      >
        <Scene
          modelLabels={modelLabels}
          prefersReducedMotion={prefersReducedMotion}
          onReady={handleSceneReady}
        />
      </Canvas>
    </div>
  );
}
