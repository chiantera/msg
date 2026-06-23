-- ============================================================
-- msg — schema iniziale
-- ============================================================

-- Profili utente (estende auth.users di Supabase)
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  display_name    text not null,
  push_subscription jsonb,       -- oggetto Web Push API subscription
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Messaggi
create table public.messages (
  id          uuid default gen_random_uuid() primary key,
  sender_id   uuid references public.profiles(id) on delete cascade not null,
  content     text,              -- testo (null se solo foto)
  photo_url   text,              -- path in Supabase Storage (bucket: photos)
  silent      boolean default false not null,  -- non inviare push notification
  read_at     timestamptz,       -- null = non letto
  created_at  timestamptz default now() not null,

  constraint messages_has_content check (content is not null or photo_url is not null)
);

-- Indice per ordinamento cronologico
create index messages_created_at_idx on public.messages(created_at asc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.messages  enable row level security;

-- Profili: tutti gli autenticati possono leggere, ognuno scrive solo il proprio
create policy "profiles: leggi tutti"
  on public.profiles for select to authenticated using (true);

create policy "profiles: inserisci il tuo"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles: aggiorna il tuo"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Messaggi: accesso completo a utenti autenticati (app privata, 2 utenti)
create policy "messages: leggi tutti"
  on public.messages for select to authenticated using (true);

create policy "messages: inserisci il tuo"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "messages: aggiorna il tuo"
  on public.messages for update to authenticated
  using (auth.uid() = sender_id);

-- ============================================================
-- Trigger: crea profilo automaticamente al signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Funzione: marca messaggi ricevuti come letti
-- ============================================================

create or replace function public.mark_messages_read()
returns void language plpgsql security definer as $$
begin
  update public.messages
  set    read_at = now()
  where  sender_id != auth.uid()
    and  read_at is null;
end;
$$;

-- ============================================================
-- Storage bucket per le foto
-- (eseguire separatamente via dashboard o Supabase CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('photos', 'photos', false);
--
-- create policy "photos: upload autenticati"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'photos');
--
-- create policy "photos: lettura autenticati"
--   on storage.objects for select to authenticated
--   using (bucket_id = 'photos');
