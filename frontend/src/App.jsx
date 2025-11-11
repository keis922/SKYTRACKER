// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./public-site/layouts/PublicLayout.jsx";
import HomePage from "./public-site/pages/HomePage.jsx";
import MapPage from "./public-site/pages/MapPage.jsx";
import Flights from "./public-site/pages/Flights.jsx";
import ForumPage from "./public-site/pages/ForumPage.jsx";
import AuthPublicLayout from "./auth/AuthPublicLayout.jsx";
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import DashboardLayout from "./app/layouts/DashboardLayout.jsx";
import DashboardHome from "./app/pages/DashboardHome.jsx";
import MyFlights from "./app/pages/MyFlights.jsx";
import Settings from "./app/pages/Settings.jsx";
import AdminDashboard from "./app/pages/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AppThemeProvider } from "./context/AppThemeContext.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

export default function App() {
  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target) {
        return false;
      }
      if (target.isContentEditable) {
        return true;
      }
      const element = target instanceof Element ? target : target?.parentElement;
      if (!element) {
        return false;
      }
      const tag = element.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) {
        return true;
      }
      return Boolean(element.closest("[data-allow-selection]"));
    };
    const handleSelectStart = (event) => {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };
    const clearSelection = () => {
      const active = document.activeElement;
      if (isEditableTarget(active)) {
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        selection.removeAllRanges();
      }
    };
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("selectionchange", clearSelection);
    return () => {
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("selectionchange", clearSelection);
    };
  }, []);

  return (
    <AuthProvider>
      <AppThemeProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/forum" element={<ForumPage />} />
          </Route>
          <Route element={<AuthPublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="my-flights" element={<MyFlights />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route path="forum" element={<ForumPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppThemeProvider>
    </AuthProvider>
  );
}
