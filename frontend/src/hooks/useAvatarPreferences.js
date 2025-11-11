// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "user_avatar_selection";
const EVENT_KEY = "skytracker-avatar-selection";

function readAvatarMap() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAvatarMap(map) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function useAvatarSelection(userId) {
  const [avatarId, setAvatarId] = useState(() => {
    if (!userId || typeof window === "undefined") {
      return null;
    }
    const map = readAvatarMap();
    return map[userId] || null;
  });

  useEffect(() => {
    if (!userId) {
      setAvatarId(null);
      return;
    }
    const handler = () => {
      const map = readAvatarMap();
      setAvatarId(map[userId] || null);
    };
    handler();
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener(EVENT_KEY, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_KEY, handler);
      window.removeEventListener("storage", handler);
    };
  }, [userId]);

  const saveAvatar = useCallback(
    (variantId) => {
      if (!userId) {
        return;
      }
      const map = readAvatarMap();
      if (variantId) {
        map[userId] = variantId;
      } else {
        delete map[userId];
      }
      writeAvatarMap(map);
      setAvatarId(variantId || null);
    },
    [userId]
  );

  return [avatarId, saveAvatar];
}

export function useAvatarMap() {
  const [map, setMap] = useState(() => readAvatarMap());
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = () => {
      setMap(readAvatarMap());
    };
    window.addEventListener(EVENT_KEY, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_KEY, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return map;
}
