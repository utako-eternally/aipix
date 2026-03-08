"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { userApi, followApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Product, Paginated } from "@/types";
import type { UserProfile } from "@/types/index";
import UserSidebar from "@/components/UserSidebar";
import ProductCard from "@/components/ProductCard";

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

  useEffect(() => {
    userApi.products(ulid, page).then(setProducts);
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
      <div style={styles.layout}>
        <UserSidebar
          profile={profile}
          isMe={isMe}
          onFollow={handleFollow}
          followLoading={followLoading}
        />
        <main style={styles.main}>
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
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" },
  layout: { display: "flex", gap: "32px", alignItems: "flex-start" },
  main: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: "18px", fontWeight: "bold", margin: "0 0 16px", paddingBottom: "8px", borderBottom: "1px solid #eee" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px" },
  pageButton: { padding: "6px 16px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" },
};