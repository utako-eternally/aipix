'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { storageUrl } from '@/lib/api'

const ADMIN_MODE_KEY = 'aipix_admin_mode'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // localStorage から管理者モードを復元
  useEffect(() => {
    if (user?.role === 'admin') {
      const saved = localStorage.getItem(ADMIN_MODE_KEY)
      setIsAdminMode(saved === null ? true : saved === 'true')
    }
  }, [user])

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const switchAdminMode = (value: boolean) => {
    setIsAdminMode(value)
    localStorage.setItem(ADMIN_MODE_KEY, String(value))
    setDropdownOpen(false)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    localStorage.removeItem(ADMIN_MODE_KEY)
    await logout()
    router.push('/login')
  }

  const handleDropdownLink = (path: string) => {
    setDropdownOpen(false)
    router.push(path)
  }

  if (loading) return <nav style={styles.nav}><span style={styles.logo}>AIPIX</span></nav>

  const isAdmin = user?.role === 'admin'

  return (
    <>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>AIPIX</Link>

        <div style={styles.links}>
          <Link href="/" style={styles.link}>ギャラリー</Link>
          <Link href="/rankings" style={styles.link}>ランキング</Link>

          {user ? (
            <>
              {/* 管理者モード時は管理画面リンクを表示 */}
              {isAdmin && isAdminMode && (
                <Link href="/admin" style={styles.adminLink}>管理画面</Link>
              )}

              <Link href="/products/new" style={styles.postButton}>+ 投稿する</Link>

              {/* アバター+名前 ドロップダウン */}
              <div style={styles.userMenu} ref={dropdownRef}>
                <div
                  style={styles.userButton}
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <img
                    src={user.avatar_path ? storageUrl(user.avatar_path) : 'https://placehold.co/32x32?text=U'}
                    alt={user.name}
                    style={styles.avatar}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=U'
                    }}
                  />
                  <span style={styles.userName}>{user.name}</span>
                  <span style={styles.caret}>{dropdownOpen ? '▲' : '▼'}</span>
                </div>

                {dropdownOpen && (
                  <div style={styles.dropdown}>
                    <button style={styles.dropdownItem} onClick={() => handleDropdownLink(`/users/${user.ulid}`)}>
                      マイページ
                    </button>
                    <button style={styles.dropdownItem} onClick={() => handleDropdownLink('/my/products')}>
                      マイ投稿
                    </button>
                    <button style={styles.dropdownItem} onClick={() => handleDropdownLink('/my/orders')}>
                      購入履歴
                    </button>
                    <button style={styles.dropdownItem} onClick={() => handleDropdownLink('/settings')}>
                      設定
                    </button>

                    {isAdmin && (
                      <>
                        <hr style={styles.divider} />
                        {isAdminMode ? (
                          <button
                            style={{ ...styles.dropdownItem, color: '#718096' }}
                            onClick={() => switchAdminMode(false)}
                          >
                            ユーザーとして閲覧
                          </button>
                        ) : (
                          <button
                            style={{ ...styles.dropdownItem, color: '#e53e3e' }}
                            onClick={() => switchAdminMode(true)}
                          >
                            管理者モードに切り替え
                          </button>
                        )}
                      </>
                    )}

                    <hr style={styles.divider} />
                    <button style={{ ...styles.dropdownItem, color: '#e53e3e' }} onClick={handleLogout}>
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/register" style={styles.link}>新規登録</Link>
              <Link href="/login" style={styles.loginButton}>ログイン</Link>
            </>
          )}
        </div>
      </nav>

      {/* 管理者モードバナー */}
      {isAdmin && isAdminMode && (
        <div style={styles.adminBanner}>
          🛡 管理者モードで閲覧中
        </div>
      )}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '20px',
    textDecoration: 'none',
    color: '#333',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  link: {
    textDecoration: 'none',
    color: '#333',
    fontSize: '14px',
  },
  adminLink: {
    textDecoration: 'none',
    color: '#fff',
    fontSize: '14px',
    padding: '6px 14px',
    backgroundColor: '#e53e3e',
    borderRadius: '4px',
  },
  postButton: {
    padding: '6px 14px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '14px',
  },
  loginButton: {
    padding: '6px 14px',
    border: '1px solid #333',
    borderRadius: '4px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '14px',
  },
  userMenu: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#f0f0f0',
  },
  userName: {
    fontSize: '14px',
    color: '#333',
  },
  caret: {
    fontSize: '10px',
    color: '#999',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
  },
  divider: {
    margin: '4px 0',
    border: 'none',
    borderTop: '1px solid #eee',
  },
  adminBanner: {
    backgroundColor: '#e53e3e',
    color: '#fff',
    textAlign: 'center',
    padding: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
}