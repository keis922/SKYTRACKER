// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import Loader from "../../components/Loader.jsx";
import Globe from "../../components/Globe.jsx";

function formatNumber(value) {
  if (!value && value !== 0) {
    return "";
  }
  return value.toLocaleString("fr-FR");
}

export default function HomePage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [altitudeFilter, setAltitudeFilter] = useState("");
  const [speedFilter, setSpeedFilter] = useState("");
  const [sortBy, setSortBy] = useState("altitude");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await api.get("/positions");
        if (cancelled) {
          return;
        }
        const raw = response.data.positions || [];
        const mapped = raw
          .filter((item) => item.latitude != null && item.longitude != null)
          .map((item) => {
            const altitude = item.altitude || 0;
            const speedMs = item.velocity || 0;
            const speedKmh = speedMs * 3.6;
            return {
              id: item.id,
              callsign: item.callsign || "",
              originCountry: item.originCountry || "",
              latitude: item.latitude,
              longitude: item.longitude,
              altitude,
              speedMs,
              speedKmh,
              heading: item.heading || 0
            };
          });
        setPositions(mapped);
      } catch {
        if (!cancelled) {
          setPositions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const countries = useMemo(() => {
    const set = new Set();
    positions.forEach((item) => {
      if (item.originCountry) {
        set.add(item.originCountry);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [positions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const altitudeThreshold = altitudeFilter ? Number(altitudeFilter) : 0;
    const speedThreshold = speedFilter ? Number(speedFilter) : 0;
    let items = positions.filter((item) => {
      if (term) {
        const code = item.callsign.toLowerCase();
        if (!code.includes(term)) {
          return false;
        }
      }
      if (country && item.originCountry !== country) {
        return false;
      }
      if (altitudeThreshold && item.altitude * 0.3048 < altitudeThreshold) {
        return false;
      }
      if (speedThreshold && item.speedKmh < speedThreshold) {
        return false;
      }
      return true;
    });
    items = items.slice().sort((a, b) => {
      if (sortBy === "speed") {
        return (b.speedKmh || 0) - (a.speedKmh || 0);
      }
      return (b.altitude || 0) - (a.altitude || 0);
    });
    return items;
  }, [positions, search, country, altitudeFilter, speedFilter, sortBy]);

  return (
    <>
      <div className="relative z-10 min-h-screen w-full px-4 sm:px-6 lg:px-12 py-8 text-snow flex justify-center">
        <div className="space-y-8 w-full max-w-6xl">
          <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="space-y-6 rounded-[32px] px-6 py-8 border border-white/10 bg-[#030819]/80 shadow-2xl shadow-black/40">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-sky">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky animate-pulse-soft" />
                  Trafic aérien mondial en direct
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-snow">
                  Visualisation immersive des vols autour du globe.
                </h1>
              <p className="text-sm sm:text-base text-snow/70">
                Explorez les avions en temps réel sur une carte 3D infinie, filtrez par compagnie,
                pays, altitude ou vitesse sans quitter l&apos;espace.
              </p>
              <div className="pt-3">
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 rounded-full bg-sky text-night px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-sky/90"
                >
                  Carte interactive
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
              <div className="grid gap-3 sm:grid-cols-3 text-xs text-snow/70">
                <div className="rounded-2xl border border-white/10 bg-[#051126]/80 px-3 py-2.5 flex flex-col gap-1">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
                    Vols suivis
                  </span>
                  <span className="text-lg font-semibold text-snow">
                    {positions.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#051126]/80 px-3 py-2.5 flex flex-col gap-1">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
                    Pays couverts
                  </span>
                  <span className="text-lg font-semibold text-snow">
                    {countries.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#051126]/80 px-3 py-2.5 flex flex-col gap-1">
                  <span className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
                    Rafraîchissement
                  </span>
            <span className="text-lg font-semibold text-snow">
              5 s
            </span>
          </div>
        </div>
              <div className="rounded-3xl border border-white/10 bg-[#041227]/80 px-4 py-4 space-y-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-snow/70">
                      Compagnie ou numéro de vol
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs sm:text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/60"
                      placeholder="Ex. DLH9LX, AFR, KLM"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-snow/70">
                        Pays d&apos;origine
                      </label>
                      <select
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs sm:text-sm text-snow focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/60"
                      >
                        <option value="">Tous</option>
                        {countries.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-snow/70">
                        Tri
                      </label>
                      <div className="flex items-center gap-1 rounded-2xl bg-slate-950/80 border border-white/10 p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSortBy("altitude")}
                        className={`flex-1 px-2 py-1 rounded-2xl transition ${
                          sortBy === "altitude"
                            ? "bg-sky text-night font-semibold"
                            : "text-snow/70 hover:bg-white/10"
                        }`}
                        >
                          Altitude
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortBy("speed")}
                        className={`flex-1 px-2 py-1 rounded-2xl transition ${
                          sortBy === "speed"
                            ? "bg-sky text-night font-semibold"
                            : "text-snow/70 hover:bg-white/10"
                        }`}
                        >
                          Vitesse
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-snow/70">
                      Altitude minimale
                    </label>
                    <select
                      value={altitudeFilter}
                      onChange={(event) => setAltitudeFilter(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs sm:text-sm text-snow focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/60"
                    >
                      <option value="">Toutes</option>
                      <option value="8000">&gt; 8 000 m</option>
                      <option value="10000">&gt; 10 000 m</option>
                      <option value="12000">&gt; 12 000 m</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-snow/70">
                      Vitesse minimale
                    </label>
                    <select
                      value={speedFilter}
                      onChange={(event) => setSpeedFilter(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs sm:text-sm text-snow focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/60"
                    >
                      <option value="">Toutes</option>
                      <option value="400">&gt; 400 km/h</option>
                      <option value="500">&gt; 500 km/h</option>
                      <option value="700">&gt; 700 km/h</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
            <div className="flex flex-col gap-6">
              <div className="relative w-full h-[420px] sm:h-[480px] rounded-[36px] overflow-hidden">
                <div className="absolute inset-0 pointer-events-auto">
                  <Globe
                    className="w-full h-full"
                    cameraPosition={[0, 0, 6]}
                    fov={40}
                    minDistance={3.2}
                    maxDistance={7.5}
                    syncBackground
                    showTrack={false}
                    introAnimation
                    introKey="home-globe"
                    flightLayerOptions={{ clickable: false, maxItems: 150 }}
                  />
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-[#030819]/80 px-6 py-5 text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-1">
                  Altitude
                </div>
                <div className="h-2 rounded-full bg-gradient-to-r from-[#fb923c] via-[#fb7185] to-[#ec4899]" />
                <div className="flex justify-between text-[10px] text-white/60 mt-1">
                  <span>0 m</span>
                  <span>+12 000 m</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 items-start lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <section className="space-y-6">
              <div className="rounded-[32px] bg-[#030819]/80 border border-white/5 px-5 py-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-snow/60">
                  <span>Vols correspondant aux filtres</span>
                  <span>{filtered.length} éléments</span>
                </div>
                {loading ? (
                  <Loader />
                ) : (
                  <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                    {filtered.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-[#041227]/75 px-3 py-2.5 flex flex-col gap-1 text-xs text-snow/80"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-snow">
                            {item.callsign || "Vol inconnu"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-sky/10 text-[10px] text-sky">
                            {item.originCountry || "Pays inconnu"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px] text-snow/70">
                          <span className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-snow/50">
                              Altitude
                            </span>
                            <span>{item.altitude ? `${Math.round(item.altitude)} m` : "N/A"}</span>
                          </span>
                          <span className="flex flex-col text-right">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-snow/50">
                              Vitesse
                            </span>
                            <span>
                              {item.speedKmh ? `${Math.round(item.speedKmh)} km/h` : "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <div className="col-span-full rounded-2xl border border-white/10 bg-[#041227]/75 px-4 py-8 text-sm text-snow/70 text-center">
                        Aucun vol ne correspond aux filtres actuels.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
            <aside className="rounded-[32px] bg-[#030819]/80 border border-white/5 px-4 py-4 sm:px-5 sm:py-5 h-full flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-snow/60">
                    Vols visibles
                  </p>
                  <p className="text-sm text-snow/80">
                    Liste des appareils actuellement affichés.
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#041227]/75">
                <div className="border-b border-white/10 px-3 py-2.5 flex items-center justify-between text-[11px] text-snow/60">
                  <span>Vol</span>
                  <span className="flex gap-4">
                    <span>Altitude</span>
                    <span>Vitesse</span>
                  </span>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {loading ? (
                    <Loader />
                  ) : (
                    filtered.slice(0, 40).map((item) => (
                      <div
                        key={item.id}
                        className="px-3 py-2.5 flex items-center justify-between text-[11px] text-snow/80 border-b border-white/10 last:border-b-0 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-snow">
                            {item.callsign || "Vol inconnu"}
                          </span>
                          <span className="text-[10px] text-snow/60">
                            {item.originCountry || "Pays inconnu"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-snow/70">
                            {item.altitude ? `${Math.round(item.altitude)} m` : "N/A"}
                          </span>
                          <span className="text-[10px] text-snow/70">
                            {item.speedKmh ? `${Math.round(item.speedKmh)} km/h` : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {!loading && filtered.length === 0 && (
                    <div className="px-4 py-6 text-[11px] text-snow/70 text-center">
                      Aucun avion n&apos;est visible pour ces filtres.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
