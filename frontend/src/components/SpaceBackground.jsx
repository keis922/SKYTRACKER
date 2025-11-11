// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

function AnimatedStars() {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y += delta * 0.02;
    groupRef.current.rotation.x = Math.sin(Date.now() * 0.00008) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

export default function SpaceBackground() {
  return (
    <div className="fixed inset-0 -z-20">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 55 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        className="w-full h-full"
      >
        <color attach="background" args={["#01030b"]} />
        <AnimatedStars />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#050b1b]/30 to-[#01040c]/80 pointer-events-none" />
    </div>
  );
}
