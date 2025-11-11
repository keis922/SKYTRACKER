// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import axios from "axios";

const API_URL = "https://api.aviationstack.com/v1/flights";
const ACCESS_KEY = "fbdd13357da88b65ddca0e9a7d8fc02c";

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}

function greatCirclePoint(lat1, lon1, lat2, lon2, t) {
  const φ1 = toRadians(lat1);
  const λ1 = toRadians(lon1);
  const φ2 = toRadians(lat2);
  const λ2 = toRadians(lon2);
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinφ2 = Math.sin(φ2);
  const cosφ2 = Math.cos(φ2);
  const Δ = 2 * Math.asin(
    Math.sqrt(
      Math.sin((φ2 - φ1) / 2) * Math.sin((φ2 - φ1) / 2) +
        cosφ1 * cosφ2 * Math.sin((λ2 - λ1) / 2) * Math.sin((λ2 - λ1) / 2)
    )
  );
  if (!Δ) {
    return { lat: lat1, lng: lon1 };
  }
  const A = Math.sin((1 - t) * Δ) / Math.sin(Δ);
  const B = Math.sin(t * Δ) / Math.sin(Δ);
  const x = A * cosφ1 * Math.cos(λ1) + B * cosφ2 * Math.cos(λ2);
  const y = A * cosφ1 * Math.sin(λ1) + B * cosφ2 * Math.sin(λ2);
  const z = A * sinφ1 + B * sinφ2;
  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ = Math.atan2(y, x);
  return {
    lat: toDegrees(φ),
    lng: toDegrees(λ)
  };
}

async function fetchFlights() {
  const response = await axios.get(API_URL, {
    params: {
      access_key: ACCESS_KEY,
      limit: 100,
      flight_status: "active"
    },
    timeout: 12000
  });
  const data = response.data && Array.isArray(response.data.data) ? response.data.data : [];
  const valid = data.filter((item) => {
    const d = item.departure || {};
    const a = item.arrival || {};
    return (
      typeof d.latitude === "number" &&
      typeof d.longitude === "number" &&
      typeof a.latitude === "number" &&
      typeof a.longitude === "number"
    );
  });
  const selected = valid.slice(0, 20);
  return selected.map((item, index) => {
    const d = item.departure || {};
    const a = item.arrival || {};
    const flight = item.flight || {};
    const airline = item.airline || {};
    const startLat = d.latitude;
    const startLng = d.longitude;
    const endLat = a.latitude;
    const endLng = a.longitude;
    return {
      id: `${flight.iata || flight.icao || index}-${startLat}-${startLng}-${endLat}-${endLng}`,
      iata: flight.iata || "",
      airline: airline.name || "",
      from: d.airport || "",
      to: a.airport || "",
      startLat,
      startLng,
      endLat,
      endLng,
      progress: Math.random(),
      speed: 0.02 + Math.random() * 0.03
    };
  });
}

export default function Globe3D() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const flightsRef = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const refreshRef = useRef(null);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const globe = Globe()(container);
    globeRef.current = globe;
    globe
      .globeImageUrl("/textures/earth-day.jpg")
      .bumpImageUrl("/textures/earth-night.jpg")
      .backgroundColor("#0f172a")
      .showAtmosphere(true)
      .atmosphereColor("#38bdf8")
      .atmosphereAltitude(0.22)
      .arcsData([])
      .arcStartLat((d) => d.startLat)
      .arcStartLng((d) => d.startLng)
      .arcEndLat((d) => d.endLat)
      .arcEndLng((d) => d.endLng)
      .arcColor(() => "#38bdf8")
      .arcAltitude(() => 0.2)
      .arcStroke(0.8)
      .arcsTransitionDuration(900)
      .pointsData([])
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointAltitude(() => 0.2)
      .pointRadius(0.2)
      .pointColor(() => "#f9fafb")
      .pointsTransitionDuration(0)
      .pointLabel((d) => d.flight.iata || "")
      .onPointClick((d) => {
        setSelectedFlight(d.flight);
        const mid = greatCirclePoint(
          d.flight.startLat,
          d.flight.startLng,
          d.flight.endLat,
          d.flight.endLng,
          0.5
        );
        globe.pointOfView({ lat: mid.lat, lng: mid.lng, altitude: 1.7 }, 800);
      })
      .onGlobeClick(() => {
        setSelectedFlight(null);
        globe.pointOfView({ lat: 22, lng: 0, altitude: 2.6 }, 800);
      });
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.45;
    controls.zoomSpeed = 0.7;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    globe.pointOfView({ lat: 22, lng: 0, altitude: 2.6 }, 0);
    function handleResize() {
      globe.width(container.clientWidth);
      globe.height(container.clientHeight);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    async function loadAndSetFlights() {
      try {
        const flights = await fetchFlights();
        flightsRef.current = flights;
        globe.arcsData(flights);
      } catch {
      }
    }
    loadAndSetFlights();
    refreshRef.current = setInterval(loadAndSetFlights, 60000);
    function animate(time) {
      const last = lastTimeRef.current || time;
      const delta = (time - last) / 1000;
      lastTimeRef.current = time;
      const flights = flightsRef.current;
      if (flights && flights.length > 0) {
        const planes = flights.map((flight) => {
          const nextProgress = (flight.progress + delta * flight.speed) % 1;
          flight.progress = nextProgress;
          const p = greatCirclePoint(
            flight.startLat,
            flight.startLng,
            flight.endLat,
            flight.endLng,
            nextProgress
          );
          return {
            lat: p.lat,
            lng: p.lng,
            flight
          };
        });
        globe.pointsData(planes);
      }
      animationRef.current = requestAnimationFrame(animate);
    }
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full rounded-[36px] bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_40px_120px_rgba(15,23,42,0.9)] overflow-hidden"
      />
      {selectedFlight && (
        <div className="pointer-events-none absolute top-4 left-4 rounded-2xl bg-black/70 border border-white/10 px-4 py-3 text-xs text-snow/80 backdrop-blur">
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-sky mb-1">
            Sky Tracker Live
          </div>
          <div className="text-sm font-semibold text-snow">
            {selectedFlight.iata || "Vol commercial"}
          </div>
          <div className="mt-1 text-[11px] text-snow/70">
            {selectedFlight.airline || selectedFlight.originCountry || "Compagnie inconnue"}
          </div>
        </div>
      )}
    </div>
  );
}
