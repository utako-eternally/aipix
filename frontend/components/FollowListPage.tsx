'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { userApi, followApi, storageUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Paginated } from '@/types'
import type { UserProfile } from '@/types/index'
import UserSidebar from '@/components/UserSidebar'

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
  const { user: me } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<Paginated<UserItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    userApi.show(ulid)
      .then(setProfile)
      .catch(() => router.push('/'))
  }, [ulid])

  useEffect(() => {
    setLoading(true)
    const fetch = mode === 'following'
      ? userApi.following(ulid, page)
      : userApi.followers(ulid, page)
    fetch.then(setUsers).finally(() => setLoading(false))
  }, [ulid, page, mode])

  const handleFollow = async () => {
    if (!me) { router.push('/login'); return; }
    if (!profile) return;
    setFollowLoading(true)
    try {
      if (profile.is_following) {
        const res = await followApi.destroy(profile.ulid)
        setProfile((p) => p ? { ...p, is_following: false, followers_count: res.followers_count } : p)
      } else {
        const res = await followApi.store(profile.ulid)
        setProfile((p) => p ? { ...p, is_following: true, followers_count: res.followers_count } : p)
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const title = mode === 'following' ? 'フォロー中' : 'フォロワー'
  const isMe = me?.ulid === profile?.ulid

  if (!profile) return <div style={styles.container}><p>読み込み中...</p></div>

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        <UserSidebar
          profile={profile}
          isMe={isMe}
          onFollow={handleFollow}
          followLoading={followLoading}
        />
        <main style={styles.main}>
          <h2 style={styles.sectionTitle}>{title}</h2>
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
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=U' }}
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
                  <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
                  <span>{page} / {users.last_page}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page === users.last_page} style={styles.pageButton}>次へ</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' },
  layout: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '1px solid #eee' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', textDecoration: 'none', color: 'inherit' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px' },
  bio: { fontSize: '13px', color: '#666', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}