'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message ?? 'Errore di accesso')
      setLoading(false)
    } else {
      router.push('/chat')
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', padding: '1rem',
    }}>
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
<input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '...' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  padding: '0.75rem 1rem',
  color: '#f0f0f0',
  fontSize: '1rem',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  background: '#2d6cdf',
  border: 'none',
  borderRadius: 8,
  padding: '0.75rem',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
}
