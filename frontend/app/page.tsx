'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { rankingApi, storageUrl } from '@/lib/api'
import { useR18 } from '@/context/R18Context'
import type { Ranking, RankingUser } from '@/types'
import ProductCard from '@/components/ProductCard'

const POPULAR_TAGS = [
  'ファンタジー', '美少女', 'サイバーパンク', '風景', 'ポートレート',
  'アニメ', 'リアル', 'モノクロ', 'SF', '和風',
  'ホラー', 'かわいい', '抽象', '建築', 'メカ',
]

export default function TopPage() {
  const router = useRouter()
  const { isR18Mode } = useR18()
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [userRankings, setUserRankings] = useState<RankingUser[]>([])
  const [rankingsLoading, setRankingsLoading] = useState(true)
  const [userRankingsLoading, setUserRankingsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setRankingsLoading(true)
    rankingApi.index({ period: 'weekly', age_rating: isR18Mode ? 'r18' : 'all' })
      .then((res) => setRankings(res.data.slice(0, 8)))
      .catch(() => setRankings([]))
      .finally(() => setRankingsLoading(false))
  }, [isR18Mode])

  useEffect(() => {
    setUserRankingsLoading(true)
    rankingApi.users({ period: 'weekly' })
      .then((res) => setUserRankings(res.data.slice(0, 8)))
      .catch(() => setUserRankings([]))
      .finally(() => setUserRankingsLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div style={styles.container}>

      {/* 検索窓 */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>AI生成画像を探す・売る</h1>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="作品タイトル・タグで検索..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>検索</button>
        </form>
      </section>

      {/* 人気タグ */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>人気のタグ</h2>
        <div style={styles.tagList}>
          {POPULAR_TAGS.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} style={styles.tag}>
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      {/* 人気ランキング */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>人気ランキング</h2>
          <Link href="/rankings" style={styles.moreLink}>もっと見る →</Link>
        </div>
        {rankingsLoading ? (
          <p style={styles.loading}>読み込み中...</p>
        ) : rankings.length === 0 ? (
          <p style={styles.empty}>データがありません。</p>
        ) : (
          <div style={styles.rankingGrid}>
            {rankings.map((r) => (
              <ProductCard key={r.id} product={r.product} rank={r.rank} />
            ))}
          </div>
        )}
      </section>

      {/* 人気クリエイター */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>人気クリエイター</h2>
          <Link href="/rankings?tab=users" style={styles.moreLink}>もっと見る →</Link>
        </div>
        {userRankingsLoading ? (
          <p style={styles.loading}>読み込み中...</p>
        ) : userRankings.length === 0 ? (
          <p style={styles.empty}>データがありません。</p>
        ) : (
          <div style={styles.userRankingList}>
            {userRankings.map((r) => (
              <Link key={r.id} href={`/users/${r.user.ulid}`} style={styles.userRankingCard}>
                <span style={styles.userRank}>#{r.rank}</span>
                <img
                  src={r.user.avatar_path ? storageUrl(r.user.avatar_path) : 'https://placehold.co/48x48?text=U'}
                  alt={r.user.name}
                  style={styles.userAvatar}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=U' }}
                />
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{r.user.name}</p>
                  {r.user.bio && <p style={styles.userBio}>{r.user.bio.slice(0, 40)}{r.user.bio.length > 40 ? '...' : ''}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  hero: { textAlign: 'center', padding: '48px 16px', marginBottom: '8px' },
  heroTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#333' },
  searchForm: { display: 'flex', maxWidth: '560px', margin: '0 auto', gap: '0' },
  searchInput: { flex: 1, padding: '12px 16px', border: '2px solid #333', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '15px', outline: 'none' },
  searchButton: { padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  section: { marginBottom: '48px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  moreLink: { fontSize: '14px', color: '#666', textDecoration: 'none' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { padding: '6px 14px', backgroundColor: '#f5f5f5', borderRadius: '999px', fontSize: '13px', color: '#555', textDecoration: 'none', border: '1px solid #e0e0e0' },
  loading: { color: '#999', fontSize: '14px' },
  empty: { color: '#999', fontSize: '14px' },
  rankingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  userRankingList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  userRankingCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff', textDecoration: 'none', color: 'inherit' },
  userRank: { fontSize: '16px', fontWeight: 'bold', color: '#999', width: '32px', flexShrink: 0 },
  userAvatar: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0', flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontWeight: 'bold', fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userBio: { fontSize: '12px', color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
}