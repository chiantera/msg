# msg — App di messaggistica privata

PWA di messaggistica per due soli utenti (una coppia), con testo, foto, push notification e opzione messaggio silenzioso.

## Stack

| Layer | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Stile | Tailwind CSS v4 + CSS custom properties |
| Backend / DB | Supabase (Auth, Realtime, Storage, Edge Functions) |
| Push notification | Web Push API + Service Worker (`/public/sw.js`) |
| Deploy | Vercel (frontend) + Supabase Cloud |

## Avvio locale

```bash
cp .env.local.example .env.local
# compilare le variabili in .env.local

npm install
npm run dev
```

## Variabili d'ambiente richieste

| Variabile | Dove si trova |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | generare con `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | come sopra |
| `VAPID_EMAIL` | `mailto:tua@email.com` |

Le variabili `VAPID_*` vanno anche nei secret dell'Edge Function Supabase.

## Database

Schema in `supabase/migrations/001_init.sql`.

### Tabelle principali

**`profiles`** — estende `auth.users`
- `push_subscription jsonb` — oggetto Web Push API (salvato al momento della sottoscrizione)

**`messages`**
- `content text` — testo (null se solo foto)
- `photo_url text` — path nel bucket Storage `photos`
- `silent boolean` — se true, la push notification non viene inviata
- `read_at timestamptz` — null = non letto; aggiornato via `mark_messages_read()`

### RLS
App privata con 2 utenti: tutti gli autenticati possono leggere/scrivere messaggi. I profili sono leggibili da tutti ma modificabili solo dal proprietario.

## Funzionalità chiave

### Messaggio silenzioso
Campo `silent: boolean` nel messaggio. L'Edge Function `send-push` controlla questo campo e salta l'invio della notifica. L'icona 🔕 viene mostrata sulla bolla.

### Push notification
Flusso:
1. `usePush` → registra `/sw.js` → chiede permesso → salva subscription in `profiles.push_subscription`
2. `MessageInput` → dopo insert → chiama `supabase.functions.invoke('send-push')`
3. Edge Function → legge subscription del destinatario → `web-push.sendNotification()`
4. Service Worker → mostra la notifica → al click apre `/chat`

### Real-time
`useMessages` usa `supabase.channel('messages')` con `postgres_changes` per ricevere i nuovi messaggi senza polling.

### Storage foto
Bucket Supabase `photos` (privato). Le URL vengono costruite client-side con il path salvato in `photo_url`. Aggiungere il bucket manualmente o decommentare le istruzioni alla fine della migration.

## Struttura file

```
src/
├── app/
│   ├── layout.tsx          — layout globale + manifest PWA
│   ├── globals.css         — CSS variables e reset
│   ├── page.tsx            — redirect a /chat o /login
│   ├── login/page.tsx      — form di accesso
│   └── chat/
│       ├── page.tsx        — server component (auth check)
│       └── ChatView.tsx    — client component principale
├── components/
│   ├── MessageBubble.tsx   — bolla singolo messaggio
│   ├── MessageInput.tsx    — form invio (testo + foto + silent)
│   └── PhotoUploader.tsx   — upload foto su Supabase Storage
├── hooks/
│   ├── useAuth.ts          — stato autenticazione
│   ├── useMessages.ts      — lista messaggi + real-time
│   └── usePush.ts          — registrazione service worker + push
└── lib/
    ├── supabase.ts         — client browser
    ├── supabase-server.ts  — client server (con cookies)
    ├── push.ts             — subscribe/save Web Push
    └── types.ts            — tipi TypeScript

supabase/
├── migrations/001_init.sql
└── functions/send-push/index.ts   — Edge Function (Deno)

public/
├── sw.js                   — Service Worker (push + notificationclick)
├── manifest.json           — PWA manifest
└── icons/                  — icon-192.png, icon-512.png (da generare)
```

## Deploy

1. Creare progetto Supabase → eseguire la migration → creare bucket `photos`
2. Generare chiavi VAPID: `npx web-push generate-vapid-keys`
3. Impostare i secret nell'Edge Function Supabase (`VAPID_*`)
4. Deploy su Vercel → impostare le env vars
5. Registrare i due utenti dalla Supabase dashboard (Authentication → Users)
