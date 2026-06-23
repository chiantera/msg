'use client'
import { useEffect, useState } from 'react'
import { subscribeToPush } from '@/lib/push'

export function usePush() {
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
  }, [])

  const subscribe = async () => {
    const ok = await subscribeToPush()
    setSubscribed(ok)
    return ok
  }

  return { subscribed, subscribe }
}
