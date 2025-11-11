// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FlightLayer } from "./FlightLayer.jsx";
import { TrackLayer } from "./TrackLayer.jsx";
import { AirportsLayer } from "./AirportsLayer.jsx";
import { useFlightsStore, convertLatLonToXYZ } from "../store/useFlightsStore.js";

const EARTH_RADIUS = 1.6;
const INTRO_PRESET = {
  distanceMultiplier: 140,
  duration: 1400,
  easing: (t) => 1 - Math.pow(1 - t, 4),
  wobble: 0.015,
  autoRotateSpeed: 20
};
const playedIntroKeys = new Map();
const INTRO_RESET_TIMEOUT = 60 * 1000;

function hasIntroRun(key) {
  if (!key) {
    return false;
  }
  const timestamp = playedIntroKeys.get(key);
  if (!timestamp) {
    return false;
  }
  if (Date.now() - timestamp > INTRO_RESET_TIMEOUT) {
    playedIntroKeys.delete(key);
    return false;
  }
  return true;
}

function markIntroDone(key) {
  if (!key) {
    return;
  }
  playedIntroKeys.set(key, Date.now());
}

function Atmosphere() {
  const shader = {
    uniforms: {
      coeficient: { value: 0.5 },
      power: { value: 4 },
      glowColor: { value: new THREE.Color("#38bdf8") }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform float coeficient;
      uniform float power;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(coeficient + dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
        gl_FragColor = vec4(glowColor * intensity, intensity);
      }
    `
  };
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <shaderMaterial
        attach="material"
        args={[shader]}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  );
}

function Earth() {
  const [dayMap, nightMap, cloudsMap] = useTexture([
    "/textures/earth-day.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-clouds.png"
  ]);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive={new THREE.Color("#0b1120")}
          emissiveIntensity={1.1}
          metalness={0.25}
          roughness={0.8}
        />
      </mesh>
      <mesh scale={1.01}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function RotatingWorld({ flightLayerOptions, showTrack, airportLayerOptions }) {
  return (
    <group>
      <Earth />
      <Atmosphere />
      <FlightLayer radius={EARTH_RADIUS} {...flightLayerOptions} />
      {airportLayerOptions ? (
        <AirportsLayer radius={EARTH_RADIUS} {...airportLayerOptions} />
      ) : null}
      {showTrack && <TrackLayer radius={EARTH_RADIUS} />}
    </group>
  );
}

function CameraRig({ minDistance = 3.5, maxDistance = 10, enableIntro = false }) {
  const [autoRotate, setAutoRotate] = useState(enableIntro);
  useEffect(() => {
    if (!enableIntro) {
      return;
    }
    const timer = setTimeout(() => setAutoRotate(false), INTRO_PRESET.duration);
    return () => clearTimeout(timer);
  }, [enableIntro]);
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.65}
      minDistance={minDistance}
      maxDistance={maxDistance}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={INTRO_PRESET.autoRotateSpeed}
      target={[0, 0, 0]}
    />
  );
}

function IntroAnimator({ targetPosition, enabled, onComplete }) {
  const { camera } = useThree();
  const animationRef = useRef(null);
  const targetVec = useRef(new THREE.Vector3(...targetPosition));
  useEffect(() => {
    targetVec.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
  }, [targetPosition]);

  useEffect(() => {
    if (!enabled) {
      animationRef.current = null;
      return;
    }
    const base = targetVec.current.clone();
    const start = base.clone().normalize().multiplyScalar(base.length() * INTRO_PRESET.distanceMultiplier);
    camera.position.copy(start);
    camera.lookAt(0, 0, 0);
    animationRef.current = {
      startTime: performance.now(),
      duration: INTRO_PRESET.duration,
      startPos: start,
      targetPos: base,
      easing: INTRO_PRESET.easing,
      wobble: INTRO_PRESET.wobble
    };
  }, [enabled, camera]);

  useFrame(() => {
    const data = animationRef.current;
    if (!data) {
      return;
    }
    const now = performance.now();
    const progress = Math.min(1, (now - data.startTime) / data.duration);
    const eased = data.easing(progress);
    camera.position.lerpVectors(data.startPos, data.targetPos, eased);
    if (data.wobble) {
      camera.position.multiplyScalar(1 + data.wobble * Math.sin(progress * Math.PI));
    }
    camera.lookAt(0, 0, 0);
    if (progress >= 1) {
      animationRef.current = null;
      onComplete?.();
    }
  });
  return null;
}

function CameraFocus({ radius }) {
  const selectedFlight = useFlightsStore((state) => state.selectedFlight);
  const focusRequestId = useFlightsStore((state) => state.focusRequestId);
  const focusRef = useRef(null);
  const { camera } = useThree();
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpCamera = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!focusRequestId) {
      return;
    }
    // keis: si on ferme, on recale sur globe
    if (!selectedFlight || selectedFlight.latitude == null || selectedFlight.longitude == null) {
      const fallbackTarget = new THREE.Vector3(0, 0, 0);
      const fallbackCam = camera.position.clone().normalize().multiplyScalar(radius * 3.2);
      focusRef.current = {
        target: fallbackTarget,
        camera: fallbackCam,
        requestId: focusRequestId
      };
      return;
    }
    const point = convertLatLonToXYZ(selectedFlight.latitude, selectedFlight.longitude, radius);
    const targetVector = new THREE.Vector3(point.x, point.y, point.z);
    const cameraVector = targetVector.clone().normalize().multiplyScalar(radius * 3.2);
    focusRef.current = {
      target: targetVector,
      camera: cameraVector,
      requestId: focusRequestId
    };
  }, [selectedFlight, focusRequestId, radius, camera]);

  useFrame((state, delta) => {
    if (!focusRef.current) {
      return;
    }
    const { target, camera: targetCamera } = focusRef.current;
    const lerpFactor = Math.min(1, delta * 2);
    tmpTarget.current.copy(target);
    tmpCamera.current.copy(targetCamera);
    camera.position.lerp(tmpCamera.current, lerpFactor);
    const controls = state.controls;
    if (controls) {
      controls.target.lerp(tmpTarget.current, lerpFactor);
      controls.update();
    }
    const cameraClose = camera.position.distanceTo(tmpCamera.current) < 0.02;
    const targetClose =
      controls && controls.target
        ? controls.target.distanceTo(tmpTarget.current) < 0.02
        : cameraClose;
    if (cameraClose && targetClose) {
      focusRef.current = null;
    }
  });
  return null;
}

function BackgroundParallaxSync({ enabled = false }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!enabled) {
      return;
    }
    const normalizedX = THREE.MathUtils.clamp(camera.position.x / 12 + 0.5, 0, 1);
    const normalizedY = THREE.MathUtils.clamp(camera.position.y / 6 + 0.5, 0, 1);
    document.documentElement.style.setProperty("--space-shift-x", normalizedX.toString());
    document.documentElement.style.setProperty("--space-shift-y", normalizedY.toString());
  });
  return null;
}

export default function Globe({
  className = "",
  canvasClassName = "",
  cameraPosition = [0, 0, 6.5],
  fov = 38,
  minDistance = 3.5,
  maxDistance = 10,
  syncBackground = false,
  flightLayerOptions = {},
  showTrack = true,
  airportLayerOptions = null,
  introAnimation = false,
  introKey = null
}) {
  const instancePlayedRef = useRef(false);
  const [introActive, setIntroActive] = useState(() => introAnimation && !hasIntroRun(introKey));
  useEffect(() => {
    if (!introAnimation) {
      setIntroActive(false);
      return;
    }
    if (hasIntroRun(introKey)) {
      setIntroActive(false);
      return;
    }
    if (!instancePlayedRef.current) {
      instancePlayedRef.current = true;
      setIntroActive(true);
    }
  }, [introAnimation, introKey]);
  const startLiveUpdates = useFlightsStore((state) => state.updateFlightsLoop);
  const stopLiveUpdates = useFlightsStore((state) => state.stopFlightsLoop);
  useEffect(() => {
    startLiveUpdates();
    return () => {
      stopLiveUpdates();
    };
  }, [startLiveUpdates, stopLiveUpdates]);
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov }}
        gl={{ antialias: true, alpha: true }}
        className={`w-full h-full ${canvasClassName}`}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          intensity={1.3}
          color="#38bdf8"
          position={[5, 3, 5]}
        />
        <directionalLight
          intensity={0.5}
          color="#0ea5e9"
          position={[-4, -2, -3]}
        />
        <Suspense fallback={null}>
          <RotatingWorld
            flightLayerOptions={flightLayerOptions}
            showTrack={showTrack}
            airportLayerOptions={airportLayerOptions}
          />
          <Stars
            radius={80}
            depth={40}
            count={4000}
            factor={3}
            saturation={0}
            fade
          />
        </Suspense>
        <IntroAnimator
          targetPosition={cameraPosition}
          enabled={introActive}
          onComplete={() => {
            markIntroDone(introKey);
            setIntroActive(false);
          }}
        />
        <CameraFocus radius={EARTH_RADIUS} />
        <CameraRig
          minDistance={minDistance}
          maxDistance={maxDistance}
          enableIntro={introActive}
        />
        <BackgroundParallaxSync enabled={syncBackground} />
      </Canvas>
    </div>
  );
}
