'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { productApi } from '@/lib/api'
import { useR18 } from '@/context/R18Context'
import type { Product, Paginated } from '@/types'
import ProductCard from '@/components/ProductCard'

const CONTENT_TYPE_OPTIONS = [
  { value: '',       label: 'すべて' },
  { value: 'illust', label: 'イラスト' },
  { value: 'photo',  label: 'フォト' },
  { value: 'video',  label: '動画' },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isR18Mode } = useR18()

  const q = searchParams.get('q') ?? ''
  const [input, setInput] = useState(q)
  const [contentType, setContentType] = useState('')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInput(q)
    setPage(1)
  }, [q])

  useEffect(() => {
    if (!q) return
    setLoading(true)
    const params: Record<string, string> = {
      q,
      sort: 'created_at',
      page: String(page),
      age_rating: isR18Mode ? 'r18' : 'all',
    }
    if (contentType) params.content_type = contentType

    productApi.list(params)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [q, contentType, page, isR18Mode])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`)
    }
  }

  const handleContentTypeChange = (value: string) => {
    setContentType(value)
    setPage(1)
  }

  return (
    <div style={styles.container}>
      {/* 検索窓 */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="作品タイトル・タグで検索..."
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>検索</button>
      </form>

      {q && (
        <>
          <h1 style={styles.heading}>「{q}」の検索結果</h1>

          {/* コンテンツ種類フィルター */}
          <div style={styles.tabGroup}>
            {CONTENT_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => handleContentTypeChange(o.value)}
                style={{ ...styles.tab, ...(contentType === o.value ? styles.tabActive : {}) }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* 件数 */}
          {products && (
            <p style={styles.total}>{products.total.toLocaleString()} 件</p>
          )}

          {/* グリッド */}
          {loading ? (
            <p>読み込み中...</p>
          ) : products?.data.length === 0 ? (
            <p style={styles.empty}>該当する作品が見つかりませんでした。</p>
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
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
              <span>{page} / {products.last_page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === products.last_page} style={styles.pageButton}>次へ</button>
            </div>
          )}
        </>
      )}

      {!q && (
        <p style={styles.empty}>検索キーワードを入力してください。</p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  searchForm: { display: 'flex', maxWidth: '560px', gap: '0', marginBottom: '24px' },
  searchInput: { flex: 1, padding: '10px 16px', border: '2px solid #333', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '15px', outline: 'none' },
  searchButton: { padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: '14px' },
  heading: { fontSize: '20px', marginBottom: '16px' },
  tabGroup: { display: 'flex', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px', width: 'fit-content' },
  tab: { padding: '6px 16px', border: 'none', backgroundColor: '#fff', color: '#555', cursor: 'pointer', fontSize: '14px' },
  tabActive: { backgroundColor: '#333', color: '#fff' },
  total: { fontSize: '14px', color: '#666', marginBottom: '16px' },
  empty: { color: '#999', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}