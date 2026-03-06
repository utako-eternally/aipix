"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { productApi } from "@/lib/api";

type FieldErrors = Record<string, string[]>;

const AI_TOOLS = [
  { value: "", label: "Select AI Tool" },
  { value: "chatgpt-image", label: "ChatGPT Image" },
  { value: "flux", label: "FLUX" },
  { value: "gemini-image", label: "Gemini Image" },
  { value: "grok-image", label: "Grok Image" },
  { value: "hunyuan", label: "Hunyuan" },
  { value: "ideogram", label: "Ideogram" },
  { value: "imagen", label: "Imagen" },
  { value: "leonardo", label: "Leonardo Ai" },
  { value: "midjourney", label: "Midjourney" },
  { value: "qwen-image", label: "Qwen Image" },
  { value: "recraft", label: "Recraft" },
  { value: "seedream", label: "Seedream" },
  { value: "stable-diffusion", label: "Stable Diffusion" },
  { value: "other", label: "その他" },
];

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<"illust" | "photo" | "video">(
    "illust",
  );
  const [ageRating, setAgeRating] = useState<"all" | "r18">("all");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [prompt, setPrompt] = useState("");
  const [toolName, setToolName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!image) {
      setError("画像を選択してください。");
      return;
    }

    setLoading(true);

    try {
      const tagsArray = tags
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content_type", contentType);
      formData.append("age_rating", ageRating);
      formData.append("price", price);
      formData.append("image", image);
      formData.append('is_prompt_public', isPromptPublic ? '1' : '0')
      if (prompt) formData.append("prompt", prompt);
      if (toolName) formData.append("tool_name", toolName);
      tagsArray.forEach((tag) => formData.append("tags[]", tag));

      await productApi.store(formData);
      router.push("/my/products");
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: FieldErrors };
      if (e?.errors) {
        setFieldErrors(e.errors);
      } else {
        setError(e?.message ?? "投稿に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    ...styles.input,
    ...(fieldErrors[field] ? styles.inputError : {}),
  });

  const [isPromptPublic, setIsPromptPublic] = useState(false);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>作品を投稿する</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          画像 * （JPEG / PNG / WebP、10MB以内）
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          required
          style={styles.input}
        />
        {fieldErrors.image && (
          <p style={styles.fieldError}>{fieldErrors.image[0]}</p>
        )}
        {preview && (
          <img src={preview} alt="プレビュー" style={styles.preview} />
        )}

        <label style={styles.label}>タイトル *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          style={inputStyle("title")}
        />
        {fieldErrors.title && (
          <p style={styles.fieldError}>{fieldErrors.title[0]}</p>
        )}

        <label style={styles.label}>種類 *</label>
        <select
          value={contentType}
          onChange={(e) =>
            setContentType(e.target.value as "illust" | "photo" | "video")
          }
          style={inputStyle("content_type")}
        >
          <option value="illust">イラスト</option>
          <option value="photo">フォト</option>
          <option value="video">動画</option>
        </select>
        {fieldErrors.content_type && (
          <p style={styles.fieldError}>{fieldErrors.content_type[0]}</p>
        )}

        <label style={styles.label}>年齢レーティング *</label>
        <select
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value as "all" | "r18")}
          style={inputStyle("age_rating")}
        >
          <option value="all">全年齢</option>
          <option value="r18">R18</option>
        </select>
        {fieldErrors.age_rating && (
          <p style={styles.fieldError}>{fieldErrors.age_rating[0]}</p>
        )}

        <label style={styles.label}>タグ（スペースまたはカンマ区切り）</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="#イラスト #Midjourney"
          style={inputStyle("tags")}
        />
        {fieldErrors.tags && (
          <p style={styles.fieldError}>{fieldErrors.tags[0]}</p>
        )}

        <label style={styles.label}>価格（円）* 0〜1000（0円は無料公開）</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min={0}
          max={1000}
          style={inputStyle("price")}
        />
        {fieldErrors.price && (
          <p style={styles.fieldError}>{fieldErrors.price[0]}</p>
        )}

        <label style={styles.label}>使用AIツール</label>
        <select
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          style={inputStyle("tool_name")}
        >
          {AI_TOOLS.map((tool) => (
            <option
              key={tool.value}
              value={tool.value}
              disabled={tool.value === ""}
            >
              {tool.label}
            </option>
          ))}
        </select>
        {fieldErrors.tool_name && (
          <p style={styles.fieldError}>{fieldErrors.tool_name[0]}</p>
        )}

        <label style={styles.label}>プロンプト</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ ...inputStyle("prompt"), resize: "vertical" }}
        />
        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isPromptPublic}
            onChange={(e) => setIsPromptPublic(e.target.checked)}
          />
          <span style={{ fontSize: "14px" }}>プロンプトを公開する</span>
        </label>
        {fieldErrors.prompt && (
          <p style={styles.fieldError}>{fieldErrors.prompt[0]}</p>
        )}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "処理中..." : "投稿する（審査待ちになります）"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "600px", margin: "0 auto", padding: "24px 16px" },
  heading: { marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontWeight: "bold", fontSize: "14px", marginTop: "8px" },
  input: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  inputError: { borderColor: "#e53e3e" },
  preview: {
    width: "200px",
    height: "200px",
    objectFit: "cover",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  button: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', cursor: 'pointer' },
  error: { color: "#e53e3e", marginBottom: "12px" },
  fieldError: { color: "#e53e3e", fontSize: "12px", margin: "2px 0 0" },
};
