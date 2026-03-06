'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

type FieldErrors = Record<string, string[]>

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      await register(name, email, password)
      router.push('/')
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors }
      if (e?.errors) {
        setFieldErrors(e.errors)
      } else {
        setError(e?.message ?? '登録に失敗しました。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>新規登録</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>

        <label style={styles.label}>ユーザー名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
        />
        {fieldErrors.name && <p style={styles.fieldError}>{fieldErrors.name[0]}</p>}

        <label style={styles.label}>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : {}) }}
        />
        {fieldErrors.email && <p style={styles.fieldError}>{fieldErrors.email[0]}</p>}

        <label style={styles.label}>パスワード（8文字以上）</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ ...styles.input, ...(fieldErrors.password ? styles.inputError : {}) }}
        />
        {fieldErrors.password && <p style={styles.fieldError}>{fieldErrors.password[0]}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '処理中...' : '登録する'}
        </button>
      </form>
      <p style={styles.link}>
        すでにアカウントをお持ちの方は <Link href="/login">ログイン</Link>
      </p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '400px', margin: '80px auto', padding: '0 16px' },
  title: { marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontWeight: 'bold', fontSize: '14px', marginTop: '8px' },
  input: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' },
  inputError: { borderColor: '#e53e3e' },
  button: { marginTop: '16px', padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  error: { color: '#e53e3e', marginBottom: '12px' },
  fieldError: { color: '#e53e3e', fontSize: '12px', margin: '2px 0 0' },
  link: { marginTop: '16px', fontSize: '14px' },
}