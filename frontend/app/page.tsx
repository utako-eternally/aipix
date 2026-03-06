'use client'

import { useEffect, useState } from 'react'
import { productApi } from '@/lib/api'
import type { Product, Paginated } from '@/types'
import ProductCard from '@/components/ProductCard'

const SORT_OPTIONS = [
  { value: 'created_at',    label: '新着順' },
  { value: 'purchase_count', label: '売上順' },
  { value: 'view_count',    label: '閲覧順' },
  { value: 'like_count',    label: 'いいね順' },
]

export default function GalleryPage() {
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('created_at')
  const [contentType, setContentType] = useState('')
  const [ageRating, setAgeRating] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { sort, page: String(page) }
    if (contentType) params.content_type = contentType
    if (ageRating) params.age_rating = ageRating

    productApi.list(params)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [sort, contentType, ageRating, page])

  const handleFilterChange = () => setPage(1)

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>ギャラリー</h1>

      {/* フィルター */}
      <div style={styles.filters}>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); handleFilterChange() }}
          style={styles.select}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={contentType}
          onChange={(e) => { setContentType(e.target.value); handleFilterChange() }}
          style={styles.select}
        >
          <option value="">すべての種類</option>
          <option value="illust">イラスト</option>
          <option value="photo">フォト</option>
        </select>

        <select
          value={ageRating}
          onChange={(e) => { setAgeRating(e.target.value); handleFilterChange() }}
          style={styles.select}
        >
          <option value="">全年齢 + R18</option>
          <option value="all">全年齢のみ</option>
          <option value="r18">R18のみ</option>
        </select>
      </div>

      {/* 件数 */}
      {products && (
        <p style={styles.total}>{products.total} 件</p>
      )}

      {/* グリッド */}
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

      {/* ページネーション */}
      {products && products.last_page > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            style={styles.pageButton}
          >
            前へ
          </button>
          <span>{page} / {products.last_page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === products.last_page}
            style={styles.pageButton}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '16px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  select: { padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
  total: { fontSize: '14px', color: '#666', marginBottom: '16px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}