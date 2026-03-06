'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { userApi, storageUrl } from '@/lib/api'
import type { Paginated } from '@/types'

type UserItem = {
  id: number
  ulid: string
  name: string
  avatar_path: string | null
  bio: string | null
}

type Props = {
  mode: 'following' | 'followers'
}

export default function FollowListPage({ mode }: Props) {
  const { ulid } = useParams<{ ulid: string }>()
  const router = useRouter()
  const [users, setUsers] = useState<Paginated<UserItem> | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = mode === 'following'
        ? await userApi.following(ulid, page)
        : await userApi.followers(ulid, page)
      setUsers(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [ulid, page, mode])

  const title = mode === 'following' ? 'フォロー中' : 'フォロワー'

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backButton}>← 戻る</button>
        <h1 style={styles.heading}>{title}</h1>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : users?.data.length === 0 ? (
        <p style={{ color: '#666' }}>{title}はいません。</p>
      ) : (
        <>
          <div style={styles.list}>
            {users?.data.map((user) => (
              <Link key={user.ulid} href={`/users/${user.ulid}`} style={styles.item}>
                <img
                  src={user.avatar_path ? storageUrl(user.avatar_path) : 'https://placehold.co/48x48?text=U'}
                  alt={user.name}
                  style={styles.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=U'
                  }}
                />
                <div style={styles.info}>
                  <p style={styles.name}>{user.name}</p>
                  {user.bio && <p style={styles.bio}>{user.bio}</p>}
                </div>
              </Link>
            ))}
          </div>

          {users && users.last_page > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                style={styles.pageButton}
              >
                前へ
              </button>
              <span>{page} / {users.last_page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === users.last_page}
                style={styles.pageButton}
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' },
  heading: { margin: 0, fontSize: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', textDecoration: 'none', color: 'inherit' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px' },
  bio: { fontSize: '13px', color: '#666', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}