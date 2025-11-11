// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo } from "react";
import * as THREE from "three";
import { useFlightsStore, convertLatLonToXYZ } from "../store/useFlightsStore.js";
import { altitudeToColor } from "../utils/altitudeColor.js";

function buildPoints(trackPoints, radius) {
  if (!trackPoints || trackPoints.length < 2) {
    return null;
  }
  return trackPoints.map((point) => {
    const altitudeMeters = Math.min(Math.max(point.altitudeMeters || 0, 0), 12000);
    const iconFactor = 1 + altitudeMeters / 60000;
    const altitudeOffset = Math.max(iconFactor - 0.01, 1.0);
    const { x, y, z } = convertLatLonToXYZ(
      point.latitude,
      point.longitude,
      radius * altitudeOffset
    );
    return new THREE.Vector3(x, y, z);
  });
}

export function TrackLayer({ radius }) {
  const trackPoints = useFlightsStore((state) => state.trackPoints);
  const selectedFlight = useFlightsStore((state) => state.selectedFlight);
  const points = useMemo(
    () => buildPoints(trackPoints, radius),
    [trackPoints, radius]
  );
  if (!points || points.length < 2) {
    return null;
  }
  const adjustedPoints = points.map((vector, index) => {
    if (index === points.length - 1) {
      const dir = vector.clone().normalize();
      return vector.clone().sub(dir.multiplyScalar(0.02));
    }
    return vector;
  });
  const curve = new THREE.CatmullRomCurve3(adjustedPoints, false, "catmullrom", 0.12);
  const endPoint = adjustedPoints[adjustedPoints.length - 1];
  const materialColor = altitudeToColor(selectedFlight?.altitudeMeters || 0);
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 256, 0.005, 16, false]} />
        <meshStandardMaterial
          color={materialColor}
          emissive={materialColor}
          emissiveIntensity={1.3}
          roughness={0.25}
          metalness={0.55}
        />
      </mesh>
      <mesh position={[endPoint.x, endPoint.y, endPoint.z]}>
        <sphereGeometry args={[0.01, 12, 12]} />
        <meshStandardMaterial
          color={materialColor}
          emissive={materialColor}
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.45}
        />
      </mesh>
    </group>
  );
}
