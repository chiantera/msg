import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @deno-types="npm:@types/web-push"
import webpush from 'npm:web-push'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

// ---- FCM HTTP v1 (per l'app nativa Capacitor) -------------------------------

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

function b64url(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Genera un access token OAuth2 a partire dal service account.
async function getFcmAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const toSign = `${header}.${claim}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign)),
  )
  const jwt = `${toSign}.${b64url(sig)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error('FCM token exchange failed: ' + JSON.stringify(json))
  return json.access_token
}

async function sendFcm(token: string, title: string, body: string) {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT')
  if (!raw) return // FCM non configurato: salta senza errori
  const sa = JSON.parse(raw)
  const accessToken = await getFcmAccessToken(sa)
  await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        android: { priority: 'high' },
        data: { url: '/chat' },
      },
    }),
  }).then(async (r) => {
    if (!r.ok) console.error('FCM send failed:', await r.text())
  })
}

// ---- Handler ----------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  const { message_id, sender_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: message } = await supabase
    .from('messages')
    .select('*, profiles(display_name)')
    .eq('id', message_id)
    .single()

  if (!message || message.silent) {
    return new Response('silent', { status: 200, headers: cors })
  }

  const { data: recipients } = await supabase
    .from('profiles')
    .select('push_subscription, fcm_token')
    .neq('id', sender_id)

  if (!recipients?.length) {
    return new Response('no recipients', { status: 200, headers: cors })
  }

  const title = message.profiles?.display_name ?? 'msg'
  const body = message.voice_url
    ? '🎤 Vocale'
    : message.photo_url
    ? '📷 Foto'
    : (message.content ?? '')

  const tasks: Promise<unknown>[] = []
  for (const r of recipients) {
    if (r.push_subscription) {
      tasks.push(
        webpush.sendNotification(r.push_subscription, JSON.stringify({ title, body })).catch(console.error),
      )
    }
    if (r.fcm_token) {
      tasks.push(sendFcm(r.fcm_token, title, body).catch(console.error))
    }
  }
  await Promise.all(tasks)

  return new Response('ok', { status: 200, headers: cors })
})
