// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { create } from "zustand";

export const GENERAL_TOPICS = [
  { value: "experience", label: "Expérience utilisateur" },
  { value: "donnees", label: "Données & précision" },
  { value: "ideas", label: "Idées de fonctionnalités" },
  { value: "support", label: "Support & intégrations" }
];

const THREADS_STORAGE_KEY = "forum_threads_state";

function loadPersistedThreads() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
  }
  return null;
}

function persistThreads(threads) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  } catch {
  }
}

function computeReactionTotals(reactionMap = {}) {
  let likes = 0;
  let dislikes = 0;
  Object.values(reactionMap).forEach((value) => {
    if (value === "like") {
      likes += 1;
    } else if (value === "dislike") {
      dislikes += 1;
    }
  });
  return { likes, dislikes };
}

function normalizeMessage(message = {}) {
  const reactionMap = message.reactionMap && typeof message.reactionMap === "object" ? message.reactionMap : {};
  const { likes, dislikes } = computeReactionTotals(reactionMap);
  return {
    ...message,
    likes,
    dislikes,
    reactionMap,
    replyTo: message.replyTo || null,
    authorId: message.authorId || null
  };
}

function normalizeThreads(threads = []) {
  return threads.map((thread) => ({
    ...thread,
    messages: (thread?.messages || []).map((message) => normalizeMessage(message))
  }));
}

function seedMessage(overrides = {}) {
  return normalizeMessage({
    ...overrides,
    likes: 0,
    dislikes: 0,
    reactionMap: {},
    avatarSeed: overrides.avatarSeed || null
  });
}

const rawSeededThreads = [
  {
    id: "topic-general-ux",
    title: "Interface nocturne et accessibilité",
    type: "general",
    theme: "experience",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    deleted: false,
    messages: [
      seedMessage({
        id: "msg-1",
        author: "TRISTAN",
        role: "user",
        content:
          "J'adore la palette sombre, mais j'aimerais pouvoir augmenter le contraste pour les textes secondaires.",
        createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        deleted: false
      }),
      seedMessage({
        id: "msg-2",
        author: "KEIS",
        role: "user",
        content: "Prochaine itération : bascule contraste + meilleure lisibilité des tableaux.",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        deleted: false
      })
    ]
  },
  {
    id: "topic-flight-afr66",
    title: "Vol AFR66 – suivi en temps réel",
    type: "flight",
    flight: {
      id: "AFR66",
      label: "AFR66",
      airline: "Air France",
      departure: "Paris CDG",
      arrival: "Los Angeles"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    deleted: false,
    messages: [
      seedMessage({
        id: "msg-3",
        author: "Observateur",
        role: "user",
        content: "Altitude affichée instable sur la carte, vous confirmez ?",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        deleted: false
      }),
      seedMessage({
        id: "msg-4",
        author: "ANONYME",
        role: "user",
        content: "Teste sur Firefox : les données sont redevenues cohérentes.",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        deleted: false
      })
    ]
  }
];

const seededThreads = normalizeThreads(rawSeededThreads);

function normalizeTitle(title) {
  return (title || "").trim().toLowerCase();
}

const persistedRawThreads = loadPersistedThreads();
const normalizedPersistedThreads = normalizeThreads(persistedRawThreads || []);
const initialThreads =
  normalizedPersistedThreads.length > 0 ? normalizedPersistedThreads : seededThreads;
if (!normalizedPersistedThreads.length) {
  persistThreads(initialThreads);
}

export const useForumStore = create((set, get) => ({
  threads: initialThreads,
  activeThreadId: initialThreads[0]?.id || null,
  setActiveThreadId(id) {
    set({ activeThreadId: id });
  },
  createThread({ title, type, theme, message, flight, author, authorRole = "user", authorId = null }) {
    const now = new Date().toISOString();
    const normalized = normalizeTitle(title);
    const existing = get()
      .threads.filter((thread) => !thread.deleted)
      .find((thread) => normalizeTitle(thread.title) === normalized);
    const replyMessage = normalizeMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author,
      role: authorRole,
      content: message,
      createdAt: now,
      deleted: false,
      reactionMap: {},
      replyTo: null,
      authorId
    });
    if (existing) {
      set((state) => {
        const threads = state.threads.map((thread) =>
          thread.id === existing.id
            ? {
                ...thread,
                messages: [...thread.messages, replyMessage],
                updatedAt: now
              }
            : thread
        );
        persistThreads(threads);
        return {
          threads,
          activeThreadId: existing.id
        };
      });
      return { threadId: existing.id, reused: true };
    }
    const threadId = `topic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const firstMessage = {
      ...replyMessage,
      id: replyMessage.id,
      replyTo: null
    };
    const thread = {
      id: threadId,
      title,
      type,
      theme,
      flight: type === "flight" ? flight : null,
      messages: [firstMessage],
      createdAt: now,
      updatedAt: now,
      deleted: false
    };
    set((state) => {
      const threads = [thread, ...state.threads];
      persistThreads(threads);
      return {
        threads,
        activeThreadId: threadId
      };
    });
    return { threadId, reused: false };
  },
  replyToThread({ threadId, message, author, authorRole = "user", replyToMessageId = null, authorId = null }) {
    const now = new Date().toISOString();
    set((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id !== threadId || thread.deleted) {
          return thread;
        }
        const reply = normalizeMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          author,
          role: authorRole,
          content: message,
          createdAt: now,
          deleted: false,
          reactionMap: {},
          replyTo: replyToMessageId,
          authorId
        });
        return {
          ...thread,
          messages: [...thread.messages, reply],
          updatedAt: now
        };
      });
      persistThreads(threads);
      return { threads };
    });
  },
  reactToMessage({ threadId, messageId, newAction = null, previousAction = null, userId = null }) {
    if (!userId) {
      return;
    }
    set((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id !== threadId) {
          return thread;
        }
        return {
          ...thread,
          messages: thread.messages.map((message) => {
            if (message.id !== messageId || message.deleted) {
              return message;
            }
            if (message.role === "admin" && newAction === "dislike") {
              return message;
            }
            const reactionMap = {
              ...(message.reactionMap && typeof message.reactionMap === "object" ? message.reactionMap : {})
            };
            if (previousAction === "like" && reactionMap[userId] === "like") {
              delete reactionMap[userId];
            }
            if (previousAction === "dislike" && reactionMap[userId] === "dislike") {
              delete reactionMap[userId];
            }
            if (newAction) {
              reactionMap[userId] = newAction;
            } else {
              delete reactionMap[userId];
            }
            const { likes, dislikes } = computeReactionTotals(reactionMap);
            return {
              ...message,
              reactionMap,
              likes,
              dislikes
            };
          })
        };
      });
      persistThreads(threads);
      return { threads };
    });
  },
  deleteThread({ threadId, author = "ADMIN" }) {
    const deletedAt = new Date().toISOString();
    set((state) => {
      const threads = state.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              deleted: true,
              deletedAt,
              deletedBy: author
            }
          : thread
      );
      persistThreads(threads);
      return { threads };
    });
  },
  deleteMessage({ threadId, messageId, author = "ADMIN" }) {
    const deletedAt = new Date().toISOString();
    set((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id !== threadId) {
          return thread;
        }
        return {
          ...thread,
          messages: thread.messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  deleted: true,
                  deletedAt,
                  deletedBy: author
                }
              : message
          )
        };
      });
      persistThreads(threads);
      return { threads };
    });
  }
}));
