'use client'

import { useEffect, useState } from 'react'
import { reviewApi, userApi, storageUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Review, Paginated } from '@/types'

type Props = {
  productUlid: string
  hasPurchased: boolean
}

const STARS = [1, 2, 3, 4, 5]

export default function ReviewSection({ productUlid, hasPurchased }: Props) {
  const { user } = useAuth()

  const [reviews, setReviews] = useState<Paginated<Review> | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // 投稿フォーム
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await userApi.reviews(productUlid, page)
      setReviews(res.reviews)
      setAvgRating(res.avg_rating)
      setCount(res.count)

      // 自分のレビューが含まれていれば投稿済みとする
      if (user && res.reviews.data.some((r) => r.user_id === user.id)) {
        setSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productUlid, page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await reviewApi.store(productUlid, { rating, body: body || undefined })
      setSubmitted(true)
      setBody('')
      setPage(1)
      fetchReviews()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message ?? 'レビューの投稿に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        レビュー
        {avgRating !== null && (
          <span style={styles.avg}>
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))} {avgRating} ({count}件)
          </span>
        )}
      </h3>

      {/* 投稿フォーム */}
      {hasPurchased && user && !submitted && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.formTitle}>レビューを投稿する</p>
          {error && <p style={styles.error}>{error}</p>}

          {/* 星評価 */}
          <div style={styles.starRow}>
            {STARS.map((s) => (
              <span
                key={s}
                style={{ ...styles.star, color: s <= rating ? '#f6ad55' : '#ddd' }}
                onClick={() => setRating(s)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="レビューを書く（任意）"
            style={styles.textarea}
          />
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? '送信中...' : '投稿する'}
          </button>
        </form>
      )}

      {submitted && hasPurchased && (
        <p style={styles.submittedMsg}>✓ レビュー済みです</p>
      )}

      {/* レビュー一覧 */}
      {loading ? (
        <p>読み込み中...</p>
      ) : reviews?.data.length === 0 ? (
        <p style={styles.empty}>まだレビューはありません。</p>
      ) : (
        <div style={styles.list}>
          {reviews?.data.map((review) => (
            <div key={review.ulid} style={styles.item}>
              <div style={styles.itemHeader}>
                <img
                  src={review.user.avatar_path ? storageUrl(review.user.avatar_path) : 'https://placehold.co/32x32?text=U'}
                  alt={review.user.name}
                  style={styles.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=U'
                  }}
                />
                <div>
                  <p style={styles.userName}>{review.user.name}</p>
                  <p style={styles.date}>{new Date(review.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <span style={styles.stars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              {review.body && <p style={styles.body}>{review.body}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {reviews && reviews.last_page > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
          <span>{page} / {reviews.last_page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === reviews.last_page} style={styles.pageButton}>次へ</button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '24px' },
  heading: { fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  avg: { fontSize: '14px', color: '#f6ad55', fontWeight: 'normal' },
  form: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '24px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '8px' },
  formTitle: { fontWeight: 'bold', fontSize: '14px', margin: 0 },
  starRow: { display: 'flex', gap: '4px' },
  star: { fontSize: '28px', cursor: 'pointer' },
  textarea: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', resize: 'vertical' },
  button: { padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start' },
  error: { color: '#e53e3e', fontSize: '14px', margin: 0 },
  submittedMsg: { fontSize: '14px', color: '#38a169', marginBottom: '16px' },
  empty: { color: '#999', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  item: { border: '1px solid #eee', borderRadius: '8px', padding: '12px', backgroundColor: '#fff' },
  itemHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#f0f0f0' },
  userName: { fontWeight: 'bold', fontSize: '14px', margin: 0 },
  date: { fontSize: '12px', color: '#999', margin: 0 },
  stars: { marginLeft: 'auto', color: '#f6ad55', fontSize: '16px' },
  body: { fontSize: '14px', color: '#444', margin: 0, whiteSpace: 'pre-wrap' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' },
  pageButton: { padding: '6px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
}