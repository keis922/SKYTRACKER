// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getPlanetAvatar } from "../data/planetAvatars.js";
import { TextureLoader } from "three";

const loader = new TextureLoader();

function useTextureResource(url) {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (cancelled) {
          return;
        }
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) {
          setTexture(null);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);
  return texture;
}

function PlanetMesh({ preset }) {
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const surfaceTexture = useTextureResource(preset.texture);
  const ringTexture = useTextureResource(preset.ring?.texture);
  const hasTexture = Boolean(surfaceTexture);
  const emissiveColor = hasTexture ? "#020617" : preset.glow;
  const emissiveIntensity = hasTexture ? 0.05 : 0.25;

  useFrame((state, delta) => {
    const rotationSpeed = preset.rotationSpeed || 0.4;
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * delta;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += rotationSpeed * 0.25 * delta;
    }
  });

  const baseColor = hasTexture ? "#ffffff" : preset.surface;
  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          map={surfaceTexture || undefined}
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      {preset.ring && ringTexture ? (
        <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]} scale={1.4}>
          <torusGeometry args={[1, 0.08, 16, 64]} />
          <meshStandardMaterial
            color={preset.ring.color || "#ffffff"}
            transparent
            opacity={0.8}
            emissive={preset.ring.color || "#ffffff"}
            emissiveIntensity={0.35}
            roughness={0.4}
            map={ringTexture || null}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export default function PlanetAvatar({
  variantId = "earth",
  size = 96,
  className = "",
  staticOnly = false
}) {
  const presetBase = getPlanetAvatar(variantId);
  let preset = presetBase;
  if (presetBase.id === "earth" || presetBase.id === "mars") {
    preset = {
      ...presetBase,
      ring: null
    };
  }
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setReady(true);
    }
  }, []);
  const baseStyle = {
    width: size,
    height: size
  };
  if (!ready) {
    return (
      <div
        className={`rounded-full overflow-hidden ${className}`}
        style={{
          ...baseStyle,
          background: `radial-gradient(circle at 30% 30%, ${preset.glow}, ${preset.surface})`,
          boxShadow: "0 0 24px rgba(0,0,0,0.45)"
        }}
      />
    );
  }
  if (staticOnly) {
    const hasTexture = Boolean(preset.texture);
    return (
      <div
        className={`rounded-full overflow-hidden ${className}`}
        style={{
          ...baseStyle,
          background: hasTexture
            ? `radial-gradient(circle at 30% 30%, rgba(0,0,0,0.15), rgba(0,0,0,0.35)), center/cover no-repeat url(${preset.texture})`
            : `radial-gradient(circle at 30% 30%, ${preset.glow}, ${preset.surface})`,
          boxShadow: "0 0 24px rgba(0,0,0,0.45)"
        }}
      />
    );
  }
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ ...baseStyle, background: "transparent", isolation: "isolate" }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.clearColor(0, 0, 0, 0);
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight intensity={0.9} color="#ffffff" position={[3, 3, 3]} />
        <directionalLight intensity={0.4} color="#ffffff" position={[-4, -3, -2]} />
        <Suspense fallback={null}>
          <PlanetMesh preset={preset} />
        </Suspense>
      </Canvas>
    </div>
  );
}
