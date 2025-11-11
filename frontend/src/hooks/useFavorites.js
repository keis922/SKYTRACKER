// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { useCallback, useEffect, useState } from "react";
import api from "../api/client.js";

export function useFavorites(enabled) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEnabled = Boolean(enabled);

  const load = useCallback(async () => {
    if (!isEnabled) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/favorites");
      setFavorites(response.data.favorites || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = useCallback(
    async (flight) => {
      if (!isEnabled || !flight) {
        return;
      }
      try {
        const response = await api.post("/favorites", { flight });
        setFavorites(response.data.favorites || []);
      } catch {
        // ignore api errors
      }
    },
    [isEnabled]
  );

  const updateFavoriteStatus = useCallback(
    async (favoriteId, isActive) => {
      if (!isEnabled || !favoriteId) {
        return;
      }
      try {
        const response = await api.put(`/favorites/${favoriteId}`, { is_active: isActive });
        setFavorites(response.data.favorites || []);
      } catch {
        // ignore api errors
      }
    },
    [isEnabled]
  );

  const addManualFavorite = useCallback(
    async (code) => {
      if (!isEnabled || !code) {
        return;
      }
      try {
        const response = await api.post("/favorites/manual", { code });
        setFavorites(response.data.favorites || []);
      } catch {
      }
    },
    [isEnabled]
  );

  const removeFavorite = useCallback(
    async (favoriteId) => {
      if (!isEnabled || !favoriteId) {
        return;
      }
      try {
        const response = await api.delete(`/favorites/${favoriteId}`);
        setFavorites(response.data.favorites || []);
      } catch {
        // ignore api errors
      }
    },
    [isEnabled]
  );

  return {
    favorites,
    loading,
    toggleFavorite,
    reload: load,
    updateFavoriteStatus,
    addManualFavorite,
    removeFavorite
  };
}
