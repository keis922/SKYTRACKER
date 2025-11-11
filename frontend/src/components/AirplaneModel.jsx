// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Stars, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/f16_stylized_plane_glb_by_nilstheacevrchat_djv5e1p.glb";

useGLTF.preload(MODEL_PATH);

const AirplaneModel = forwardRef(function AirplaneModel(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.8, heading = 0, onClick, bodyColor },
  ref
) {
  const groupRef = useRef(null);
  const noseLight = useRef(null);
  const gltf = useGLTF(MODEL_PATH);
  const { model, turbines } = React.useMemo(() => {
    const clone = gltf.scene.clone(true);
    const spinningParts = [];
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.material = new THREE.MeshPhysicalMaterial({
          color: bodyColor || child.material.color || "#e5e7eb",
          metalness: 0.6,
          roughness: 0.25,
          clearcoat: 0.7,
          clearcoatRoughness: 0.12
        });
        if (child.name.toLowerCase().includes("cockpit")) {
          child.material.color = new THREE.Color("#0f172a");
          child.material.metalness = 1;
          child.material.roughness = 0.05;
          child.material.envMapIntensity = 1.2;
        }
        if (child.name.toLowerCase().includes("turbine") || child.name.toLowerCase().includes("fan")) {
          spinningParts.push(child);
        }
      }
    });
    return { model: clone, turbines: spinningParts };
  }, [gltf.scene, bodyColor]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = heading;
    }
  }, [heading]);

  useFrame((_, delta) => {
    turbines.forEach((mesh) => {
      mesh.rotation.z += delta * 14;
    });
    if (noseLight.current) {
      noseLight.current.intensity = 2.5 + Math.sin(performance.now() * 0.002) * 0.2;
    }
  });

  useImperativeHandle(ref, () => ({
    setPosition: (vec3) => {
      if (groupRef.current) {
        groupRef.current.position.copy(vec3);
      }
    },
    setHeading: (angle) => {
      if (groupRef.current) {
        groupRef.current.rotation.y = angle;
      }
    },
    orientToDirection: (direction) => {
      if (groupRef.current) {
        const look = new THREE.Vector3().copy(direction).normalize();
        const target = new THREE.Vector3().copy(groupRef.current.position).add(look);
        groupRef.current.lookAt(target);
      }
    }
  }));

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} onClick={onClick}>
      <primitive object={model} />
      <pointLight ref={noseLight} position={[0, 0.05, 1]} intensity={2.5} distance={3} color="#f8fbff" />
    </group>
  );
});

export function AirplaneScene({ position, rotation, scale, heading, onClick }) {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }} shadows>
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <Stars radius={80} depth={20} count={2000} factor={4} saturation={0} fade />
      <Environment preset="sunset" />
      <AirplaneModel
        position={position}
        rotation={rotation}
        scale={scale}
        heading={heading}
        onClick={onClick}
      />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} width={5} height={5} blur={2} />
    </Canvas>
  );
}

export default AirplaneModel;
