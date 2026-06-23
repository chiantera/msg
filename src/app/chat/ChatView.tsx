'use client'
import { useMessages } from '@/hooks/useMessages'
import { usePush } from '@/hooks/usePush'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'

export function ChatView({ userId }: { userId: string }) {
  const { messages, loading, bottomRef } = useMessages()
  const { subscribed, subscribe } = usePush()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <header style={{
        padding: '0.75rem 1rem', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>msg</span>
        {!subscribed && (
          <button
            onClick={subscribe}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0.25rem 0.6rem', color: 'var(--text-muted)',
              fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Attiva notifiche
          </button>
        )}
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>...</p>}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === userId} />
        ))}
        <div ref={bottomRef} />
      </main>

      <MessageInput userId={userId} />
    </div>
  )
}
