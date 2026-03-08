'use client'

import { useEffect, useState } from 'react'
import { productApi } from '@/lib/api'
import { useR18 } from '@/context/R18Context'
import type { Product, Paginated } from '@/types'
import ProductCard from '@/components/ProductCard'

const SORT_OPTIONS = [
  { value: 'created_at',     label: '新着順' },
  { value: 'purchase_count', label: '売上順' },
  { value: 'view_count',     label: '閲覧順' },
  { value: 'like_count',     label: 'いいね順' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: '',       label: 'すべて' },
  { value: 'illust', label: 'イラスト' },
  { value: 'photo',  label: 'フォト' },
  { value: 'video',  label: '動画' },
]

export default function GalleryPage() {
  const { isR18Mode } = useR18()
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('created_at')
  const [contentType, setContentType] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {
      sort,
      page: String(page),
      age_rating: isR18Mode ? 'r18' : 'all',
    }
    if (contentType) params.content_type = contentType

    productApi.list(params)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [sort, contentType, page, isR18Mode])

  const handleFilterChange = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ギャラリー</h1>

      {/* フィルター */}
      <div style={styles.filters}>
        <div style={styles.tabGroup}>
          {CONTENT_TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => handleFilterChange(() => setContentType(o.value))}
              style={{ ...styles.tab, ...(contentType === o.value ? styles.tabActive : {}) }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => handleFilterChange(() => setSort(e.target.value))}
          style={styles.select}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {products && (
        <p style={styles.total}>{products.total.toLocaleString()} 件</p>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : products?.data.length === 0 ? (
        <p>作品がありません。</p>
      ) : (
        <div style={styles.grid}>
          {products?.data.map((product) => (
            <ProductCard key={product.ulid} product={product} />
          ))}
        </div>
      )}

      {products && products.last_page > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
          <span>{page} / {products.last_page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === products.last_page} style={styles.pageButton}>次へ</button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '16px' },
  filters: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  tabGroup: { display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' },
  tab: { padding: '6px 16px', border: 'none', backgroundColor: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' },
  tabActive: { backgroundColor: '#333', color: '#fff' },
  select: { padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
  total: { fontSize: '14px', color: '#666', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}