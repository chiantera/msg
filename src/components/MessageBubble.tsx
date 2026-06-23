import Image from 'next/image'
import type { Message } from '@/lib/types'

interface Props {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '0.25rem',
    }}>
      <div style={{
        maxWidth: '75%',
        background: isOwn ? 'var(--bubble-out)' : 'var(--bubble-in)',
        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: message.photo_url ? 0 : '0.5rem 0.75rem',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {message.silent && (
          <span style={{
            position: 'absolute', top: 4, right: 6,
            fontSize: '0.6rem', opacity: 0.6,
          }}>🔕</span>
        )}
        {message.photo_url && (
          <Image
            src={`${supabaseUrl}/storage/v1/object/public/photos/${message.photo_url}`}
            alt="foto"
            width={280}
            height={280}
            style={{ objectFit: 'cover', display: 'block', borderRadius: message.content ? '18px 18px 0 0' : undefined }}
          />
        )}
        {message.content && (
          <p style={{
            fontSize: '0.9375rem',
            lineHeight: 1.4,
            padding: message.photo_url ? '0.4rem 0.75rem 0.5rem' : undefined,
            wordBreak: 'break-word',
          }}>
            {message.content}
          </p>
        )}
        <span style={{
          display: 'block',
          textAlign: 'right',
          fontSize: '0.65rem',
          opacity: 0.55,
          padding: message.photo_url ? '0 0.5rem 0.25rem' : '0.1rem 0 0',
        }}>
          {new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          {isOwn && message.read_at && ' ✓'}
        </span>
      </div>
    </div>
  )
}
