'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { profileApi, storageUrl } from '@/lib/api'

type FieldErrors = Record<string, string[]>

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // プロフィール
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({})
  const [profileLoading, setProfileLoading] = useState(false)

  // アバター
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [avatarFieldErrors, setAvatarFieldErrors] = useState<FieldErrors>({})
  const [avatarLoading, setAvatarLoading] = useState(false)

  // パスワード
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors>({})
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    setName(user.name)
    setBio(user.bio ?? '')
    if (user.avatar_path) setAvatarPreview(storageUrl(user.avatar_path))
  }, [user, authLoading])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileFieldErrors({})
    setProfileLoading(true)
    try {
      await profileApi.update({ name, bio: bio || undefined })
      setProfileMsg({ type: 'ok', text: 'プロフィールを更新しました。' })
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors }
      if (e?.errors) {
        setProfileFieldErrors(e.errors)
      } else {
        setProfileMsg({ type: 'err', text: e?.message ?? '更新に失敗しました。' })
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAvatarFile(file)
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarFile) { setAvatarMsg({ type: 'err', text: '画像を選択してください。' }); return }
    setAvatarMsg(null)
    setAvatarFieldErrors({})
    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      await profileApi.updateAvatar(formData)
      setAvatarMsg({ type: 'ok', text: 'アバターを更新しました。' })
      setAvatarFile(null)
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors }
      if (e?.errors) {
        setAvatarFieldErrors(e.errors)
      } else {
        setAvatarMsg({ type: 'err', text: e?.message ?? '更新に失敗しました。' })
      }
    } finally {
      setAvatarLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== newPasswordConfirm) {
      setPasswordMsg({ type: 'err', text: '新しいパスワードが一致しません。' })
      return
    }
    setPasswordMsg(null)
    setPasswordFieldErrors({})
    setPasswordLoading(true)
    try {
      await profileApi.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      })
      setPasswordMsg({ type: 'ok', text: 'パスワードを変更しました。' })
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors }
      if (e?.errors) {
        setPasswordFieldErrors(e.errors)
      } else {
        setPasswordMsg({ type: 'err', text: e?.message ?? '変更に失敗しました。' })
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  if (authLoading) return <div style={styles.container}><p>読み込み中...</p></div>

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>プロフィール設定</h1>

      {/* アバター */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>アイコン</h2>
        {avatarMsg && <p style={avatarMsg.type === 'ok' ? styles.ok : styles.err}>{avatarMsg.text}</p>}
        <form onSubmit={handleAvatarSubmit} style={styles.form}>
          <div style={styles.avatarWrapper}>
            <img
              src={avatarPreview ?? 'https://placehold.co/100x100?text=No+Image'}
              alt="アバター"
              style={styles.avatar}
            />
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            style={styles.fileInput}
          />
          {avatarFieldErrors.avatar && <p style={styles.fieldError}>{avatarFieldErrors.avatar[0]}</p>}
          <button type="submit" disabled={avatarLoading || !avatarFile} style={styles.button}>
            {avatarLoading ? '処理中...' : 'アイコンを更新'}
          </button>
        </form>
      </section>

      <hr style={styles.hr} />

      {/* プロフィール */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>ニックネーム・自己紹介</h2>
        {profileMsg && <p style={profileMsg.type === 'ok' ? styles.ok : styles.err}>{profileMsg.text}</p>}
        <form onSubmit={handleProfileSubmit} style={styles.form}>
          <label style={styles.label}>ニックネーム *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            style={{ ...styles.input, ...(profileFieldErrors.name ? styles.inputError : {}) }}
          />
          {profileFieldErrors.name && <p style={styles.fieldError}>{profileFieldErrors.name[0]}</p>}

          <label style={styles.label}>自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            style={{ ...styles.input, resize: 'vertical', ...(profileFieldErrors.bio ? styles.inputError : {}) }}
          />
          {profileFieldErrors.bio && <p style={styles.fieldError}>{profileFieldErrors.bio[0]}</p>}

          <button type="submit" disabled={profileLoading} style={styles.button}>
            {profileLoading ? '処理中...' : '変更を保存'}
          </button>
        </form>
      </section>

      <hr style={styles.hr} />

      {/* パスワード */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>パスワード変更</h2>
        {passwordMsg && <p style={passwordMsg.type === 'ok' ? styles.ok : styles.err}>{passwordMsg.text}</p>}
        <form onSubmit={handlePasswordSubmit} style={styles.form}>
          <label style={styles.label}>現在のパスワード</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ ...styles.input, ...(passwordFieldErrors.current_password ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.current_password && <p style={styles.fieldError}>{passwordFieldErrors.current_password[0]}</p>}

          <label style={styles.label}>新しいパスワード（8文字以上）</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={{ ...styles.input, ...(passwordFieldErrors.password ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.password && <p style={styles.fieldError}>{passwordFieldErrors.password[0]}</p>}

          <label style={styles.label}>新しいパスワード（確認）</label>
          <input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
            style={{ ...styles.input, ...(passwordFieldErrors.password_confirmation ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.password_confirmation && <p style={styles.fieldError}>{passwordFieldErrors.password_confirmation[0]}</p>}

          <button type="submit" disabled={passwordLoading} style={styles.button}>
            {passwordLoading ? '処理中...' : 'パスワードを変更'}
          </button>
        </form>
      </section>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '24px' },
  section: { paddingBottom: '8px' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontWeight: 'bold', fontSize: '14px', marginTop: '8px' },
  input: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
  inputError: { borderColor: '#e53e3e' },
  button: { marginTop: '8px', padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  avatarWrapper: { marginBottom: '8px' },
  avatar: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd', backgroundColor: '#f0f0f0' },
  fileInput: { fontSize: '14px' },
  hr: { margin: '24px 0', border: 'none', borderTop: '1px solid #eee' },
  ok: { color: '#38a169', fontSize: '14px', marginBottom: '8px' },
  err: { color: '#e53e3e', fontSize: '14px', marginBottom: '8px' },
  fieldError: { color: '#e53e3e', fontSize: '12px', margin: '2px 0 0' },
}