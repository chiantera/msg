'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'

export function ChatView({ userId }: { userId: string }) {
  const { messages, loading, bottomRef, deleteMessage, editMessage } = useMessages()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <button
        onClick={handleLogout}
        title="Esci"
        style={{
          position: 'fixed', top: 'max(0.5rem, env(safe-area-inset-top))', right: '0.75rem',
          zIndex: 50, background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: '1.1rem', cursor: 'pointer',
          opacity: 0.35, padding: '0.25rem',
          lineHeight: 1,
        }}
      >
        ⎋
      </button>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', paddingTop: 'max(2.5rem, env(safe-area-inset-top))' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>...</p>}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === userId} onDelete={deleteMessage} onEdit={editMessage} />
        ))}
        <div ref={bottomRef} />
      </main>

      <MessageInput userId={userId} />
    </div>
  )
}
