// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useMemo, useState } from "react";
import Globe from "../../components/Globe.jsx";
import PlanetAvatar from "../../components/PlanetAvatar.jsx";
import AnonymousAvatar from "../../components/AnonymousAvatar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFlightsStore } from "../../store/useFlightsStore.js";
import { useForumStore, GENERAL_TOPICS } from "../../store/useForumStore.js";
import { useAvatarMap } from "../../hooks/useAvatarPreferences.js";

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "à l'instant";
  }
  const diff = Date.now() - date.getTime();
  if (diff < 1000 * 60) {
    return "à l'instant";
  }
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function summarizeFlight(flight) {
  if (!flight) {
    return null;
  }
  const code =
    flight.callsign ||
    flight.flightNumber ||
    flight.flight_iata ||
    flight.icao24 ||
    flight.id ||
    "";
  return {
    id: flight.icao24 || flight.id || code || `flight-${Date.now()}`,
    label: code.trim() || "Vol sans identifiant",
    airline: flight.airline || flight.originCountry || "Compagnie inconnue",
    departure: flight.departureAirport || flight.departureCountry || flight.originCountry || "N/A",
    arrival: flight.arrivalAirport || flight.arrivalCountry || "N/A"
  };
}

function buildDisplayName(profile, user) {
  if (profile?.full_name) {
    return profile.full_name;
  }
  if (user?.fullName) {
    return user.fullName;
  }
  if (user?.email) {
    return user.email.split("@")[0];
  }
  return "ANONYME";
}

export default function ForumPage() {
  const { user, profile } = useAuth();
  const displayName = buildDisplayName(profile, user);
  const isAdmin = (profile?.role || user?.role) === "admin";
  const authUserId = user?.id || user?.email || profile?.email || null;
  const canReact = Boolean(authUserId);
  const avatarMap = useAvatarMap();
  const threads = useForumStore((state) => state.threads);
  const activeThreadId = useForumStore((state) => state.activeThreadId);
  const setActiveThreadId = useForumStore((state) => state.setActiveThreadId);
  const createThread = useForumStore((state) => state.createThread);
  const replyToThread = useForumStore((state) => state.replyToThread);
  const reactToMessage = useForumStore((state) => state.reactToMessage);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicType, setTopicType] = useState("general");
  const [topicTheme, setTopicTheme] = useState(GENERAL_TOPICS[0].value);
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [flightQuery, setFlightQuery] = useState("");
  const [flightSelection, setFlightSelection] = useState(null);
  const [selectionMode, setSelectionMode] = useState("list");
  const [postAsAdmin, setPostAsAdmin] = useState(false);
  const [replyAsAdmin, setReplyAsAdmin] = useState(false);
  const [creationFeedback, setCreationFeedback] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    setPostAsAdmin(isAdmin);
    setReplyAsAdmin(isAdmin);
  }, [isAdmin]);

  const flights = useFlightsStore((state) => state.flights);
  const startLiveUpdates = useFlightsStore((state) => state.updateFlightsLoop);
  const stopLiveUpdates = useFlightsStore((state) => state.stopFlightsLoop);
  const storeSelectedFlight = useFlightsStore((state) => state.selectedFlight);
  const clearSelection = useFlightsStore((state) => state.clearSelection);

  useEffect(() => {
    startLiveUpdates();
    clearSelection();
    return () => {
      stopLiveUpdates();
      clearSelection();
    };
  }, [startLiveUpdates, stopLiveUpdates, clearSelection]);

  useEffect(() => {
    if (selectionMode !== "map") {
      return;
    }
    if (!storeSelectedFlight) {
      return;
    }
    const summary = summarizeFlight(storeSelectedFlight);
    setFlightSelection(summary);
  }, [selectionMode, storeSelectedFlight]);

  useEffect(() => {
    if (selectionMode !== "map") {
      clearSelection();
    }
  }, [selectionMode, clearSelection]);

  const sortedThreads = useMemo(() => {
    return threads
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
  }, [threads]);

