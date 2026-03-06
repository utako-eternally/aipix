"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { userApi, followApi, storageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Product, Paginated } from "@/types";
import ProductCard from "@/components/ProductCard";

type UserProfile = {
  id: number;
  ulid: string;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  cover_path: string | null;
  followers_count: number;
  following_count: number;
  products_count: number;
  is_following: boolean;
  created_at: string;
};

export default function UserPage() {
  const { ulid } = useParams<{ ulid: string }>();
  const { user: me } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    userApi
      .show(ulid)
      .then(setProfile)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [ulid]);

  const fetchProducts = async () => {
    const res = await userApi.products(ulid, page);
    setProducts(res);
  };

  useEffect(() => {
    fetchProducts();
  }, [ulid, page]);

  const handleFollow = async () => {
    if (!me) { router.push("/login"); return; }
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        const res = await followApi.destroy(profile.ulid);
        setProfile((p) => p ? { ...p, is_following: false, followers_count: res.followers_count } : p);
      } else {
        const res = await followApi.store(profile.ulid);
        setProfile((p) => p ? { ...p, is_following: true, followers_count: res.followers_count } : p);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div style={styles.container}><p>読み込み中...</p></div>;
  if (!profile) return <div style={styles.container}><p>ユーザーが見つかりません。</p></div>;

  const isMe = me?.ulid === profile.ulid;

  return (
    <div style={styles.container}>

      {/* カバー画像 */}
      <div style={styles.coverWrapper}>
        {profile.cover_path ? (
          <img
            src={storageUrl(profile.cover_path)}
            alt="カバー画像"
            style={styles.coverImage}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={styles.coverPlaceholder} />
        )}
      </div>

      {/* プロフィールヘッダー */}
      <div style={styles.header}>
        <img
          src={profile.avatar_path ? storageUrl(profile.avatar_path) : "https://placehold.co/100x100?text=No+Image"}
          alt={profile.name}
          style={styles.avatar}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image" }}
        />
        <div style={styles.headerInfo}>
          <h1 style={styles.name}>{profile.name}</h1>
          {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

          {/* 統計 */}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{profile.products_count}</span>
              <span style={styles.statLabel}>投稿</span>
            </div>
            <Link href={`/users/${profile.ulid}/followers`} style={styles.stat}>
              <span style={styles.statNum}>{profile.followers_count}</span>
              <span style={styles.statLabel}>フォロワー</span>
            </Link>
            <Link href={`/users/${profile.ulid}/following`} style={styles.stat}>
              <span style={styles.statNum}>{profile.following_count}</span>
              <span style={styles.statLabel}>フォロー中</span>
            </Link>
          </div>

          <button
            onClick={handleFollow}
            disabled={followLoading || isMe}
            style={profile.is_following ? styles.unfollowButton : styles.followButton}
          >
            {followLoading ? "処理中..." : profile.is_following ? "フォロー中" : "フォローする"}
          </button>
        </div>
      </div>

      {/* 投稿作品一覧 */}
      <h2 style={styles.sectionTitle}>投稿作品</h2>
      {products?.data.length === 0 ? (
        <p style={{ color: "#666" }}>投稿作品はありません。</p>
      ) : (
        <>
          <div style={styles.grid}>
            {products?.data.map((product) => (
              <ProductCard key={product.ulid} product={product} />
            ))}
          </div>

          {products && products.last_page > 1 && (
            <div style={styles.pagination}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
              <span>{page} / {products.last_page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === products.last_page} style={styles.pageButton}>次へ</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1100px", margin: "0 auto", padding: "0 0 24px" },
  coverWrapper: { width: "100%", aspectRatio: "3/1", overflow: "hidden", backgroundColor: "#e8e8e8", marginBottom: "0" },
  coverImage: { width: "100%", height: "100%", objectFit: "cover" },
  coverPlaceholder: { width: "100%", height: "100%", backgroundColor: "#e8e8e8" },
  header: { display: "flex", gap: "24px", margin: "20px 16px 40px", alignItems: "flex-start" },
  avatar: { width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #fff", backgroundColor: "#f0f0f0", flexShrink: 0, marginTop: "-40px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" },
  headerInfo: { display: "flex", flexDirection: "column", gap: "10px" },
  name: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  bio: { fontSize: "14px", color: "#555", margin: 0, maxWidth: "600px", whiteSpace: "pre-wrap" },
  stats: { display: "flex", gap: "24px" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", color: "inherit" },
  statNum: { fontWeight: "bold", fontSize: "18px" },
  statLabel: { fontSize: "12px", color: "#666" },
  followButton: { padding: "8px 24px", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" },
  unfollowButton: { padding: "8px 24px", backgroundColor: "#fff", color: "#333", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "14px" },
  sectionTitle: { fontSize: "18px", fontWeight: "bold", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px", margin: "0 16px 16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", padding: "0 16px" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px" },
  pageButton: { padding: "6px 16px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" },
};