'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message ?? 'ログインに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ログイン</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <label style={styles.label}>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '処理中...' : 'ログイン'}
        </button>
      </form>
      <p style={styles.link}>
        アカウントをお持ちでない方は <Link href="/register">新規登録</Link>
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '400px', margin: '80px auto', padding: '0 16px' },
  title: { marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontWeight: 'bold', fontSize: '14px' },
  input: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' },
  button: { padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  error: { color: 'red', marginBottom: '12px' },
  link: { marginTop: '16px', fontSize: '14px' },
}