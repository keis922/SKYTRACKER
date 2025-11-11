// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo } from "react";
import { Billboard, Text } from "@react-three/drei";
import { useFlightsStore, convertLatLonToXYZ } from "../store/useFlightsStore.js";
import { altitudeToColor } from "../utils/altitudeColor.js";

const ICON_SCALE = 0.0033;

export function drawFlightPoints(flights, radius) {
  return flights.map((flight) => {
    const altitudeMeters = flight.altitudeMeters || 0;
    const clamped = Math.min(Math.max(altitudeMeters, 0), 12000);
    const altitudeFactor = 1 + clamped / 60000;
    const iconRadius = Math.max(radius * (altitudeFactor - 0.005), radius * 1.0);
    const position = convertLatLonToXYZ(flight.latitude, flight.longitude, iconRadius);
    const color = altitudeToColor(altitudeMeters);
    return {
      flight,
      position,
      color
    };
  });
}

export function FlightLayer({ radius, clickable = true, maxItems = null, filterFlightIds = null }) {
  const visibleFlights = useFlightsStore((state) => state.visibleFlights);
  const allFlights = useFlightsStore((state) => state.flights);
  const hasAppliedFilters = useFlightsStore((state) => state.hasAppliedFilters);
  const selectFlight = useFlightsStore((state) => state.selectFlight);

  const flights = hasAppliedFilters
    ? visibleFlights
    : visibleFlights.length > 0
      ? visibleFlights
      : allFlights;

  const filteredFlights = useMemo(() => {
    if (!filterFlightIds || filterFlightIds.length === 0) {
      return flights;
    }
    const normalizedSet = new Set(
      filterFlightIds.map((value) => value && value.toString().trim().toUpperCase()).filter(Boolean)
    );
    if (normalizedSet.size === 0) {
      return flights;
    }
    return flights.filter((flight) => {
      const candidates = [
        flight.id,
        flight.icao24,
        flight.callsign,
        flight.flightNumber,
        flight.flight_iata
      ]
        .filter(Boolean)
        .map((value) => value.toString().trim().toUpperCase());
      return candidates.some((value) => normalizedSet.has(value));
    });
  }, [flights, filterFlightIds]);

  const items = useMemo(
    () => drawFlightPoints(filteredFlights, radius),
    [filteredFlights, radius]
  );

  const limitedItems =
    typeof maxItems === "number" && maxItems > 0 ? items.slice(0, maxItems) : items;

  return (
    <group>
      {limitedItems.map(({ flight, position, color }) => (
        <Billboard
          key={flight.id}
          position={[position.x, position.y, position.z]}
          renderOrder={5}
          onClick={
            clickable
              ? (event) => {
                  event.stopPropagation();
                  selectFlight(flight);
                }
              : undefined
          }
        >
          <Text
            fontSize={ICON_SCALE * 6}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={ICON_SCALE * 1.4}
            outlineColor="#0f172a"
            fontWeight={700}
            depthTest={false}
            depthWrite={false}
          >
            ✈
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
