// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useForumStore } from "../../store/useForumStore.js";
import PlanetAvatar from "../../components/PlanetAvatar.jsx";
import AnonymousAvatar from "../../components/AnonymousAvatar.jsx";
import { useAvatarMap } from "../../hooks/useAvatarPreferences.js";

const initialUsers = [
  {
    id: 1,
    name: "Keis Aissaoui",
    email: "keis@example.com",
    role: "admin",
    status: "active",
    lastSeen: "il y a 5 min"
  },
  {
    id: 2,
    name: "Tristan Hardouin",
    email: "tristan@example.com",
    role: "moderator",
    status: "active",
    lastSeen: "il y a 42 min"
  },
  {
    id: 3,
    name: "Marie Dupont",
    email: "marie@example.com",
    role: "user",
    status: "pending",
    lastSeen: "Jamais"
  },
  {
    id: 4,
    name: "Observateur",
    email: "obs@example.com",
    role: "user",
    status: "active",
    lastSeen: "il y a 2 h"
  }
];

function formatRelativeTime(dateString) {
  if (!dateString) {
    return "à l'instant";
  }
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

export default function AdminDashboard() {
  const { profile } = useAuth();
  const threads = useForumStore((state) => state.threads);
  const activeThreadId = useForumStore((state) => state.activeThreadId);
  const setActiveThreadId = useForumStore((state) => state.setActiveThreadId);
  const replyToThread = useForumStore((state) => state.replyToThread);
  const deleteThread = useForumStore((state) => state.deleteThread);
  const deleteMessage = useForumStore((state) => state.deleteMessage);
  const avatarMap = useAvatarMap();
  const [moderationMessage, setModerationMessage] = useState("");
  const [users, setUsers] = useState(initialUsers);

  const sortedThreads = useMemo(() => {
    return threads
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
  }, [threads]);

  const activeThread = useMemo(
    () => sortedThreads.find((thread) => thread.id === activeThreadId) || sortedThreads[0] || null,
    [sortedThreads, activeThreadId]
  );

  const totalMessages = useMemo(
    () => threads.reduce((sum, thread) => sum + thread.messages.length, 0),
    [threads]
  );

  function handleModerationReply(event) {
    event.preventDefault();
    const message = moderationMessage.trim();
    if (!activeThread || !message || activeThread.deleted) {
      return;
    }
    replyToThread({
      threadId: activeThread.id,
      message,
      author: "ADMIN",
      authorRole: "admin"
    });
    setModerationMessage("");
  }

  function handleDeleteThread(thread) {
    if (!thread || thread.deleted) {
      return;
    }
    deleteThread({
      threadId: thread.id,
      author: profile?.full_name || "ADMIN"
    });
  }

  function handleDeleteMessage(thread, message) {
    if (!thread || !message || message.deleted) {
      return;
    }
    deleteMessage({
      threadId: thread.id,
      messageId: message.id,
      author: profile?.full_name || "ADMIN"
    });
  }

  function toggleStatus(userId) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "active" ? "suspended" : "active"
            }
          : user
      )
    );
  }

  function toggleRole(userId) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              role: user.role === "moderator" ? "user" : "moderator"
            }
          : user
      )
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Espace Admin</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-snow">Dashboard de modération</h1>
            <p className="text-sm text-snow/70">
              Gérez les salons du forum et surveillez les comptes utilisateurs.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/60 bg-amber-500/15 px-4 py-3 text-xs text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
            Connecté en tant que <span className="font-semibold">ADMIN</span> · {profile?.email}
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Salons actifs", value: threads.length },
          { label: "Messages postés", value: totalMessages },
          {
            label: "Dernière activité",
            value: threads[0] ? formatRelativeTime(threads[0].updatedAt || threads[0].createdAt) : "—"
          }
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-snow/70"
          >
            <p className="uppercase tracking-[0.3em] text-[10px] text-snow/50">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-snow">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-5 rounded-3xl border border-amber-300/20 bg-night/60 px-5 py-6 shadow-2xl shadow-amber-500/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-amber-100/80">Modération</p>
              <h2 className="text-2xl font-semibold text-snow">Salons du forum</h2>
            </div>
            <span className="rounded-full border border-amber-200/40 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-amber-100">
              {threads.length} salons
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedThreads.map((thread) => {
              const isActive = activeThread?.id === thread.id;
              const deleted = thread.deleted;
              return (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`rounded-2xl border px-3 py-3 text-left text-xs transition ${
                    isActive
                      ? "border-amber-400 bg-amber-500/15 text-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                      : "border-white/10 bg-white/5 text-snow/70 hover:border-amber-200 hover:text-snow"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em]">
                    <span>
                      {deleted ? "Salon supprimé" : thread.type === "flight" ? "Salon vol" : "Salon app"}
                    </span>
                    <span>{formatRelativeTime(thread.updatedAt || thread.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-snow">
                    {deleted ? "Ce salon a été supprimé" : thread.title}
                  </p>
                  <p className="text-[11px] text-snow/60">
                    {thread.messages.length} message{thread.messages.length > 1 ? "s" : ""}
                  </p>
                </button>
              );
            })}
          </div>
          {activeThread ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-snow/60">
                <span>Salon sélectionné</span>
                {activeThread.flight && (
                  <span className="rounded-full border border-sky/40 px-3 py-0.5 text-sky">
                    {activeThread.flight.label}
                  </span>
                )}
                {activeThread.deleted && (
                  <span className="rounded-full border border-rose-400/60 px-3 py-0.5 text-rose-100">
                    Supprimé
                  </span>
                )}
                {!activeThread.deleted && (
                  <button
                    type="button"
                    onClick={() => handleDeleteThread(activeThread)}
                    className="ml-auto rounded-full border border-rose-400/70 px-3 py-0.5 text-[10px] font-semibold text-rose-100 hover:bg-rose-500/10"
                  >
                    Supprimer le salon
                  </button>
                )}
              </div>
              <h3 className="mt-2 text-xl font-semibold text-snow">{activeThread.title}</h3>
              {activeThread.deleted && (
                <p className="mt-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  Ce salon a été supprimé par {activeThread.deletedBy || "ADMIN"}.
                </p>
              )}
              <div className="mt-4 space-y-3">
                {activeThread.messages.map((message) => {
                  const adminVoice = message.role === "admin";
                  const deleted = message.deleted;
                  const replyReference = message.replyTo
                    ? activeThread.messages.find((candidate) => candidate.id === message.replyTo)
                    : null;
                  const avatarVariant = message.authorId ? avatarMap[message.authorId] || null : "mercury";
                  const isAnonymous = !message.authorId;
                  return (
                    <article
                      key={message.id}
                      className={`rounded-2xl border px-3 py-3 text-sm ${
                        adminVoice
                          ? "border-amber-400/80 bg-amber-500/10 text-amber-50 shadow-[0_0_15px_rgba(251,191,36,0.35)] animate-pulse"
                          : "border-white/10 bg-night/50 text-snow/80"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {isAnonymous ? (
                            <AnonymousAvatar size={48} className="h-12 w-12" />
                          ) : (
                            <PlanetAvatar
                              variantId={avatarVariant || "mercury"}
                              size={48}
                              className="h-12 w-12"
                              staticOnly={false}
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.35em]">
                            <span className="flex items-center gap-2">
                              <span>
                                {message.author}
                                {adminVoice && (
                                  <span className="ml-2 rounded-full border border-amber-300/60 px-2 py-0.5 text-[9px] font-bold text-amber-100">
                                    ADMIN
                                  </span>
                                )}
                              </span>
                              {deleted && (
                                <span className="rounded-full border border-rose-300/60 px-2 py-0.5 text-[9px] font-semibold text-rose-100">
                                  Supprimé
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{formatRelativeTime(message.createdAt)}</span>
                              {!deleted && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(activeThread, message)}
                                  className="rounded-full border border-rose-300/50 px-2 py-0.5 text-[9px] font-semibold text-rose-100 hover:bg-rose-500/10"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                          {replyReference && (
                            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-snow/70">
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
                          <p className="text-sm">
                            {deleted ? "Ce message a été supprimé." : message.content}
                          </p>
                          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.35em] text-snow/60">
                            <span className="rounded-full border border-white/15 px-2 py-0.5">
                              👍 {message.likes || 0}
                            </span>
                            <span className="rounded-full border border-white/15 px-2 py-0.5">
                              👎 {message.dislikes || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
}
              </div>
              <form className="mt-4 space-y-2" onSubmit={handleModerationReply}>
                <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-100/80">
                  Répondre en tant qu&apos;ADMIN
                </label>
                <textarea
                  value={moderationMessage}
                  onChange={(event) => setModerationMessage(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-amber-300/40 bg-night/50 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/40 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={activeThread.deleted ? "Ce salon est supprimé." : "Message officiel..."}
                  disabled={Boolean(activeThread.deleted)}
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-amber-400/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-night shadow-lg shadow-amber-300/40 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(activeThread.deleted)}
                >
                  Poster en tant qu&apos;ADMIN
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-snow/70">Aucun salon sélectionné.</p>
          )}
        </div>

        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 px-5 py-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-snow/60">Utilisateurs</p>
              <h2 className="text-xl font-semibold text-snow">Gestion des comptes</h2>
            </div>
            <span className="rounded-full border border-white/15 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-snow/70">
              {users.length} profils
            </span>
          </div>
          <div className="space-y-3">
            {users.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border border-white/10 bg-night/60 px-4 py-3 text-sm text-snow/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-snow font-semibold">{account.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-snow/50">{account.email}</p>
                  </div>
                  <div className="flex gap-2 text-[11px] uppercase tracking-[0.35em]">
                    <span
                      className={`rounded-full px-3 py-0.5 ${
                        account.role === "admin"
                          ? "bg-amber-500/20 text-amber-200"
                          : account.role === "moderator"
                          ? "bg-sky/20 text-sky"
                          : "bg-white/10 text-snow/70"
                      }`}
                    >
                      {account.role}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 ${
                        account.status === "active"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : account.status === "pending"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-rose-500/20 text-rose-200"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em]">
                  <button
                    type="button"
                    onClick={() => toggleStatus(account.id)}
                    className="rounded-full border border-white/20 px-3 py-1 text-snow/80 hover:border-rose-300 hover:text-rose-100"
                  >
                    {account.status === "active" ? "Suspendre" : "Ré-activer"}
                  </button>
                  {account.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => toggleRole(account.id)}
                      className="rounded-full border border-white/20 px-3 py-1 text-snow/80 hover:border-sky hover:text-sky"
                    >
                      {account.role === "moderator" ? "Rétrograder" : "Promouvoir"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
