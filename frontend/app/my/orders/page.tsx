'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { orderApi, storageUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Order, Paginated } from '@/types'

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Paginated<Order> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }

    orderApi.myList()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) return <div style={styles.container}><p>読み込み中...</p></div>

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>購入履歴</h1>

      {orders?.data.length === 0 ? (
        <p>購入した作品はありません。</p>
      ) : (
        <div style={styles.list}>
          {orders?.data.map((order) => (
            <div key={order.ulid} style={styles.item}>
              <Link href={`/products/${order.product?.ulid}`} style={styles.imageLink}>
                <img
                  src={storageUrl(product.watermark_path)}
                  alt={order.product?.title}
                  style={styles.thumbnail}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Image'
                  }}
                />
              </Link>
              <div style={styles.itemInfo}>
                <Link href={`/products/${order.product?.ulid}`} style={styles.itemTitle}>
                  {order.product?.title}
                </Link>
                <p style={styles.itemMeta}>¥{order.amount.toLocaleString()}</p>
                <p style={styles.itemMeta}>
                  購入日: {order.purchased_at
                    ? new Date(order.purchased_at).toLocaleDateString('ja-JP')
                    : '—'}
                </p>
              </div>
              <Link href={`/products/${order.product?.ulid}`} style={styles.detailLink}>
                詳細を見る
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '24px' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  item: { display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' },
  imageLink: { flexShrink: 0 },
  thumbnail: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0' },
  itemInfo: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: '16px', textDecoration: 'none', color: '#333' },
  itemMeta: { fontSize: '14px', color: '#666', margin: '4px 0 0' },
  detailLink: { fontSize: '14px', color: '#4a5568', textDecoration: 'underline' },
}