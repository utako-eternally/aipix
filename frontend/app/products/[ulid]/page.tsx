"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productApi, orderApi, likeApi, userApi, storageUrl } from "@/lib/api";
import ReviewSection from "@/components/ReviewSection";
import { useAuth } from "@/context/AuthContext";
import type { Product, Order, Paginated } from "@/types";

type UserProfile = {
  id: number
  ulid: string
  name: string
  bio: string | null
  avatar_path: string | null
  followers_count: number
  following_count: number
  products_count: number
  is_following: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

export default function ProductDetailPage() {
  const { ulid } = useParams<{ ulid: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [ordering, setOrdering] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [authorProducts, setAuthorProducts] = useState<Product[]>([]);

  useEffect(() => {
    productApi
      .show(ulid, !!user)
      .then((p) => {
        setProduct(p);
        setLikeCount(p.like_count);
        return userApi.show(p.user.ulid);
      })
      .then((a) => {
        setAuthor(a);
        return userApi.products(a.ulid, 1);
      })
      .then((res: Paginated<Product>) => {
        // 自分自身の作品を除いて最大6件
        setAuthorProducts(res.data.filter((p) => p.ulid !== ulid).slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, [ulid, user]);

  const handleLike = async () => {
    if (!user) { router.push("/login"); return; }
    if (!product) return;
    try {
      const res = await likeApi.store(product.ulid);
      setLikeCount(res.like_count);
    } catch {
      const res = await likeApi.destroy(product.ulid);
      setLikeCount(res.like_count);
    }
  };

  const handleOrder = async () => {
    if (!user) { router.push("/login"); return; }
    if (!product) return;
    setOrdering(true);
    setError(null);
    try {
      const res = await orderApi.store(product.ulid);
      if (product.price === 0) {
        const p = await productApi.show(ulid, true);
        setProduct(p);
      } else {
        setOrder(res.order);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "購入に失敗しました。");
    } finally {
      setOrdering(false);
    }
  };

  const handleDevComplete = async () => {
    if (!order) return;
    try {
      await orderApi.devComplete(order.ulid);
      const p = await productApi.show(ulid, true);
      setProduct(p);
      setOrder(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "エラーが発生しました。");
    }
  };

  if (loading) return <div style={styles.container}><p>読み込み中...</p></div>;
  if (!product) return <div style={styles.container}><p>作品が見つかりません。</p></div>;

  const BIO_LIMIT = 60
  const bioText = author?.bio ?? ''
  const bioNeedsExpand = bioText.length > BIO_LIMIT

  return (
    <div style={styles.container}>
      <div style={styles.layout}>

        {/* 左: 画像 */}
        <div style={styles.imageWrapper}>
          <img
            src={
              product.has_purchased && product.original_path
                ? storageUrl(product.original_path)
                : storageUrl(product.watermark_path)
            }
            alt={product.title}
            style={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/600x600?text=No+Image";
            }}
          />
          {product.has_purchased && (
            <p style={styles.purchased}>✓ 購入済み（原寸画像）</p>
          )}

          {/* 画像情報 */}
          {(product.width || product.file_size) && (
            <div style={styles.imageInfo}>
              {product.width && product.height && (
                <span style={styles.imageInfoItem}>📐 {product.width} × {product.height}px</span>
              )}
              {product.file_size && (
                <span style={styles.imageInfoItem}>💾 {formatFileSize(product.file_size)}</span>
              )}
            </div>
          )}
        </div>

        {/* 右: 情報 */}
        <div style={styles.info}>
          <h1 style={styles.title}>{product.title}</h1>

          <div style={styles.meta}>
            <span style={styles.badge}>
              {{ illust: "イラスト", photo: "フォト", video: "動画" }[product.content_type] ?? product.content_type}
            </span>
            {product.age_rating === "r18" && (
              <span style={{ ...styles.badge, backgroundColor: "#e53e3e", color: "#fff", border: "none" }}>R18</span>
            )}
            {product.is_prompt_public == 1 && (
              <span style={{ ...styles.badge, backgroundColor: "#4a90e2", color: "#fff", border: "none" }}>🔓 プロンプト公開中</span>
            )}
          </div>

          {product.tags && product.tags.length > 0 && (
            <div style={styles.tags}>
              {product.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} style={styles.tag}>{tag}</Link>
              ))}
            </div>
          )}

          <div style={styles.stats}>
            <span>👁 {product.view_count}</span>
            <span>🛒 {product.purchase_count}</span>
            <span style={styles.postedAt}>
              {new Date(product.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <p style={styles.price}>¥{product.price.toLocaleString()}</p>

          {/* いいねボタン */}
          <button onClick={handleLike} style={styles.likeButton}>♥ {likeCount}</button>

          {/* 購入ボタン */}
          {!product.has_purchased && (
            <>
              {error && <p style={styles.error}>{error}</p>}
              {product.price === 0 ? (
                <button onClick={handleOrder} disabled={ordering} style={styles.buyButton}>
                  {ordering ? "処理中..." : "無料で入手する"}
                </button>
              ) : !order ? (
                <button onClick={handleOrder} disabled={ordering} style={styles.buyButton}>
                  {ordering ? "処理中..." : "購入する"}
                </button>
              ) : (
                <div style={styles.orderBox}>
                  <p>注文ID: {order.ulid}</p>
                  <p style={{ fontSize: "12px", color: "#666" }}>※ 開発用: 決済完了をシミュレート</p>
                  <button onClick={handleDevComplete} style={styles.buyButton}>決済完了（dev）</button>
                </div>
              )}
            </>
          )}

          {/* プロンプト（購入後） */}
          {product.has_purchased && product.prompt && (
            <div style={styles.promptBox}>
              <h3 style={{ marginBottom: "8px" }}>プロンプト</h3>
              <p style={styles.prompt}>{product.prompt}</p>
              {product.tool_name && (
                <p style={styles.toolName}>使用ツール: {product.tool_name}</p>
              )}
            </div>
          )}

          {/* 作者セクション */}
          {author && (
            <div style={styles.authorBox}>
              <div
                style={styles.authorHeader}
                onClick={() => router.push(`/users/${author.ulid}`)}
              >
                <img
                  src={author.avatar_path ? storageUrl(author.avatar_path) : 'https://placehold.co/48x48?text=U'}
                  alt={author.name}
                  style={styles.authorAvatar}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=U' }}
                />
                <span style={styles.authorName}>{author.name}</span>
              </div>

              {bioText && (
                <p style={styles.authorBio}>
                  {bioExpanded || !bioNeedsExpand
                    ? bioText
                    : bioText.slice(0, BIO_LIMIT) + '...'}
                  {bioNeedsExpand && (
                    <span
                      style={styles.bioToggle}
                      onClick={() => setBioExpanded((v) => !v)}
                    >
                      {bioExpanded ? ' 閉じる' : ' 続きを読む'}
                    </span>
                  )}
                </p>
              )}

              <div style={styles.authorStats}>
                <div style={styles.authorStat}>
                  <span style={styles.authorStatNum}>{author.products_count}</span>
                  <span style={styles.authorStatLabel}>出品数</span>
                </div>
                <div style={styles.authorStat}>
                  <span style={styles.authorStatNum}>{author.following_count}</span>
                  <span style={styles.authorStatLabel}>フォロー</span>
                </div>
                <div style={styles.authorStat}>
                  <span style={styles.authorStatNum}>{author.followers_count}</span>
                  <span style={styles.authorStatLabel}>フォロワー</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 作者の他の作品 */}
      {authorProducts.length > 0 && author && (
        <div style={styles.otherSection}>
          <div style={styles.otherHeader}>
            <h2 style={styles.otherTitle}>{author.name} の他の作品</h2>
            <Link href={`/users/${author.ulid}`} style={styles.otherMore}>すべて見る →</Link>
          </div>
          <div style={styles.otherScroll}>
            {authorProducts.map((p) => (
              <Link key={p.ulid} href={`/products/${p.ulid}`} style={styles.otherCard}>
                <img
                  src={storageUrl(p.watermark_path)}
                  alt={p.title}
                  style={styles.otherThumb}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/160x160?text=No+Image' }}
                />
                <p style={styles.otherCardTitle}>{p.title}</p>
                <p style={styles.otherCardPrice}>¥{p.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ReviewSection
        productUlid={product.ulid}
        hasPurchased={product.has_purchased ?? false}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" },
  imageWrapper: { position: "relative" },
  image: { width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "8px", backgroundColor: "#f0f0f0" },
  purchased: { fontSize: "12px", color: "#38a169", marginTop: "8px" },
  imageInfo: { display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" },
  imageInfoItem: { fontSize: "12px", color: "#666" },
  info: { display: "flex", flexDirection: "column", gap: "12px" },
  title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  meta: { display: "flex", gap: "8px", flexWrap: "wrap" },
  badge: { fontSize: "12px", padding: "2px 8px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f5f5f5" },
  tags: { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag: { fontSize: "12px", color: "#4a5568", backgroundColor: "#edf2f7", padding: "2px 8px", borderRadius: "4px", textDecoration: "none" },
  stats: { display: "flex", gap: "16px", fontSize: "14px", color: "#666", alignItems: "center", flexWrap: "wrap" },
  postedAt: { fontSize: "12px", color: "#999" },
  price: { fontSize: "28px", fontWeight: "bold", margin: 0 },
  likeButton: { padding: "8px 20px", border: "1px solid #e53e3e", borderRadius: "4px", color: "#e53e3e", backgroundColor: "#fff", cursor: "pointer", fontSize: "14px" },
  buyButton: { padding: "12px 24px", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" },
  orderBox: { border: "1px solid #ddd", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  error: { color: "red", fontSize: "14px" },
  promptBox: { border: "1px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#f9f9f9" },
  prompt: { fontSize: "13px", fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0 },
  toolName: { fontSize: "12px", color: "#666", marginTop: "8px", margin: 0 },
  authorBox: { border: "1px solid #eee", borderRadius: "8px", padding: "16px", backgroundColor: "#fafafa", display: "flex", flexDirection: "column", gap: "10px" },
  authorHeader: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  authorAvatar: { width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#f0f0f0", flexShrink: 0 },
  authorName: { fontWeight: "bold", fontSize: "16px" },
  authorBio: { fontSize: "13px", color: "#555", margin: 0, lineHeight: "1.6" },
  bioToggle: { color: "#4a90e2", cursor: "pointer", fontSize: "13px" },
  authorStats: { display: "flex", gap: "24px" },
  authorStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  authorStatNum: { fontWeight: "bold", fontSize: "16px" },
  authorStatLabel: { fontSize: "11px", color: "#666" },
  otherSection: { marginTop: "48px", marginBottom: "32px" },
  otherHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" },
  otherTitle: { fontSize: "18px", fontWeight: "bold", margin: 0 },
  otherMore: { fontSize: "14px", color: "#666", textDecoration: "none" },
  otherScroll: { display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" },
  otherCard: { flexShrink: 0, width: "160px", textDecoration: "none", color: "inherit", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff" },
  otherThumb: { width: "160px", height: "160px", objectFit: "cover", display: "block", backgroundColor: "#f0f0f0" },
  otherCardTitle: { fontSize: "12px", fontWeight: "bold", margin: "6px 8px 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  otherCardPrice: { fontSize: "12px", color: "#666", margin: "0 8px 8px" },
};