"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Hero3DFallback } from "./Hero3DFallback";

export function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. WebGL Support Test
    const canvasTest = document.createElement("canvas");
    const gl =
      canvasTest.getContext("webgl2") ||
      canvasTest.getContext("webgl") ||
      canvasTest.getContext("experimental-webgl");

    if (!gl) {
      setHasWebGL(false);
      return;
    }

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    setHasWebGL(true);

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight1.position.set(5, 8, 6);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    // 4. Hero Object Group
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Chrome Incline Plane
    const rampGeo = new THREE.BoxGeometry(4.8, 0.25, 2.2);
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.15,
    });
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.rotation.z = -0.52; // ~30 deg incline
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    heroGroup.add(rampMesh);

    // Gold & Glass Block Resting on the Ramp
    const blockGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
    });
    const blockMesh = new THREE.Mesh(blockGeo, blockMat);
    // Position on ramp surface
    blockMesh.position.set(0.1, 0.6, 0);
    blockMesh.rotation.z = -0.52;
    blockMesh.castShadow = true;
    heroGroup.add(blockMesh);

    // Vector Arrows (mg, N, f)
    // mg (weight): points straight down (0, -1, 0) in red
    const mgArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0.1, 0.6, 0),
      1.6,
      0xff3b30,
      0.35,
      0.2
    );
    heroGroup.add(mgArrow);

    // N (normal): points perpendicular to ramp (sin 30, cos 30) in blue
    const normalDir = new THREE.Vector3(
      Math.sin(0.52),
      Math.cos(0.52),
      0
    ).normalize();
    const nArrow = new THREE.ArrowHelper(
      normalDir,
      new THREE.Vector3(0.1, 0.6, 0),
      1.4,
      0x1a55f0,
      0.35,
      0.2
    );
    heroGroup.add(nArrow);

    // f (friction): points up the ramp in orange
    const frictionDir = new THREE.Vector3(
      Math.cos(0.52),
      Math.sin(0.52),
      0
    ).normalize();
    const fArrow = new THREE.ArrowHelper(
      frictionDir,
      new THREE.Vector3(0.1, 0.6, 0),
      0.9,
      0xff9f0a,
      0.3,
      0.18
    );
    heroGroup.add(fArrow);

    // Small Orbiting Sphere
    const sphereGeo = new THREE.SphereGeometry(0.25, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x18b26b,
      metalness: 0.5,
      roughness: 0.1,
      emissive: 0x18b26b,
      emissiveIntensity: 0.3,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    heroGroup.add(sphereMesh);

    // 5. Parallax & Scroll Interactivity
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouse.targetX = x * 0.8;
      mouse.targetY = y * 0.8;
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Smooth parallax interpolation
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Incline reacts to scroll progress
        const scrollTilt = (scrollY * 0.001) % (Math.PI / 4);
        heroGroup.rotation.y = mouse.x + Math.sin(elapsedTime * 0.5) * 0.15;
        heroGroup.rotation.x = -mouse.y + 0.1 + scrollTilt;

        // Floating motion
        heroGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.12;

        // Orbiting sphere
        const orbitRadius = 2.4;
        sphereMesh.position.x = Math.cos(elapsedTime * 1.5) * orbitRadius;
        sphereMesh.position.z = Math.sin(elapsedTime * 1.5) * orbitRadius;
        sphereMesh.position.y = Math.sin(elapsedTime * 2.0) * 0.6;
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);

      // Dispose Three.js objects
      rampGeo.dispose();
      rampMat.dispose();
      blockGeo.dispose();
      blockMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  if (hasWebGL === false) {
    return <Hero3DFallback />;
  }

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[420px] sm:h-[520px] flex items-center justify-center pointer-events-none select-none z-10"
      aria-label="3D Physics Incline Demonstration Model"
    />
  );
}
