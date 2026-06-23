# msg

App di messaggistica privata PWA per due utenti.

## Stack

- **Frontend** — Next.js 15 + TypeScript + Tailwind CSS v4
- **Backend** — Supabase (Auth, Realtime, Storage, Edge Functions)
- **Push notifications** — Web Push API + Service Worker
- **Deploy** — Netlify + Supabase Cloud

## Funzionalità

- Messaggi in tempo reale
- Invio foto
- Messaggio silenzioso (🔕 — non invia notifica push)
- PWA installabile su mobile e desktop
- Ricevuta di lettura

## Sviluppo locale

```bash
cp .env.local.example .env.local
# compilare le variabili

pnpm install
pnpm dev
```

## Deploy

Il deploy è automatico su ogni push a `main` tramite Netlify.

Le variabili d'ambiente sono configurate su Netlify e Supabase.
