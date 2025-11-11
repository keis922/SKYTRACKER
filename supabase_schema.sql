-- Schéma + données initiales pour Supabase (SkyTracker)
-- À exécuter dans le SQL editor Supabase.

-- Extensions UUID
create extension if not exists "uuid-ossp";

-- TABLES ------------------------------------------------------

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  username text not null unique,
  "fullName" text,
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  flight_id text not null,
  flight_number text,
  airline text,
  status text,
  departure_airport text,
  arrival_airport text,
  latitude double precision,
  longitude double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_user_flight_idx on public.favorites(user_id, flight_id);

-- Forum (optionnel mais inclus pour cohérence)
create table if not exists public.threads (
  id text primary key,
  title text not null,
  type text not null,
  theme text,
  flight_id text,
  flight_label text,
  airline text,
  departure text,
  arrival text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.messages (
  id text primary key,
  thread_id text not null references public.threads(id) on delete cascade,
  author text,
  author_role text,
  author_id uuid,
  content text,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  reply_to text,
  reaction_map jsonb,
  likes integer not null default 0,
  dislikes integer not null default 0
);

-- DONNÉES INITIALES ------------------------------------------
-- Utilisateur existant issu de backend/data/users.json
insert into public.users (id, email, username, "fullName", password_hash, password_salt, created_at)
values
('9de9dccd-1739-4ff3-a121-45574d0e0ee8', 'aissaouikeis1@gmail.com', 'aissaoui', '', 'a4083b695f47d04d641fe5c93eb8264d1a3d10129138b3d5d5c7a343c7c29cbec8be20e14e4bfde751741f6349e1ab4291864fb31d17817b748f6a0d10a5aa48', '523a1407e0eccc0e484701269a709c82', '2025-11-23T18:27:05.716Z')
on conflict (id) do nothing;

-- Sessions existantes (backend/data/sessions.json)
insert into public.sessions (token, user_id, created_at)
values
('50164d0645bf62bbdc80870bc2df479194bf426a3b83ecb68df4d9a81139e8c6','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-23T18:27:15.665Z'),
('0d4162cfebc6fd9be3860b23aad2e76524132cfe18c8aea5aad2ee65a0fc42d4','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-23T19:20:14.920Z'),
('a0de1f729cb270957232499f6bc9fc4f133b2b0caf7c6f57960320bb52ff19cd','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-23T20:00:18.528Z'),
('31248e7dbbc46b279a715101ca2a59a6210eeee6d7711e063a2ee6e0c5aa2525','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-23T20:47:41.357Z'),
('749bb45f8dd87a336a1a63d440d83c965975a5d20b3ce0fcab32a7aab97567a0','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-24T21:29:45.867Z'),
('98dffdeedec123cf95a841c90f4aa90e3fd4c0fdb2e98491dc2a3904596713ae','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-26T14:25:44.132Z'),
('af9badea48aba5e963493922a97b899dffbc4b11863ac3c714866664629730e0','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-26T14:57:32.264Z'),
('8eeb0fbd0aff2204141c6c3087119b5c352165d67beb314aefcd4a7dbcd30622','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-26T15:01:33.995Z'),
('9b72b872ad68941ac9ca2a1e42e5a6504db1cacb91359c568ed81e352b145df8','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-26T15:02:44.723Z'),
('d1907cdfb1767183e49370bdf13f288b3d23415e2aabe7923e2692ba2202957d','9de9dccd-1739-4ff3-a121-45574d0e0ee8','2025-11-26T15:03:35.923Z')
on conflict (token) do nothing;

-- Pas de favoris enregistrés (favorites.json vide)

-- Seed forum (issu du store local)
insert into public.threads (id, title, type, theme, flight_id, flight_label, airline, departure, arrival, created_at, updated_at, deleted)
values
('topic-general-ux','Interface nocturne et accessibilité','general','experience',null,null,null,null,null,'2025-11-26T17:00:00Z','2025-11-26T17:35:00Z',false),
('topic-flight-afr66','Vol AFR66 – suivi en temps réel','flight',null,'AFR66','AFR66','Air France','Paris CDG','Los Angeles','2025-11-26T16:00:00Z','2025-11-26T17:55:00Z',false)
on conflict (id) do nothing;

insert into public.messages (id, thread_id, author, author_role, author_id, content, created_at, deleted, reply_to, reaction_map, likes, dislikes)
values
('msg-1','topic-general-ux','TRISTAN','user',null,'J''adore la palette sombre, mais j''aimerais pouvoir augmenter le contraste pour les textes secondaires.','2025-11-26T17:00:00Z',false,null,'{}',0,0),
('msg-2','topic-general-ux','KEIS','user',null,'Prochaine itération : bascule contraste + meilleure lisibilité des tableaux.','2025-11-26T17:35:00Z',false,null,'{}',0,0),
('msg-3','topic-flight-afr66','Observateur','user',null,'Altitude affichée instable sur la carte, vous confirmez ?','2025-11-26T16:00:00Z',false,null,'{}',0,0),
('msg-4','topic-flight-afr66','ANONYME','user',null,'Teste sur Firefox : les données sont redevenues cohérentes.','2025-11-26T17:55:00Z',false,null,'{}',0,0)
on conflict (id) do nothing;
