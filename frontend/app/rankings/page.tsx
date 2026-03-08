'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { rankingApi, storageUrl } from '@/lib/api'
import { useR18 } from '@/context/R18Context'
import type { Ranking, RankingUser } from '@/types'

const PERIOD_OPTIONS = [
  { value: 'daily',   label: '日間' },
  { value: 'weekly',  label: '週間' },
  { value: 'monthly', label: '月間' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: '',       label: 'すべて' },
  { value: 'illust', label: 'イラスト' },
  { value: 'photo',  label: 'フォト' },
]

export default function RankingsPage() {
  const searchParams = useSearchParams()
  const { isR18Mode } = useR18()

  const [tab, setTab] = useState<'products' | 'users'>(
    searchParams.get('tab') === 'users' ? 'users' : 'products'
  )
  const [period, setPeriod] = useState('weekly')
  const [contentType, setContentType] = useState('')
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [userRankings, setUserRankings] = useState<RankingUser[]>([])
  const [snapshotted_at, setSnapshottedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (tab === 'products') {
      rankingApi.index({ period, age_rating: isR18Mode ? 'r18' : 'all' })
        .then((res) => { setRankings(res.data); setSnapshottedAt(res.snapshotted_at ?? null) })
        .catch(() => setRankings([]))
        .finally(() => setLoading(false))
    } else {
      rankingApi.users({ period })
        .then((res) => { setUserRankings(res.data); setSnapshottedAt(res.snapshotted_at ?? null) })
        .catch(() => setUserRankings([]))
        .finally(() => setLoading(false))
    }
  }, [tab, period, isR18Mode])

  const filteredRankings = contentType
    ? rankings.filter((r) => r.product.content_type === contentType)
    : rankings

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ランキング</h1>

      {/* 作品 / クリエイタータブ */}
      <div style={styles.mainTabs}>
        <button onClick={() => setTab('products')} style={{ ...styles.mainTab, ...(tab === 'products' ? styles.mainTabActive : {}) }}>作品</button>
        <button onClick={() => setTab('users')} style={{ ...styles.mainTab, ...(tab === 'users' ? styles.mainTabActive : {}) }}>クリエイター</button>
      </div>

      {/* フィルター */}
      <div style={styles.filters}>
        <div style={styles.tabGroup}>
          {PERIOD_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setPeriod(o.value)} style={{ ...styles.tab, ...(period === o.value ? styles.tabActive : {}) }}>
              {o.label}
            </button>
          ))}
        </div>
        {tab === 'products' && (
          <div style={styles.tabGroup}>
            {CONTENT_TYPE_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => setContentType(o.value)} style={{ ...styles.tab, ...(contentType === o.value ? styles.tabActive : {}) }}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {snapshotted_at && (
        <p style={styles.snapshot}>集計日時: {new Date(snapshotted_at).toLocaleString('ja-JP')}</p>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : tab === 'products' ? (
        filteredRankings.length === 0 ? <p style={styles.empty}>データがありません。</p> : (
          <div style={styles.list}>
            {filteredRankings.map((r) => (
              <Link key={r.id} href={`/products/${r.product.ulid}`} style={styles.item}>
                <span style={styles.rank}>#{r.rank}</span>
                <img src={storageUrl(r.product.watermark_path)} alt={r.product.title} style={styles.thumbnail}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=No+Image' }} />
                <div style={styles.info}>
                  <p style={styles.title}>{r.product.title}</p>
                  <p style={styles.meta}>¥{r.product.price.toLocaleString()}</p>
                </div>
                <span style={styles.score}>{r.score.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )
      ) : (
        userRankings.length === 0 ? <p style={styles.empty}>データがありません。</p> : (
          <div style={styles.list}>
            {userRankings.map((r) => (
              <Link key={r.id} href={`/users/${r.user.ulid}`} style={styles.item}>
                <span style={styles.rank}>#{r.rank}</span>
                <img
                  src={r.user.avatar_path ? storageUrl(r.user.avatar_path) : 'https://placehold.co/56x56?text=U'}
                  alt={r.user.name} style={styles.userAvatar}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56?text=U' }}
                />
                <div style={styles.info}>
                  <p style={styles.title}>{r.user.name}</p>
                  {r.user.bio && <p style={styles.meta}>{r.user.bio.slice(0, 60)}{r.user.bio.length > 60 ? '...' : ''}</p>}
                </div>
                <span style={styles.score}>{r.score.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '16px' },
  mainTabs: { display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px' },
  mainTab: { padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#999', fontWeight: 'bold', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  mainTabActive: { color: '#333', borderBottomColor: '#333' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  tabGroup: { display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' },
  tab: { padding: '6px 16px', border: 'none', backgroundColor: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' },
  tabActive: { backgroundColor: '#333', color: '#fff' },
  snapshot: { fontSize: '12px', color: '#999', marginBottom: '16px' },
  empty: { color: '#999', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #ddd', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#fff', textDecoration: 'none', color: 'inherit' },
  rank: { fontWeight: 'bold', fontSize: '20px', color: '#333', width: '40px', flexShrink: 0 },
  thumbnail: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0', flexShrink: 0 },
  userAvatar: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  title: { fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: '13px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  score: { fontWeight: 'bold', fontSize: '18px', color: '#333', flexShrink: 0 },
}