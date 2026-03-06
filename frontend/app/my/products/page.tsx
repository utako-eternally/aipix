'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { productApi, storageUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Product, Paginated } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pending:  '審査待ち',
  approved: '公開中',
  rejected: '却下',
  hidden:   '非表示',
}

const STATUS_COLOR: Record<string, string> = {
  pending:  '#d69e2e',
  approved: '#38a169',
  rejected: '#e53e3e',
  hidden:   '#718096',
}

export default function MyProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }

    productApi.myList()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) return <div style={styles.container}><p>読み込み中...</p></div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>マイ投稿</h1>
        <Link href="/products/new" style={styles.newButton}>+ 新規投稿</Link>
      </div>

      {products?.data.length === 0 ? (
        <p>投稿した作品はありません。</p>
      ) : (
        <div style={styles.list}>
          {products?.data.map((product) => (
            <div key={product.ulid} style={styles.item}>
              <img
                src={storageUrl(product.watermark_path)}
                alt={product.title}
                style={styles.thumbnail}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Image'
                }}
              />
              <div style={styles.itemInfo}>
                <p style={styles.itemTitle}>{product.title}</p>
                <p style={styles.itemMeta}>¥{product.price.toLocaleString()}</p>
                <p style={styles.itemMeta}>
                  👁 {product.view_count} &nbsp; ♥ {product.like_count} &nbsp; 🛒 {product.purchase_count}
                </p>
              </div>
              <span style={{ ...styles.status, color: STATUS_COLOR[product.status ?? 'pending'] }}>
                {STATUS_LABEL[product.status ?? 'pending']}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  heading: { margin: 0 },
  newButton: { padding: '8px 16px', backgroundColor: '#333', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  item: { display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' },
  thumbnail: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0', flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px' },
  itemMeta: { fontSize: '14px', color: '#666', margin: '4px 0 0' },
  status: { fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
}