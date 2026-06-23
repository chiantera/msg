'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Message } from '@/lib/types'

interface Props {
  message: Message
  isOwn: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}

export function MessageBubble({ message, isOwn, onDelete, onEdit }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const openMenu = () => {
    if (message.deleted_at) return
    setShowMenu(true)
  }

  const closeMenu = () => setShowMenu(false)

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation()
    timerRef.current = setTimeout(openMenu, 500)
  }
  const cancelPress = () => clearTimeout(timerRef.current)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openMenu()
  }

  const handleCopy = async () => {
    if (message.content) await navigator.clipboard.writeText(message.content)
    closeMenu()
  }

  const handleEdit = () => {
    setEditText(message.content ?? '')
    setEditing(true)
    closeMenu()
  }

  const handleDelete = () => {
    onDelete(message.id)
    closeMenu()
  }

  const handleShare = async () => {
    closeMenu()
    const shareData: ShareData = {}
    if (message.content) shareData.text = message.content
    if (message.photo_url) shareData.url = `${supabaseUrl}/storage/v1/object/public/photos/${message.photo_url}`
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData).catch(() => {})
    } else if (message.content) {
      await navigator.clipboard.writeText(message.content)
    }
  }

  const confirmEdit = async () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== message.content) onEdit(message.id, trimmed)
    setEditing(false)
  }

  const menuItems = [
    { label: 'Copia', icon: '📋', action: handleCopy, show: !!message.content },
    { label: 'Modifica', icon: '✏️', action: handleEdit, show: isOwn && !!message.content && !message.photo_url },
    { label: 'Elimina', icon: '🗑', action: handleDelete, show: isOwn },
    { label: 'Condividi', icon: '↗', action: handleShare, show: true },
  ].filter(i => i.show)

  if (message.deleted_at) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.25rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0.5rem' }}>
          messaggio eliminato
        </p>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.25rem', position: 'relative' }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={handleContextMenu}
    >
      {showMenu && (
        <>
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            ...(isOwn ? { right: 0 } : { left: 0 }),
            zIndex: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            display: 'flex',
            overflow: 'hidden',
          }}>
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  background: 'none',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  color: item.label === 'Elimina' ? '#ef4444' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.9rem',
                  fontSize: '1rem',
                  minWidth: 56,
                }}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.7, letterSpacing: '0.01em' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{
        maxWidth: '75%',
        background: isOwn ? 'var(--bubble-out)' : 'var(--bubble-in)',
        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: message.photo_url ? 0 : '0.5rem 0.75rem',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}>
        {message.silent && (
          <span style={{ position: 'absolute', top: 4, right: 6, fontSize: '0.6rem', opacity: 0.6 }}>🔕</span>
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

        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: message.photo_url ? '0.4rem 0.5rem' : undefined }}>
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit() }
                if (e.key === 'Escape') setEditing(false)
              }}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                color: 'inherit', fontSize: '0.9375rem', outline: 'none',
                padding: '0.1rem 0',
                userSelect: 'text', WebkitUserSelect: 'text',
              }}
            />
            <button
              onClick={confirmEdit}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
            >✓</button>
            <button
              onClick={() => setEditing(false)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6, padding: 0 }}
            >✕</button>
          </div>
        ) : (
          message.content && (
            <p style={{
              fontSize: '0.9375rem', lineHeight: 1.4,
              padding: message.photo_url ? '0.4rem 0.75rem 0.5rem' : undefined,
              wordBreak: 'break-word',
            }}>
              {message.content}
            </p>
          )
        )}

        <span style={{
          display: 'block', textAlign: 'right', fontSize: '0.65rem', opacity: 0.55,
          padding: message.photo_url ? '0 0.5rem 0.25rem' : '0.1rem 0 0',
        }}>
          {message.edited_at && <span style={{ marginRight: '0.3rem' }}>modificato</span>}
          {new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          {isOwn && message.read_at && ' ✓'}
        </span>
      </div>
    </div>
  )
}
