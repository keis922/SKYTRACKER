// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const TransitionContext = createContext({ transitioning: false, triggerTransition: () => {} });

export function TransitionProvider({ children }) {
  const triggerTransition = useCallback(() => {}, []);
  const value = useMemo(() => ({ transitioning: false, triggerTransition }), [triggerTransition]);
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function useRouteTransition() {
  return useContext(TransitionContext);
}
