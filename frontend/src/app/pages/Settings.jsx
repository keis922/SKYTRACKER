// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import PlanetAvatar from "../../components/PlanetAvatar.jsx";
import { PLANET_AVATARS } from "../../data/planetAvatars.js";
import { useAvatarSelection } from "../../hooks/useAvatarPreferences.js";

export default function Settings() {
  const { profile, updateProfile, deleteAccount } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const userId = profile?.id || profile?.email || "";
  const [avatarId, setAvatarId] = useAvatarSelection(userId);
  const selectablePlanets = PLANET_AVATARS.filter((planet) =>
    ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"].includes(
      planet.id
    )
  );
  const fallbackPlanet =
    selectablePlanets.find((planet) => planet.id === "earth") || selectablePlanets[0];
  const [previewPlanetId, setPreviewPlanetId] = useState(() => avatarId || fallbackPlanet.id);
  useEffect(() => {
    setPreviewPlanetId(avatarId || fallbackPlanet.id);
  }, [avatarId, fallbackPlanet.id]);
  const currentPlanet =
    selectablePlanets.find((planet) => planet.id === previewPlanetId) || fallbackPlanet;

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setEmail(profile?.email || "");
    setUsername(profile?.username || profile?.full_name || profile?.email || "");
  }, [profile]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Mise à jour...");
    try {
      await updateProfile({ fullName, email, password: password || undefined, username });
      setStatus("Profil mis à jour");
      setPassword("");
    } catch (error) {
      setStatus(error.message || "Mise à jour impossible");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement le compte ?")) {
      return;
    }
    await deleteAccount();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Paramètres</p>
        <h1 className="text-2xl font-semibold text-snow">Personnalisation du compte</h1>
      </div>
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] space-y-4">
        <h2 className="text-lg font-semibold text-snow">Informations personnelles</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-snow/60">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-snow"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-snow/60">Pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-snow"
              placeholder="CapitaineAstre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-snow/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-snow"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-snow/60">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-snow"
              placeholder="Laisser vide pour conserver"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-full bg-white/90 text-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
        >
          Enregistrer
        </button>
        {status && <p className="text-xs text-snow/60">{status}</p>}
      </form>
      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-snow">Avatar planétaire</h2>
          <p className="text-sm text-snow/60">
            Choisissez un globe 3D animé qui apparaîtra à côté de vos messages sur le forum.
          </p>
        </div>
        {userId ? (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-transparent p-4">
              <PlanetAvatar variantId={currentPlanet?.id} size={96} />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-snow/60">
                  Avatar actuel
                </p>
                <p className="text-lg font-semibold text-snow">
                  {currentPlanet?.label}
                </p>
                <p className="text-xs text-snow/60">Choisissez librement parmi toutes les planètes du système solaire.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectablePlanets.map((planet) => {
                const selected = avatarId === planet.id;
                const previewed = previewPlanetId === planet.id;
                return (
                  <button
                    type="button"
                    key={planet.id}
                    onClick={() => {
                      setAvatarId(planet.id);
                      setPreviewPlanetId(planet.id);
                    }}
                    className={`flex flex-col items-center gap-3 rounded-2xl border px-3 py-4 transition ${
                      previewed
                        ? "border-sky bg-sky/15 text-snow shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                        : "border-white/10 bg-transparent text-snow/70 hover:border-sky/40 hover:text-snow"
                    }`}
                  >
                    <PlanetAvatar variantId={planet.id} size={72} staticOnly />
                    <span className="text-sm font-semibold">{planet.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-snow/60">
            Connectez-vous pour personnaliser votre avatar planétaire.
          </p>
        )}
      </section>
      <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] space-y-4">
        <h2 className="text-lg font-semibold text-rose-200">Zone critique</h2>
        <p className="text-sm text-rose-200">
          Supprimer le compte efface l'historique, les favoris et les alertes.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-full bg-rose-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
