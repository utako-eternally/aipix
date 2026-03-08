"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orderApi, userApi, storageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Order, Paginated } from "@/types";
import type { UserProfile } from "@/types/index";
import UserSidebar from "@/components/UserSidebar";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([
      userApi.show(user.ulid),
      orderApi.myIndex(page),
    ]).then(([p, orders]) => {
      setProfile(p);
      setOrders(orders);
    }).finally(() => setLoading(false));
  }, [user, authLoading, page]);

  if (authLoading || loading) return <div style={styles.container}><p>読み込み中...</p></div>;
  if (!profile) return null;

  return (
    <div style={styles.container}>
      <div style={styles.layout}>
        <UserSidebar profile={profile} isMe={true} />
        <main style={styles.main}>
          <h2 style={styles.sectionTitle}>購入履歴</h2>
          {orders?.data.length === 0 ? (
            <p style={{ color: "#666" }}>購入履歴はありません。</p>
          ) : (
            <>
              <div style={styles.list}>
                {orders?.data.map((order) => (
                  <div key={order.ulid} style={styles.row}>
                    <Link href={`/products/${order.product?.ulid}`} style={styles.thumbLink}>
                      <img
                        src={order.product?.watermark_path ? storageUrl(order.product.watermark_path) : 'https://placehold.co/80x80?text=No+Image'}
                        alt={order.product?.title ?? ''}
                        style={styles.thumb}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Image' }}
                      />
                    </Link>
                    <div style={styles.info}>
                      <Link href={`/products/${order.product?.ulid}`} style={styles.title}>
                        {order.product?.title ?? '削除された作品'}
                      </Link>
                      <p style={styles.meta}>
                        購入日: {order.purchased_at ? new Date(order.purchased_at).toLocaleDateString('ja-JP') : '-'}
                      </p>
                      <p style={styles.meta}>
                        金額: ¥{order.amount.toLocaleString()}
                      </p>
                    </div>
                    <p style={styles.orderId}>注文 {order.ulid.slice(0, 8)}...</p>
                  </div>
                ))}
              </div>
              {orders && orders.last_page > 1 && (
                <div style={styles.pagination}>
                  <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={styles.pageButton}>前へ</button>
                  <span>{page} / {orders.last_page}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page === orders.last_page} style={styles.pageButton}>次へ</button>
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
  list: { display: "flex", flexDirection: "column", gap: "1px", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" },
  row: { display: "flex", alignItems: "center", gap: "16px", padding: "16px", backgroundColor: "#fff", borderBottom: "1px solid #eee" },
  thumbLink: { flexShrink: 0 },
  thumb: { width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px", backgroundColor: "#f0f0f0" },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  title: { fontWeight: "bold", fontSize: "14px", color: "#333", textDecoration: "none" },
  meta: { fontSize: "12px", color: "#666", margin: 0 },
  orderId: { fontSize: "11px", color: "#999", margin: 0, flexShrink: 0 },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px" },
  pageButton: { padding: "6px 16px", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" },
};