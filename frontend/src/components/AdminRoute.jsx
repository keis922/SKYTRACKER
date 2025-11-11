// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Navigate } from "react-router-dom";
import Loader from "./Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { profile, user, loading } = useAuth();
  const role = profile?.role || user?.role;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
