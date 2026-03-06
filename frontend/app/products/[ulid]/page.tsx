"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productApi, orderApi, likeApi, storageUrl } from "@/lib/api";
import ReviewSection from "@/components/ReviewSection";
import { useAuth } from "@/context/AuthContext";
import type { Product, Order } from "@/types";

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

  useEffect(() => {
    productApi
      .show(ulid, !!user)
      .then((p) => {
        setProduct(p);
        setLikeCount(p.like_count);
      })
      .finally(() => setLoading(false));
  }, [ulid, user]);

  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product) return;
    try {
      const res = await likeApi.store(product.ulid);
      setLikeCount(res.like_count);
    } catch {
      // すでにいいね済みの場合は解除
      const res = await likeApi.destroy(product.ulid);
      setLikeCount(res.like_count);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product) return;
    setOrdering(true);
    setError(null);
    try {
      const res = await orderApi.store(product.ulid);
      if (product.price === 0) {
        // 無料の場合は即完了 → 詳細を再取得
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
      // 購入完了後に詳細を再取得
      const p = await productApi.show(ulid, true);
      setProduct(p);
      setOrder(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "エラーが発生しました。");
    }
  };

  if (loading)
    return (
      <div style={styles.container}>
        <p>読み込み中...</p>
      </div>
    );
  if (!product)
    return (
      <div style={styles.container}>
        <p>作品が見つかりません。</p>
      </div>
    );

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
              (e.target as HTMLImageElement).src =
                "https://placehold.co/600x600?text=No+Image";
            }}
          />
          {product.has_purchased && (
            <p style={styles.purchased}>✓ 購入済み（原寸画像）</p>
          )}
        </div>

        {/* 右: 情報 */}
        <div style={styles.info}>
          <h1 style={styles.title}>{product.title}</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
            onClick={() => router.push(`/users/${product.user.ulid}`)}
          >
            <img
              src={
                product.user.avatar_path
                  ? storageUrl(product.user.avatar_path)
                  : "https://placehold.co/32x32?text=U"
              }
              alt={product.user.name}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                objectFit: "cover",
                backgroundColor: "#f0f0f0",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/32x32?text=U";
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color: "#4a90e2",
                textDecoration: "underline",
              }}
            >
              {product.user.name}
            </span>
          </div>

          <div style={styles.meta}>
            <span style={styles.badge}>
              {{ illust: "イラスト", photo: "フォト", video: "動画" }[
                product.content_type
              ] ?? product.content_type}
            </span>
            {product.age_rating === "r18" && (
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: "#e53e3e",
                  color: "#fff",
                }}
              >
                R18
              </span>
            )}
          </div>

          {product.tags && product.tags.length > 0 && (
            <div style={styles.tags}>
              {product.tags.map((tag) => (
                <span key={tag} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div style={styles.stats}>
            <span>👁 {product.view_count}</span>
            <span>🛒 {product.purchase_count}</span>
          </div>

          <p style={styles.price}>¥{product.price.toLocaleString()}</p>

          {/* いいねボタン */}
          <button onClick={handleLike} style={styles.likeButton}>
            ♥ {likeCount}
          </button>

          {/* 購入ボタン */}
          {!product.has_purchased && (
            <>
              {error && <p style={styles.error}>{error}</p>}
              {product.price === 0 ? (
                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  style={styles.buyButton}
                >
                  {ordering ? "処理中..." : "無料で入手する"}
                </button>
              ) : !order ? (
                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  style={styles.buyButton}
                >
                  {ordering ? "処理中..." : "購入する"}
                </button>
              ) : (
                <div style={styles.orderBox}>
                  <p>注文ID: {order.ulid}</p>
                  <p style={{ fontSize: "12px", color: "#666" }}>
                    ※ 開発用: 決済完了をシミュレート
                  </p>
                  <button onClick={handleDevComplete} style={styles.buyButton}>
                    決済完了（dev）
                  </button>
                </div>
              )}
            </>
          )}

          {/* プロンプト（購入後） */}
          {product.is_prompt_public && (
            <span
              style={{
                fontSize: "12px",
                color: "#4a90e2",
                marginBottom: "4px",
                display: "block",
              }}
            >
              🔓 プロンプト公開中
            </span>
          )}

          {(product.has_purchased || product.is_prompt_public) &&
            product.prompt && (
              <div style={styles.promptBox}>
                <h3 style={{ marginBottom: "8px" }}>プロンプト</h3>
                <p style={styles.prompt}>{product.prompt}</p>
                {product.tool_name && (
                  <p style={styles.toolName}>使用ツール: {product.tool_name}</p>
                )}
              </div>
            )}
        </div>
      </div>
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
  image: {
    width: "100%",
    aspectRatio: "1/1",
    objectFit: "cover",
    borderRadius: "8px",
    backgroundColor: "#f0f0f0",
  },
  purchased: { fontSize: "12px", color: "#38a169", marginTop: "8px" },
  info: { display: "flex", flexDirection: "column", gap: "12px" },
  title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  user: { fontSize: "14px", color: "#666", margin: 0 },
  meta: { display: "flex", gap: "8px" },
  badge: {
    fontSize: "12px",
    padding: "2px 8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
  },
  tags: { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag: {
    fontSize: "12px",
    color: "#4a5568",
    backgroundColor: "#edf2f7",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  stats: { display: "flex", gap: "16px", fontSize: "14px", color: "#666" },
  price: { fontSize: "28px", fontWeight: "bold", margin: 0 },
  likeButton: {
    padding: "8px 20px",
    border: "1px solid #e53e3e",
    borderRadius: "4px",
    color: "#e53e3e",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  buyButton: {
    padding: "12px 24px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  orderBox: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  error: { color: "red", fontSize: "14px" },
  promptBox: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "#f9f9f9",
  },
  prompt: {
    fontSize: "13px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    margin: 0,
  },
  toolName: { fontSize: "12px", color: "#666", marginTop: "8px", margin: 0 },
};