useEffect(() => {
  if (!sortedThreads.length) {
    return;
  }
  const exists = sortedThreads.some((thread) => thread.id === activeThreadId);
  if (!activeThreadId || !exists) {
    setActiveThreadId(sortedThreads[0].id);
  }
}, [sortedThreads, activeThreadId, setActiveThreadId]);
useEffect(() => {
  setReplyTarget(null);
}, [activeThreadId]);

  const activeThread = useMemo(
    () => sortedThreads.find((thread) => thread.id === activeThreadId) || sortedThreads[0] || null,
    [sortedThreads, activeThreadId]
  );
  const activeThreadDeleted = Boolean(activeThread?.deleted);

  const filteredFlights = useMemo(() => {
    if (!flights?.length) {
      return [];
    }
    const normalizedQuery = flightQuery.trim().toLowerCase();
    const capped = flights.slice(0, 250);
    if (!normalizedQuery) {
      return capped.slice(0, 30);
    }
    return capped
      .filter((flight) => {
        const text = [
          flight.callsign,
          flight.flightNumber,
          flight.flight_iata,
          flight.airline,
          flight.departureAirport,
          flight.arrivalAirport,
          flight.originCountry
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(normalizedQuery);
      })
      .slice(0, 40);
  }, [flights, flightQuery]);

  function handleSelectFlight(flight) {
    const summary = summarizeFlight(flight);
    setFlightSelection(summary);
  }

  function handleCreateThread(event) {
    event.preventDefault();
    const themeLabel =
      GENERAL_TOPICS.find((option) => option.value === topicTheme)?.label || "Application";
    const fallbackTitle =
      topicType === "general"
        ? `Salon ${themeLabel}`
        : flightSelection?.label
          ? `Vol ${flightSelection.label}`
          : "Salon vol";
    const title = topicTitle.trim() || fallbackTitle;
    const message = newMessage.trim();
    if (!title || !message) {
      return;
    }
    if (topicType === "flight" && !flightSelection) {
      return;
    }
    const author = isAdmin && postAsAdmin ? "ADMIN" : displayName || "ANONYME";
    const authorRole = isAdmin && postAsAdmin ? "admin" : "user";
    const result = createThread({
      title,
      type: topicType,
      theme: topicTheme,
      message,
      flight: flightSelection,
      author,
      authorRole,
      authorId: authUserId || null
    });
    setTopicTitle("");
    setNewMessage("");
    setFlightSelection(null);
    setFlightQuery("");
    setSelectionMode("list");
    if (result?.reused) {
      setCreationFeedback("Ce salon existe déjà : votre message a été ajouté à la discussion correspondante.");
    } else {
      setCreationFeedback("Salon créé avec succès !");
    }
  }

  function handleReply(event) {
    event.preventDefault();
    const message = replyMessage.trim();
    if (!activeThread || !message || activeThread.deleted) {
      return;
    }
    const author = isAdmin && replyAsAdmin ? "ADMIN" : displayName || "ANONYME";
    const authorRole = isAdmin && replyAsAdmin ? "admin" : "user";
    replyToThread({
      threadId: activeThread.id,
      message,
      author,
      authorRole,
      replyToMessageId: replyTarget?.messageId || null,
      authorId: authUserId || null
    });
    setReplyMessage("");
    setReplyTarget(null);
  }

  function handleReactToMessage(message, action) {
    if (!activeThread || !message || message.deleted || activeThreadDeleted) {
      return;
    }
    if (!canReact || !authUserId) {
      return;
    }
    if (action === "dislike" && message.role === "admin") {
      return;
    }
    const reactionMap = message.reactionMap || {};
    const previousAction = reactionMap[authUserId] || null;
    const nextAction = previousAction === action ? null : action;
    reactToMessage({
      threadId: activeThread.id,
      messageId: message.id,
      newAction: nextAction,
      previousAction,
      userId: authUserId
    });
  }

  function startReplyToMessage(message) {
    if (!message || message.deleted || activeThreadDeleted) {
      return;
    }
    setReplyTarget({
      messageId: message.id,
      author: message.author || "Utilisateur",
      excerpt: (message.content || "").slice(0, 140)
    });
  }

  function cancelReplyTarget() {
    setReplyTarget(null);
  }

  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-sky/80">Forum collaboratif</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-snow">Partagez vos retours et échanges.</h1>
              <p className="text-sm text-snow/70">
                Tous les comptes peuvent poster. Sans authentification, vos messages apparaissent sous le
                nom <span className="font-semibold text-snow">ANONYME</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-snow/70">
              Connecté en tant que{" "}
              <span className="font-semibold text-snow">{displayName || "ANONYME"}</span>
            </div>
          </div>
        </header>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="space-y-6 rounded-3xl border border-white/15 bg-night/50 px-4 py-6 sm:px-6 sm:py-7 shadow-lg shadow-black/40">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.35em] text-snow/60">Créer un salon</p>
              <h2 className="text-xl font-semibold text-snow">Nouveau sujet</h2>
              <p className="text-xs text-snow/60">
                Choisissez le type de discussion : retour global sur l&apos;appli ou suivi d&apos;un vol.
              </p>
            </div>
            {creationFeedback && (
              <div className="flex items-center justify-between rounded-2xl border border-sky/40 bg-sky/15 px-3 py-2 text-xs text-sky">
                <span>{creationFeedback}</span>
                <button
                  type="button"
                  onClick={() => setCreationFeedback(null)}
                  className="rounded-full border border-sky/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em]"
                >
                  OK
                </button>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleCreateThread}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/50">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "general", label: "Application" },
                      { value: "flight", label: "Vol" }
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => setTopicType(option.value)}
                        className={`flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                          topicType === option.value
                            ? "border-sky bg-sky/20 text-snow"
                            : "border-white/15 bg-white/5 text-snow/70 hover:text-snow"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/50">
                    Nom du salon
                  </label>
                  <input
                    type="text"
                    value={topicTitle}
                    onChange={(event) => setTopicTitle(event.target.value)}
                    placeholder="Ex. Améliorer la lisibilité du dashboard"
                    className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:border-sky/60 focus:outline-none focus:ring-2 focus:ring-sky/40"
                  />
                </div>
              </div>
              {topicType === "general" ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/50">
                    Thématique
                  </label>
                  <select
                    value={topicTheme}
                    onChange={(event) => setTopicTheme(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-sm text-snow focus:border-sky/60 focus:outline-none focus:ring-2 focus:ring-sky/40"
                  >
                    {GENERAL_TOPICS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em] text-snow/50">
                    <span>Sélection du vol</span>
                    <div className="flex gap-2 rounded-full border border-white/20 px-3 py-1 text-[10px] text-snow/70">
                      {["list", "map"].map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => setSelectionMode(mode)}
                          className={`rounded-full px-3 py-0.5 font-semibold transition ${
                            selectionMode === mode ? "bg-sky/80 text-night" : "bg-transparent text-snow/60"
                          }`}
                        >
                          {mode === "list" ? "Liste" : "Carte"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectionMode === "list" ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={flightQuery}
                        onChange={(event) => setFlightQuery(event.target.value)}
                        placeholder="Rechercher AFR, DLH, numéro de vol..."
                        className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:border-sky/60 focus:outline-none focus:ring-2 focus:ring-sky/40"
                      />
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {filteredFlights.length === 0 && (
                          <p className="text-xs text-snow/50">
                            Aucun vol disponible pour le moment. Ouvrez la carte pour en sélectionner un.
                          </p>
                        )}
                        {filteredFlights.map((flight) => {
                          const summary = summarizeFlight(flight);
                          const selected = flightSelection?.id === summary.id;
                          return (
                            <button
                              type="button"
                              key={summary.id}
                              onClick={() => handleSelectFlight(flight)}
                              className={`w-full rounded-2xl border px-3 py-2 text-left text-xs transition ${
                                selected
                                  ? "border-sky bg-sky/20 text-snow"
                                  : "border-white/10 bg-white/5 text-snow/70 hover:border-sky/50 hover:text-snow"
                              }`}
                            >
                              <span className="font-semibold text-sm text-snow">{summary.label}</span>
                              <span className="block text-[11px] text-snow/60">
                                {summary.departure} → {summary.arrival} · {summary.airline}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-80 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                        <Globe
                          className="h-80"
                          canvasClassName="!h-80"
                          showTrack={false}
                          flightLayerOptions={{ clickable: true, maxItems: 300 }}
                          airportLayerOptions={null}
                          introAnimation={false}
                          syncBackground={false}
                        />
                      </div>
                      <p className="text-[11px] text-snow/60">
                        Cliquez sur un avion pour pré-remplir le salon. La sélection courante s&apos;affichera ci-dessous.
                      </p>
                    </div>
                  )}
                  {flightSelection && (
                    <div className="rounded-2xl border border-sky/50 bg-sky/10 px-3 py-2 text-xs text-snow">
                      Vol sélectionné :{" "}
                      <span className="font-semibold">{flightSelection.label}</span> ·{" "}
                      {flightSelection.departure} → {flightSelection.arrival}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/50">
                  Message
                </label>
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  rows={5}
                  placeholder="Votre premier message dans ce salon..."
                  className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:border-sky/60 focus:outline-none focus:ring-2 focus:ring-sky/40"
                />
              </div>
              {isAdmin && (
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/60">
                  <input
                    type="checkbox"
                    checked={postAsAdmin}
                    onChange={(event) => setPostAsAdmin(event.target.checked)}
                    className="h-4 w-4 rounded border border-white/40 bg-transparent text-sky focus:ring-sky"
                  />
                  Publier en tant qu&apos;ADMIN
                </label>
              )}
              <button
                type="submit"
                className="w-full rounded-2xl bg-sky px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-night shadow-lg shadow-sky/30 transition hover:bg-sky/90"
              >
                Publier le salon
              </button>
            </form>
          </section>
          <section className="space-y-6 rounded-3xl border border-white/15 bg-white/5 px-4 py-6 sm:px-6 sm:py-7 shadow-lg shadow-black/35">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-snow/60">Salons actifs</p>
                <h2 className="text-xl font-semibold text-snow">Discussions ouvertes</h2>
              </div>
              <span className="rounded-full border border-white/20 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-snow/70">
                {sortedThreads.length} salons
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
            {sortedThreads.map((thread) => {
              const isActive = activeThread?.id === thread.id;
              const deleted = thread.deleted;
              const badgeLabel =
                deleted
                  ? "Salon supprimé"
                  : thread.type === "flight"
                    ? `Vol • ${thread.flight?.label || "Sélection à venir"}`
                    : GENERAL_TOPICS.find((item) => item.value === thread.theme)?.label || "Application";
              return (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-sky bg-sky/15 text-snow"
                      : deleted
                        ? "border-rose-400/60 bg-rose-500/10 text-rose-100"
                        : "border-white/10 bg-white/5 text-snow/70 hover:border-sky/40 hover:text-snow"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-snow/60">
                    <span>{badgeLabel}</span>
                    <span>{formatRelativeTime(thread.updatedAt || thread.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-snow">
                    {deleted ? "Ce salon a été supprimé" : thread.title}
                  </p>
                  <p className="text-[11px] text-snow/70">
                    {thread.messages.length} message{thread.messages.length > 1 ? "s" : ""}
                  </p>
                </button>
              );
              })}
            </div>
            {activeThread ? (
              <div className="space-y-4 rounded-2xl border border-white/15 bg-night/40 p-4 sm:p-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/60">
                    <span>Salon sélectionné</span>
                    {activeThread.type === "flight" && activeThread.flight && (
                      <span className="rounded-full bg-sky/20 px-3 py-0.5 text-sky">
                        {activeThread.flight.label} · {activeThread.flight.departure} →{" "}
                        {activeThread.flight.arrival}
                      </span>
                    )}
                    {activeThreadDeleted && (
                      <span className="rounded-full border border-rose-400/70 bg-rose-500/10 px-3 py-0.5 text-rose-100">
                        Salon supprimé
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-snow">{activeThread.title}</h3>
                </div>
                {activeThreadDeleted && (
                  <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    Ce salon a été supprimé par un administrateur. Les nouveaux messages sont désactivés.
                  </p>
                )}
                <div className="space-y-3">
                  {activeThread.messages.map((message) => {
                    const adminVoice = message.role === "admin";
                    const deleted = message.deleted;
                    const cardClass = deleted
                      ? "border-rose-400/50 bg-rose-500/10 text-rose-50"
                      : adminVoice
                        ? "border-amber-400/80 bg-amber-500/10 text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.35)] animate-pulse"
                        : "border-white/10 bg-white/5 text-snow/90";
                    const replyReference =
                      message.replyTo && activeThread
                        ? activeThread.messages.find((candidate) => candidate.id === message.replyTo)
                        : null;
                    const reaction = authUserId ? message.reactionMap?.[authUserId] || null : null;
                    const avatarVariant =
                      message.authorId && avatarMap[message.authorId]
                        ? avatarMap[message.authorId]
                        : "mercury";
                    const isAnonymous = !message.authorId;
                    return (
                      <article
                        key={message.id}
                        className={`rounded-2xl border px-4 py-3 text-sm transition ${cardClass}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            {isAnonymous ? (
                              <AnonymousAvatar size={56} className="h-14 w-14" />
                            ) : (
                              <PlanetAvatar
                                variantId={avatarVariant || "mercury"}
                                size={56}
                                className="h-14 w-14"
                                staticOnly={false}
                              />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.35em]">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-sm font-semibold tracking-[0.2em] ${
                                    adminVoice ? "text-amber-100" : deleted ? "text-rose-100" : "text-snow"
                                  }`}
                                >
                                  {message.author || "ANONYME"}
                                </span>
                                {adminVoice && (
                                  <span className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-100">
                                    ADMIN
                                  </span>
                                )}
                                {deleted && (
                                  <span className="inline-flex items-center rounded-full border border-rose-300/60 bg-rose-500/20 px-2 py-0.5 text-[9px] font-semibold text-rose-100">
                                    Supprimé
                                  </span>
                                )}
                              </div>
                              <span className={adminVoice ? "text-amber-200" : deleted ? "text-rose-200" : "text-snow/40"}>
                                {formatRelativeTime(message.createdAt)}
                              </span>
                            </div>
                            {replyReference && (
                              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-snow/70">
                                Réponse à <strong>{replyReference.author || "Utilisateur"}</strong> —{" "}
                                <em>
                                  "
                                  {replyReference.deleted
                                    ? "Message supprimé"
                                    : (replyReference.content || "").slice(0, 120)}
                                  "
                                </em>
                              </div>
                            )}
                            <p className={`text-sm ${adminVoice ? "text-amber-50" : deleted ? "text-rose-50" : "text-snow/80"}`}>
                              {deleted ? "Ce message a été supprimé par un modérateur." : message.content}
                            </p>
                            {!deleted && (
                              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em]">
                                <button
                                  type="button"
                                  onClick={() => handleReactToMessage(message, "like")}
                                  disabled={activeThreadDeleted || !canReact}
                                  className={`rounded-full border px-3 py-1 ${
                                    reaction === "like"
                                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                                      : "border-white/15 text-snow/70 hover:border-emerald-300 hover:text-snow"
                                  } disabled:opacity-50`}
                                >
                                  👍 {message.likes || 0}
                                </button>
                                {!adminVoice && (
                                  <button
                                    type="button"
                                    onClick={() => handleReactToMessage(message, "dislike")}
                                    disabled={activeThreadDeleted || !canReact}
                                    className={`rounded-full border px-3 py-1 ${
                                      reaction === "dislike"
                                        ? "border-rose-400 bg-rose-500/20 text-rose-100"
                                        : "border-white/15 text-snow/70 hover:border-rose-300 hover:text-snow"
                                    } disabled:opacity-50`}
                                  >
                                    👎 {message.dislikes || 0}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startReplyToMessage(message)}
                                  disabled={activeThreadDeleted}
                                  className="rounded-full border border-white/15 px-3 py-1 text-snow/70 hover-border-sky/60 hover:text-snow disabled:opacity-50"
                                >
                                  Répondre
                                </button>
                                {!canReact && (
                                  <span className="text-[10px] text-snow/50">
                                    Connectez-vous pour voter.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  <form className="space-y-2 pt-2" onSubmit={handleReply}>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/50">
                      Répondre
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:border-sky/60 focus:outline-none focus:ring-2 focus:ring-sky/40 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={activeThreadDeleted}
                      placeholder={
                        activeThreadDeleted
                          ? "Ce salon est fermé (supprimé par l'équipe)."
                          : "Partager un retour ou une précision..."
                      }
                    />
                    {replyTarget && (
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky/40 bg-sky/10 px-3 py-2 text-xs text-sky">
                        <span>
                          Réponse à <strong>{replyTarget.author}</strong> —{" "}
                          <em className="text-snow/80">"{replyTarget.excerpt}"</em>
                        </span>
                        <button
                          type="button"
                          onClick={cancelReplyTarget}
                          className="rounded-full border border-sky/60 px-3 py-0.5 text-[10px] uppercase tracking-[0.25em]"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                    {isAdmin && (
                      <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/60">
                        <input
                          type="checkbox"
                          checked={replyAsAdmin}
                          onChange={(event) => setReplyAsAdmin(event.target.checked)}
                          className="h-4 w-4 rounded border border-white/40 bg-transparent text-amber-400 focus:ring-amber-300"
                        />
                        Répondre en tant qu&apos;ADMIN
                      </label>
                    )}
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-sky/60 bg-sky/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-sky hover:bg-sky/20 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={activeThreadDeleted}
                    >
                      Publier la réponse
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <p className="text-sm text-snow/70">Aucun salon sélectionné.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
