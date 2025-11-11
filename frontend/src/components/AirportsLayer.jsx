// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo } from "react";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { convertLatLonToXYZ } from "../store/useFlightsStore.js";

const LABEL_BASE_SCALE = 0.0022;
const LABEL_SIZE = LABEL_BASE_SCALE * 5;
const LABEL_OFFSET = 0.08;

function drawAirports(airports, radius) {
  return airports.map((airport) => {
    const point = convertLatLonToXYZ(airport.latitude, airport.longitude, radius * 1.01);
    const vector = new THREE.Vector3(point.x, point.y, point.z);
    return {
      airport,
      position: point,
      direction: vector.clone().normalize(),
      surfaceDistance: vector.length(),
      color: airport.isSite ? "#f97316" : "#f8fafc"
    };
  });
}

export function AirportsLayer({ radius, airports = [], onSelect, activeAirportId = null }) {
  const items = useMemo(() => drawAirports(airports, radius), [airports, radius]);

  if (!items.length) {
    return null;
  }

  return (
    <group>
      {items.map(({ airport, position, direction, surfaceDistance, color }) => {
        const isActive = activeAirportId && airport.id === activeAirportId;
        const finalColor = isActive ? "#fbbf24" : color;
        const height = radius * (isActive ? 0.42 : 0.3);
        const baseRadius = radius * (isActive ? 0.02 / 4.5 : 0.012 / 4.5);
        const centerDistance = surfaceDistance + height / 2;
        const labelDistance = surfaceDistance + height + radius * LABEL_OFFSET;
        const center = direction.clone().multiplyScalar(centerDistance);
        const labelPos = direction.clone().multiplyScalar(labelDistance);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );
        return (
          <group
            key={airport.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(airport);
            }}
          >
            <mesh position={[center.x, center.y, center.z]} quaternion={quaternion}>
              <cylinderGeometry args={[baseRadius, baseRadius, height, 20]} />
              <meshStandardMaterial
                color={finalColor}
                emissive={finalColor}
                emissiveIntensity={isActive ? 2.6 : 1.5}
                roughness={0.35}
                metalness={0.1}
                transparent
                opacity={0.95}
              />
            </mesh>
            <Billboard
              position={[labelPos.x, labelPos.y, labelPos.z]}
              renderOrder={4}
              follow
              depthTest={false}
              depthWrite={false}
            >
              <Text
                fontSize={LABEL_SIZE * (isActive ? 0.9 : 0.75)}
                color={finalColor}
                anchorX="center"
                anchorY="middle"
                outlineWidth={LABEL_BASE_SCALE}
                outlineColor="#020617"
                fontWeight={600}
              >
                {airport.iata || airport.id}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
