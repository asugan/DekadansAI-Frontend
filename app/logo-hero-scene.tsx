"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function LogoHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentCanvas = canvas;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: currentCanvas
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const pointer = new THREE.Vector2(0, 0);
    const targetRotation = new THREE.Vector2(0, 0);

    const group = new THREE.Group();
    group.rotation.x = -0.12;
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load("/logo.png", () => {
      logoTexture.colorSpace = THREE.SRGBColorSpace;
      renderer.render(scene, camera);
    });

    const logoMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: logoTexture,
      transparent: true
    });
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 4.3), logoMaterial);
    logo.position.z = 0.25;
    group.add(logo);

    const glowMaterial = new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x00f2ff,
      opacity: 0.18,
      transparent: true
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(2.65, 96), glowMaterial);
    glow.position.z = -0.12;
    group.add(glow);

    const ringMaterials = [0x00f2ff, 0xa855f7, 0x3b82f6].map(
      (color) =>
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color,
          opacity: 0.28,
          transparent: true,
          wireframe: true
        })
    );

    const rings = ringMaterials.map((material, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55 + index * 0.22, 0.012, 8, 180), material);
      ring.rotation.x = Math.PI / 2.7;
      ring.rotation.z = index * 0.35;
      ring.position.z = -0.28 - index * 0.04;
      group.add(ring);
      return ring;
    });

    const particleCount = 900;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorA = new THREE.Color("#00f2ff");
    const colorB = new THREE.Color("#a855f7");
    const colorC = new THREE.Color("#facc15");

    for (let index = 0; index < particleCount; index += 1) {
      const radius = Math.sqrt(Math.random()) * 3.4;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius * 1.12;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.52 + 0.18;
      positions[index * 3 + 2] = -0.65 + Math.random() * 0.35;

      const mixed = colorA.clone().lerp(index % 3 === 0 ? colorB : colorC, Math.random() * 0.75);
      colors[index * 3] = mixed.r;
      colors[index * 3 + 1] = mixed.g;
      colors[index * 3 + 2] = mixed.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        blending: THREE.AdditiveBlending,
        opacity: 0.7,
        size: 0.025,
        transparent: true,
        vertexColors: true
      })
    );
    particles.rotation.x = -0.18;
    group.add(particles);

    function resize() {
      const parent = currentCanvas.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = currentCanvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(currentCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    resize();

    let frame = 0;
    let animationId = 0;

    function animate() {
      frame += 0.01;
      targetRotation.x += (-pointer.y * 0.08 - targetRotation.x) * 0.04;
      targetRotation.y += (pointer.x * 0.12 - targetRotation.y) * 0.04;

      group.rotation.x = -0.12 + targetRotation.x;
      group.rotation.y = targetRotation.y;
      logo.position.y = prefersReducedMotion ? 0 : Math.sin(frame) * 0.035;
      glow.scale.setScalar(prefersReducedMotion ? 1 : 1 + Math.sin(frame * 1.4) * 0.035);
      particles.rotation.z += prefersReducedMotion ? 0 : 0.0008;

      rings.forEach((ring, index) => {
        ring.rotation.z += prefersReducedMotion ? 0 : 0.0015 + index * 0.0007;
      });

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(animate);
      }
    }

    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      logo.geometry.dispose();
      logoMaterial.dispose();
      logoTexture.dispose();
      glow.geometry.dispose();
      glowMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="pointer-events-none relative mx-auto h-[360px] w-full max-w-4xl md:h-[520px]">
      <div className="absolute inset-x-10 top-1/2 h-32 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute inset-x-20 top-1/3 h-32 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <canvas ref={canvasRef} className="relative h-full w-full" aria-hidden="true" />
    </div>
  );
}
