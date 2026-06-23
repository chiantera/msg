import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @deno-types="npm:@types/web-push"
import webpush from 'npm:web-push'

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

serve(async (req) => {
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
    return new Response('silent', { status: 200 })
  }

  const { data: recipients } = await supabase
    .from('profiles')
    .select('push_subscription')
    .neq('id', sender_id)
    .not('push_subscription', 'is', null)

  if (!recipients?.length) {
    return new Response('no subscribers', { status: 200 })
  }

  const payload = JSON.stringify({
    title: message.profiles?.display_name ?? 'msg',
    body: message.photo_url ? '📷 Foto' : (message.content ?? ''),
  })

  await Promise.all(
    recipients.map((r) =>
      webpush.sendNotification(r.push_subscription, payload).catch(console.error)
    ),
  )

  return new Response('ok', { status: 200 })
})
