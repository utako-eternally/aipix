"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storageUrl } from "@/lib/api";
import type { UserProfile } from "@/types/index";

type Props = {
  profile: UserProfile;
  // 他人ページ用
  isMe: boolean;
  onFollow?: () => void;
  followLoading?: boolean;
};

export default function UserSidebar({ profile, isMe, onFollow, followLoading }: Props) {
  const pathname = usePathname();

  return (
    <aside style={styles.sidebar}>
      {/* カバー画像 */}
      <div style={styles.coverWrapper}>
        {profile.cover_path ? (
          <img
            src={storageUrl(profile.cover_path)}
            alt="カバー"
            style={styles.coverImage}
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.backgroundColor = "#e8e8e8";
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div style={styles.coverPlaceholder} />
        )}
      </div>

      {/* アバター */}
      <div style={styles.avatarWrapper}>
        <img
          src={
            profile.avatar_path
              ? storageUrl(profile.avatar_path)
              : "https://placehold.co/80x80?text=U"
          }
          alt={profile.name}
          style={styles.avatar}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=U";
          }}
        />
      </div>

      <div style={styles.body}>
        {/* 名前 */}
        <p style={styles.name}>{profile.name}</p>

        {/* bio */}
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

        {/* フォローボタン（他人ページのみ） */}
        {!isMe && onFollow && (
          <button
            onClick={onFollow}
            disabled={followLoading}
            style={profile.is_following ? styles.unfollowButton : styles.followButton}
          >
            {followLoading
              ? "処理中..."
              : profile.is_following
                ? "フォロー中"
                : "フォローする"}
          </button>
        )}
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "260px",
    flexShrink: 0,
    borderRight: "1px solid #eee",
    alignSelf: "flex-start",
    position: "sticky",
    top: "80px",
  },
  coverWrapper: {
    width: "100%",
    aspectRatio: "3/1",
    backgroundColor: "#e8e8e8",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e8e8e8",
  },
  avatarWrapper: {
    padding: "0 16px",
    marginTop: "-28px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #fff",
    backgroundColor: "#f0f0f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  body: {
    padding: "8px 16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  name: {
    fontWeight: "bold",
    fontSize: "16px",
    margin: 0,
  },
  bio: {
    fontSize: "13px",
    color: "#555",
    margin: 0,
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
  },
  stats: {
    display: "flex",
    gap: "16px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
  },
  statNum: {
    fontWeight: "bold",
    fontSize: "15px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#666",
  },
  followButton: {
    padding: "8px 16px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    width: "100%",
  },
  unfollowButton: {
    padding: "8px 16px",
    backgroundColor: "#fff",
    color: "#333",
    border: "1px solid #333",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    width: "100%",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginTop: "4px",
  },
  navItem: {
    padding: "8px 12px",
    borderRadius: "4px",
    textDecoration: "none",
    fontSize: "14px",
    color: "#333",
  },
  navItemActive: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
};