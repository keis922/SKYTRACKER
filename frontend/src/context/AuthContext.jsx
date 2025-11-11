// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import api from "../api/client.js";

const TOKEN_KEY = "skytracker_token";
const LOCAL_ADMIN_TOKEN = "skytracker_admin_token";
const ADMIN_CREDENTIALS = {
  email: "admin@skytracker.dev",
  password: "FlyAdmin!2025",
  fullName: "SkyTracker Admin"
};
const LOCAL_ADMIN_USER = {
  id: "local-admin",
  email: ADMIN_CREDENTIALS.email,
  fullName: ADMIN_CREDENTIALS.fullName,
  username: "admin",
  role: "admin",
  isLocalAdmin: true
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((token) => {
    if (typeof window === "undefined") {
      return;
    }
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (token === LOCAL_ADMIN_TOKEN) {
      setUser(LOCAL_ADMIN_USER);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/local-auth/me");
      setUser(response.data.user || null);
    } catch {
      persistToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [persistToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (identifier, password) => {
      const normalizedRaw = (identifier || "").trim();
      const normalizedLower = normalizedRaw.toLowerCase();
      if (
        (normalizedLower === ADMIN_CREDENTIALS.email || normalizedLower === "admin") &&
        password === ADMIN_CREDENTIALS.password
      ) {
        persistToken(LOCAL_ADMIN_TOKEN);
        setUser(LOCAL_ADMIN_USER);
        return LOCAL_ADMIN_USER;
      }
      const payload =
        normalizedRaw.includes("@")
          ? { email: normalizedRaw, password }
          : { username: normalizedRaw, password };
      const response = await api.post("/local-auth/login", payload);
      persistToken(response.data.token);
      setUser(response.data.user || null);
      return response.data.user || null;
    },
    [persistToken]
  );

  const register = useCallback(
    async ({ email, password, fullName, username }) => {
      const response = await api.post("/local-auth/signup", { email, password, fullName, username });
      persistToken(response.data.token);
      setUser(response.data.user || null);
      return response.data;
    },
    [persistToken]
  );

  const logout = useCallback(async () => {
    try {
      if (user?.isLocalAdmin) {
        // nothing to do, purely local auth
      } else {
        await api.post("/local-auth/logout");
      }
    } catch {
      // ignore network issues when logging out
    }
    persistToken(null);
    setUser(null);
  }, [persistToken, user]);

  const resetPassword = useCallback(async (email) => {
    await api.post("/local-auth/reset-password", { email });
  }, []);

  const updateProfile = useCallback(async ({ fullName, email, password, username }) => {
    const response = await api.put("/local-auth/me", { fullName, email, password, username });
    setUser(response.data.user || null);
    return response.data.user || null;
  }, []);

  const deleteAccount = useCallback(async () => {
    if (user?.isLocalAdmin) {
      persistToken(null);
      setUser(null);
      return;
    }
    await api.delete("/local-auth/me");
    persistToken(null);
    setUser(null);
  }, [persistToken, user]);

  const profile = useMemo(() => {
    if (!user) {
      return null;
    }
    const fullName = user.fullName || user.full_name || user.email?.split("@")[0] || "";
    const username = user.username || user.pseudo || fullName.replace(/\s+/g, "").toLowerCase();
    return {
      ...user,
      full_name: fullName,
      username
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      deleteAccount,
      reloadUser: loadUser
    }),
    [user, profile, loading, login, register, logout, resetPassword, updateProfile, deleteAccount, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
