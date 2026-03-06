"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { storageUrl } from "@/lib/api";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const router = useRouter();

  return (
    <Link href={`/products/${product.ulid}`} style={styles.card}>
      <div style={styles.imageWrapper}>
        <img
          src={storageUrl(product.watermark_path)}
          alt={product.title}
          style={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/300x300?text=No+Image";
          }}
        />
                {product.is_prompt_public === true && (
          <span style={styles.promptPublic}>プロンプト</span>
        )}
      </div>
      <div style={styles.body}>
        <p style={styles.title}>{product.title}</p>
        <div
          style={styles.userRow}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/users/${product.user.ulid}`);
          }}
        >
          {product.user.avatar_path ? (
            <img
              src={storageUrl(product.user.avatar_path)}
              alt={product.user.name}
              style={styles.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div style={styles.avatarPlaceholder} />
          )}
          <span style={styles.userName}>{product.user.name}</span>
        </div>
        <div style={styles.footer}>
          <span style={styles.price}>¥{product.price.toLocaleString()}</span>
          <span style={styles.meta}>♥ {product.like_count}</span>
        </div>
        {product.age_rating === "r18" && <span style={styles.r18}>R18</span>}
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "block",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    backgroundColor: "#fff",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: 'relative', 
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  body: {
    padding: "8px 12px 12px",
    position: "relative",
  },
  title: {
    fontWeight: "bold",
    fontSize: "14px",
    margin: "0 0 6px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
    cursor: "pointer",
  },
  avatar: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#f0f0f0",
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#ddd",
    flexShrink: 0,
  },
  userName: {
    fontSize: "12px",
    color: "#666",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#333",
  },
  meta: {
    fontSize: "12px",
    color: "#999",
  },
  r18: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "#e53e3e",
    color: "#fff",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  promptPublic: {
    position: "absolute",
    top: "8px",
    left: "8px",
    backgroundColor: "#4a90e2",
    color: "#fff",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
  },
};
