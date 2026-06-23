'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Message } from '@/lib/types'

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('messages')
      .select('*, profiles(id, display_name)')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
        supabase.rpc('mark_messages_read')
      })

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(id, display_name)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) => [...prev, data])
            supabase.rpc('mark_messages_read')
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return { messages, loading, bottomRef }
}
