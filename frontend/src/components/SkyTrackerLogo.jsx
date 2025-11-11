// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";

export default function SkyTrackerLogo({ size = 44 }) {
  return (
    <div
      className="rounded-full shadow-[0_12px_30px_rgba(99,102,241,0.35)] bg-gradient-to-br from-[#0ea5e9] via-[#6366f1] to-[#ec4899] flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label="Sky Tracker logo"
    >
      <svg
        width={size * 0.9}
        height={size * 0.9}
        viewBox="0 0 64 64"
        fill="none"
      >
        <defs>
          <linearGradient id="logo-inner" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="logo-plane" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill="url(#logo-inner)" opacity="0.95" />
        <circle
          cx="32"
          cy="32"
          r="23"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeDasharray="6 4"
        />
        <path
          d="M18 38c10-4 18-8 28-16"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M21 44c8-3 16-6 25-12"
          stroke="#f472b6"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <g transform="translate(32 28) rotate(-12)">
          <path
            d="M0 -10 L4 -2 L10 -1 L0 12 L-10 -1 L-4 -2 Z"
            fill="url(#logo-plane)"
            stroke="#bae6fd"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <path
            d="M0 -10 L0 -16"
            stroke="#bae6fd"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M-4 2 L4 2"
            stroke="#bae6fd"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}
