'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, storageUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Product, Paginated } from '@/types'

const STATUS_OPTIONS = [
  { value: 'pending',  label: '審査待ち' },
  { value: 'approved', label: '公開中' },
  { value: 'rejected', label: '却下' },
  { value: 'hidden',   label: '非表示' },
]

const REJECT_REASONS = [
  '著作権侵害の疑い',
  'AI生成ではない',
  '規約違反',
  '画質が低い',
  'その他',
]

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 画像拡大モーダル
  const [modalImage, setModalImage] = useState<string | null>(null)

  // 却下モーダル
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectSelected, setRejectSelected] = useState(REJECT_REASONS[0])
  const [rejectCustom, setRejectCustom] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (user.role !== 'admin') { router.push('/'); return }
    fetchProducts()
  }, [user, authLoading, status])

  const fetchProducts = () => {
    setLoading(true)
    adminApi.list(status)
      .then(setProducts)
      .finally(() => setLoading(false))
  }

  const handleApprove = async (ulid: string) => {
    setActionLoading(ulid)
    try {
      await adminApi.approve(ulid)
      fetchProducts()
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return
    const reason = rejectSelected === 'その他' ? rejectCustom : rejectSelected
    if (!reason) { alert('却下理由を入力してください。'); return }

    setActionLoading(rejectTarget)
    try {
      await adminApi.reject(rejectTarget, reason)
      setRejectTarget(null)
      setRejectSelected(REJECT_REASONS[0])
      setRejectCustom('')
      fetchProducts()
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || loading) return <div style={styles.container}><p>読み込み中...</p></div>

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>審査管理</h1>

      {/* ステータスフィルター */}
      <div style={styles.filters}>
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setStatus(o.value)}
            style={{ ...styles.filterButton, ...(status === o.value ? styles.filterButtonActive : {}) }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {products?.data.length === 0 ? (
        <p>該当する作品はありません。</p>
      ) : (
        <div style={styles.list}>
          {products?.data.map((product) => (
            <div key={product.ulid} style={styles.item}>

              {/* サムネイル（クリックで拡大） */}
              <img
                src={storageUrl(product.watermark_path)}
                alt={product.title}
                style={styles.thumbnail}
                onClick={() => setModalImage(storageUrl(product.watermark_path))}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image'
                }}
              />

              {/* 作品情報 */}
              <div style={styles.info}>
                <p style={styles.title}>{product.title}</p>
                <p style={styles.meta}>投稿者: {product.user?.name}</p>
                <p style={styles.meta}>
                  {product.content_type === 'illust' ? 'イラスト' : 'フォト'} /
                  {product.age_rating === 'r18' ? ' R18' : ' 全年齢'} /
                  ¥{product.price.toLocaleString()}
                </p>
                {product.tags && product.tags.length > 0 && (
                  <p style={styles.meta}>{product.tags.join(' ')}</p>
                )}
                <a
                  href={`/products/${product.ulid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.detailLink}
                >
                  詳細を見る →
                </a>
              </div>

              {/* アクション */}
              {status === 'pending' && (
                <div style={styles.actions}>
                  <button
                    onClick={() => handleApprove(product.ulid)}
                    disabled={actionLoading === product.ulid}
                    style={{ ...styles.actionButton, backgroundColor: '#38a169' }}
                  >
                    承認
                  </button>
                  <button
                    onClick={() => setRejectTarget(product.ulid)}
                    disabled={actionLoading === product.ulid}
                    style={{ ...styles.actionButton, backgroundColor: '#e53e3e' }}
                  >
                    却下
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 画像拡大モーダル */}
      {modalImage && (
        <div style={styles.overlay} onClick={() => setModalImage(null)}>
          <img
            src={modalImage}
            alt="拡大"
            style={styles.modalImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 却下理由モーダル */}
      {rejectTarget && (
        <div style={styles.overlay} onClick={() => setRejectTarget(null)}>
          <div style={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>却下理由を選択</h3>
            <div style={styles.reasonList}>
              {REJECT_REASONS.map((r) => (
                <label key={r} style={styles.reasonLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={rejectSelected === r}
                    onChange={() => setRejectSelected(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            {rejectSelected === 'その他' && (
              <input
                type="text"
                placeholder="理由を入力"
                value={rejectCustom}
                onChange={(e) => setRejectCustom(e.target.value)}
                style={styles.customInput}
              />
            )}
            <div style={styles.modalActions}>
              <button
                onClick={() => setRejectTarget(null)}
                style={styles.cancelButton}
              >
                キャンセル
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                style={{ ...styles.actionButton, backgroundColor: '#e53e3e' }}
              >
                却下する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' },
  heading: { marginBottom: '16px' },
  filters: { display: 'flex', gap: '8px', marginBottom: '24px' },
  filterButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' },
  filterButtonActive: { backgroundColor: '#333', color: '#fff', borderColor: '#333' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  item: { display: 'flex', gap: '16px', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', alignItems: 'flex-start' },
  thumbnail: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f0f0f0', flexShrink: 0, cursor: 'pointer' },
  info: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px' },
  meta: { fontSize: '13px', color: '#666', margin: '2px 0' },
  detailLink: { fontSize: '13px', color: '#4a5568', textDecoration: 'underline' },
  actions: { display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 },
  actionButton: { padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#fff' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalImage: { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' },
  rejectModal: { backgroundColor: '#fff', borderRadius: '8px', padding: '24px', minWidth: '320px' },
  reasonList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  reasonLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' },
  customInput: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  cancelButton: { padding: '8px 20px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', backgroundColor: '#fff' },
}