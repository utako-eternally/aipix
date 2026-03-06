'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rankingApi, storageUrl } from '@/lib/api'
import type { Ranking } from '@/types'

const PERIOD_OPTIONS = [
  { value: 'daily',   label: '日間' },
  { value: 'weekly',  label: '週間' },
  { value: 'monthly', label: '月間' },
]

const AXIS_OPTIONS = [
  { value: 'sales', label: '売上' },
  { value: 'views', label: '閲覧' },
  { value: 'likes', label: 'いいね' },
]

const AGE_OPTIONS = [
  { value: 'all', label: '全年齢' },
  { value: 'r18', label: 'R18' },
]

export default function RankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [snapshotted_at, setSnapshottedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('daily')
  const [axis, setAxis] = useState('sales')
  const [ageRating, setAgeRating] = useState('all')

  const fetchRankings = async () => {
    setLoading(true)
    try {
      const res = await rankingApi.index({ period, axis, age_rating: ageRating })
      setRankings(res.data)
      setSnapshottedAt(res.snapshotted_at)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings()
  }, [period, axis, ageRating])

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ランキング</h1>

      {/* フィルター */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              style={{ ...styles.filterButton, ...(period === o.value ? styles.filterButtonActive : {}) }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          {AXIS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setAxis(o.value)}
              style={{ ...styles.filterButton, ...(axis === o.value ? styles.filterButtonActive : {}) }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          {AGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setAgeRating(o.value)}
              style={{ ...styles.filterButton, ...(ageRating === o.value ? styles.filterButtonActive : {}) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {snapshotted_at && (
        <p style={styles.snapshot}>
          集計日時: {new Date(snapshotted_at).toLocaleString('ja-JP')}
        </p>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : rankings.length === 0 ? (
        <p>データがありません。</p>
      ) : (
        <div style={styles.list}>
          {rankings.map((r) => (
            <Link key={r.id} href={`/products/${r.product.ulid}`} style={styles.item}>
              <span style={styles.rank}>#{r.rank}</span>
              <img
                src={storageUrl(r.product.watermark_path)}
                alt={r.product.title}
                style={styles.thumbnail}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=No+Image'
                }}
              />
              <div style={styles.info}>
                <p style={styles.title}>{r.product.title}</p>
                <p style={styles.meta}>¥{r.product.price.toLocaleString()}</p>
              </div>
              <span style={styles.score}>{r.score.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '16px' },
  filters: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  filterGroup: { display: 'flex', gap: '8px' },
  filterButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px' },
  filterButtonActive: { backgroundColor: '#333', color: '#fff', borderColor: '#333' },
  snapshot: { fontSize: '12px', color: '#999', marginBottom: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #ddd', borderRadius: '8px', padding: '12px 16px', backgroundColor: '#fff', textDecoration: 'none', color: 'inherit' },
  rank: { fontWeight: 'bold', fontSize: '20px', color: '#333', width: '40px', flexShrink: 0 },
  thumbnail: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0', flexShrink: 0 },
  info: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px' },
  meta: { fontSize: '13px', color: '#666', margin: 0 },
  score: { fontWeight: 'bold', fontSize: '18px', color: '#333', flexShrink: 0 },
}