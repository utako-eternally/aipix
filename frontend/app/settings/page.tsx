"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAuth } from "@/context/AuthContext";
import { profileApi, storageUrl } from "@/lib/api";

type FieldErrors = Record<string, string[]>;

// ── Canvas からトリミング済み Blob を生成 ──────────────
function cropImageToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
      "image/webp",
      0.9,
    );
  });
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // プロフィール
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // アバター
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [avatarFieldErrors, setAvatarFieldErrors] = useState<FieldErrors>({});
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [avatarCrop, setAvatarCrop] = useState<Crop>({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
  const avatarPixelCropRef = useRef<PixelCrop | null>(null);
  const avatarImgRef = useRef<HTMLImageElement>(null);

  // カバー
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverMsg, setCoverMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [coverFieldErrors, setCoverFieldErrors] = useState<FieldErrors>({});
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  const [coverCrop, setCoverCrop] = useState<Crop>({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
  const coverPixelCropRef = useRef<PixelCrop | null>(null);
  const coverImgRef = useRef<HTMLImageElement>(null);

  // パスワード
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    setName(user.name);
    setBio(user.bio ?? "");
    if (user.avatar_path) setAvatarPreview(storageUrl(user.avatar_path));
    if (user.cover_path) setCoverPreview(storageUrl(user.cover_path));
  }, [user, authLoading]);

  // ── アバター ────────────────────────────────────
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    avatarPixelCropRef.current = null;
    setAvatarCropSrc(URL.createObjectURL(file));
    setAvatarCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
  };

  const handleAvatarSave = async () => {
    if (!avatarImgRef.current) return;
    const crop = avatarPixelCropRef.current;
    if (!crop || crop.width === 0 || crop.height === 0) {
      setAvatarMsg({ type: "err", text: "トリミング範囲を選択してください。" });
      return;
    }
    setAvatarLoading(true);
    setAvatarMsg(null);
    setAvatarFieldErrors({});
    try {
      const blob = await cropImageToBlob(avatarImgRef.current, crop, 200, 200);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.webp");
      await profileApi.updateAvatar(formData);
      setAvatarPreview(URL.createObjectURL(blob));
      setAvatarCropSrc(null);
      setAvatarMsg({ type: "ok", text: "アイコンを更新しました。" });
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors };
      if (e?.errors) setAvatarFieldErrors(e.errors);
      else setAvatarMsg({ type: "err", text: e?.message ?? "更新に失敗しました。" });
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── カバー ──────────────────────────────────────
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    coverPixelCropRef.current = null;
    setCoverCropSrc(URL.createObjectURL(file));
    setCoverCrop({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
  };

  const handleCoverSave = async () => {
    if (!coverImgRef.current) return;
    const crop = coverPixelCropRef.current;
    if (!crop || crop.width === 0 || crop.height === 0) {
      setCoverMsg({ type: "err", text: "トリミング範囲を選択してください。" });
      return;
    }
    setCoverLoading(true);
    setCoverMsg(null);
    setCoverFieldErrors({});
    try {
      const blob = await cropImageToBlob(coverImgRef.current, crop, 1200, 400);
      const formData = new FormData();
      formData.append("cover", blob, "cover.webp");
      await profileApi.updateCover(formData);
      setCoverPreview(URL.createObjectURL(blob));
      setCoverCropSrc(null);
      setCoverMsg({ type: "ok", text: "カバー画像を更新しました。" });
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors };
      if (e?.errors) setCoverFieldErrors(e.errors);
      else setCoverMsg({ type: "err", text: e?.message ?? "更新に失敗しました。" });
    } finally {
      setCoverLoading(false);
    }
  };

  // ── プロフィール ────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileFieldErrors({});
    setProfileLoading(true);
    try {
      await profileApi.update({ name, bio: bio || undefined });
      setProfileMsg({ type: "ok", text: "プロフィールを更新しました。" });
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors };
      if (e?.errors) setProfileFieldErrors(e.errors);
      else setProfileMsg({ type: "err", text: e?.message ?? "更新に失敗しました。" });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── パスワード ──────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      setPasswordMsg({ type: "err", text: "新しいパスワードが一致しません。" });
      return;
    }
    setPasswordMsg(null);
    setPasswordFieldErrors({});
    setPasswordLoading(true);
    try {
      await profileApi.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      });
      setPasswordMsg({ type: "ok", text: "パスワードを変更しました。" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors };
      if (e?.errors) setPasswordFieldErrors(e.errors);
      else setPasswordMsg({ type: "err", text: e?.message ?? "変更に失敗しました。" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) return <div style={styles.container}><p>読み込み中...</p></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>プロフィール設定</h1>

      {/* アイコン */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>アイコン</h2>
        {avatarMsg && <p style={avatarMsg.type === "ok" ? styles.ok : styles.err}>{avatarMsg.text}</p>}
        <div style={styles.avatarWrapper}>
          <img
            src={avatarPreview ?? "https://placehold.co/100x100?text=No+Image"}
            alt="アバター"
            style={styles.avatar}
          />
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarFileChange}
          style={styles.fileInput}
        />
        {avatarFieldErrors.avatar && <p style={styles.fieldError}>{avatarFieldErrors.avatar[0]}</p>}
      </section>

      <hr style={styles.hr} />

      {/* カバー画像 */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>カバー画像</h2>
        {coverMsg && <p style={coverMsg.type === "ok" ? styles.ok : styles.err}>{coverMsg.text}</p>}
        <div style={styles.coverWrapper}>
          {coverPreview ? (
            <img src={coverPreview} alt="カバー" style={styles.coverPreview} />
          ) : (
            <div style={styles.coverPlaceholder}>カバー画像未設定</div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverFileChange}
          style={styles.fileInput}
        />
        {coverFieldErrors.cover && <p style={styles.fieldError}>{coverFieldErrors.cover[0]}</p>}
      </section>

      <hr style={styles.hr} />

      {/* プロフィール */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>ニックネーム・自己紹介</h2>
        {profileMsg && <p style={profileMsg.type === "ok" ? styles.ok : styles.err}>{profileMsg.text}</p>}
        <form onSubmit={handleProfileSubmit} style={styles.form}>
          <label style={styles.label}>ニックネーム *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            style={{ ...styles.input, ...(profileFieldErrors.name ? styles.inputError : {}) }}
          />
          {profileFieldErrors.name && <p style={styles.fieldError}>{profileFieldErrors.name[0]}</p>}

          <label style={styles.label}>自己紹介</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            style={{ ...styles.input, resize: "vertical", ...(profileFieldErrors.bio ? styles.inputError : {}) }}
          />
          {profileFieldErrors.bio && <p style={styles.fieldError}>{profileFieldErrors.bio[0]}</p>}

          <button type="submit" disabled={profileLoading} style={styles.button}>
            {profileLoading ? "処理中..." : "変更を保存"}
          </button>
        </form>
      </section>

      <hr style={styles.hr} />

      {/* パスワード */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>パスワード変更</h2>
        {passwordMsg && <p style={passwordMsg.type === "ok" ? styles.ok : styles.err}>{passwordMsg.text}</p>}
        <form onSubmit={handlePasswordSubmit} style={styles.form}>
          <label style={styles.label}>現在のパスワード</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ ...styles.input, ...(passwordFieldErrors.current_password ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.current_password && <p style={styles.fieldError}>{passwordFieldErrors.current_password[0]}</p>}

          <label style={styles.label}>新しいパスワード（8文字以上）</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={{ ...styles.input, ...(passwordFieldErrors.password ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.password && <p style={styles.fieldError}>{passwordFieldErrors.password[0]}</p>}

          <label style={styles.label}>新しいパスワード（確認）</label>
          <input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
            style={{ ...styles.input, ...(passwordFieldErrors.password_confirmation ? styles.inputError : {}) }}
          />
          {passwordFieldErrors.password_confirmation && <p style={styles.fieldError}>{passwordFieldErrors.password_confirmation[0]}</p>}

          <button type="submit" disabled={passwordLoading} style={styles.button}>
            {passwordLoading ? "処理中..." : "パスワードを変更"}
          </button>
        </form>
      </section>

      {/* アバタートリミングモーダル */}
      {avatarCropSrc && (
        <div style={styles.modal}>
          <div style={styles.modalInner}>
            <p style={styles.modalTitle}>アイコンをトリミング（正方形）</p>
            <ReactCrop
              crop={avatarCrop}
              onChange={(c) => setAvatarCrop(c)}
              onComplete={(c) => { avatarPixelCropRef.current = c; }}
              aspect={1}
              circularCrop
            >
              <img
                ref={avatarImgRef}
                src={avatarCropSrc}
                alt="トリミング"
                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", display: "block" }}
                onLoad={(e) => {
                  const { width, height } = e.currentTarget;
                  const size = Math.min(width, height);
                  const x = (width - size) / 2;
                  const y = (height - size) / 2;
                  const crop = { unit: "px" as const, width: size, height: size, x, y };
                  setAvatarCrop(crop);
                  avatarPixelCropRef.current = crop;
                }}
              />
            </ReactCrop>
            <div style={styles.modalButtons}>
              <button 
  onClick={() => {
    handleCoverSave()
  }} 
  disabled={coverLoading} 
  style={styles.button}
>
                キャンセル
              </button>
              <button onClick={handleAvatarSave} disabled={avatarLoading} style={styles.button}>
                {avatarLoading ? "処理中..." : "この範囲で保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カバートリミングモーダル */}
      {coverCropSrc && (
        <div style={styles.modal}>
          <div style={styles.modalInner}>
            <p style={styles.modalTitle}>カバー画像をトリミング（3:1）</p>
            <ReactCrop
              crop={coverCrop}
              onChange={(c) => setCoverCrop(c)}
              onComplete={(c) => { coverPixelCropRef.current = c; }}
              aspect={3}
            >
              <img
                ref={coverImgRef}
                src={coverCropSrc}
                alt="トリミング"
                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", display: "block" }}
                onLoad={(e) => {
                  const { width, height } = e.currentTarget;
                  const cropHeight = Math.min(height, width / 3);
                  const cropWidth = cropHeight * 3;
                  const x = (width - cropWidth) / 2;
                  const y = (height - cropHeight) / 2;
                  const crop = { unit: "px" as const, width: cropWidth, height: cropHeight, x, y };
                  setCoverCrop(crop);
                  coverPixelCropRef.current = crop;
                }}
              />
            </ReactCrop>
            <div style={styles.modalButtons}>
              <button onClick={() => setCoverCropSrc(null)} style={styles.cancelButton}>
                キャンセル
              </button>
              <button onClick={handleCoverSave} disabled={coverLoading} style={styles.button}>
                {coverLoading ? "処理中..." : "この範囲で保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "600px", margin: "0 auto", padding: "24px 16px" },
  heading: { marginBottom: "24px" },
  section: { paddingBottom: "8px" },
  sectionTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontWeight: "bold", fontSize: "14px", marginTop: "8px" },
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px" },
  inputError: { borderColor: "#e53e3e" },
  button: { marginTop: "8px", padding: "10px 20px", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" },
  cancelButton: { marginTop: "8px", padding: "10px 20px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "14px" },
  avatarWrapper: { marginBottom: "8px" },
  avatar: { width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd", backgroundColor: "#f0f0f0" },
  coverWrapper: { marginBottom: "8px" },
  coverPreview: { width: "100%", aspectRatio: "3/1", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" },
  coverPlaceholder: { width: "100%", aspectRatio: "3/1", backgroundColor: "#f0f0f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "14px" },
  fileInput: { fontSize: "14px", marginBottom: "4px" },
  hr: { margin: "24px 0", border: "none", borderTop: "1px solid #eee" },
  ok: { color: "#38a169", fontSize: "14px", marginBottom: "8px" },
  err: { color: "#e53e3e", fontSize: "14px", marginBottom: "8px" },
  fieldError: { color: "#e53e3e", fontSize: "12px", margin: "2px 0 0" },
  modal: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalInner: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", width: "500px", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  modalTitle: { fontWeight: "bold", fontSize: "16px", margin: 0 },
  modalButtons: { display: "flex", gap: "12px", justifyContent: "flex-end" },
};