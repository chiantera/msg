'use client'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  onUploaded: (path: string) => void
  disabled?: boolean
}

export function PhotoUploader({ onUploaded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (!error) onUploaded(path)
    e.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="Allega foto"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.25rem', padding: '0.5rem', color: 'var(--text-muted)',
        }}
      >
        📷
      </button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </>
  )
}
