// ── ユーザー ──────────────────────────────────────
export type User = {
  id: number
  ulid: string
  name: string
  email: string
  avatar_path: string | null
  cover_path: string | null
  bio: string | null
  is_banned: boolean
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// ── 作品 ──────────────────────────────────────────
export type Product = {
  id: number
  ulid: string
  user_id: number
  title: string
  content_type: 'illust' | 'photo' | 'video'
  age_rating: 'all' | 'r18'
  tags: string[] | null
  watermark_path: string
  original_path?: string
  price: number
  prompt?: string
  tool_name: string | null
  tool_params?: Record<string, unknown> | null
  view_count: number
  like_count: number
  purchase_count: number
  created_at: string
  has_purchased?: boolean
  user: Pick<User, 'id' | 'ulid' | 'name' | 'avatar_path'>
  is_prompt_public: boolean | 0 | 1
}

// ── 注文 ──────────────────────────────────────────
export type Order = {
  id: number
  ulid: string
  user_id: number
  product_id: number
  amount: number
  platform_fee: number
  creator_revenue: number
  amazon_order_reference_id: string
  amazon_charge_id: string | null
  status: 'pending' | 'completed' | 'refunded' | 'failed'
  purchased_at: string | null
  created_at: string
  product?: Pick<Product, 'id' | 'ulid' | 'title' | 'watermark_path' | 'price'>
}

// ── ランキング ────────────────────────────────────
export type Ranking = {
  id: number
  period: 'daily' | 'weekly' | 'monthly'
  axis: 'sales' | 'views' | 'likes'
  age_rating: 'all' | 'r18'
  rank: number
  product_id: number
  score: number
  snapshotted_at: string
  product: Pick<Product, 'id' | 'ulid' | 'title' | 'watermark_path' | 'price' | 'user_id' | 'content_type' | 'age_rating'>
}

// ── ページネーション ──────────────────────────────
export type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

// ── 認証 ─────────────────────────────────────────
export type AuthResponse = {
  user: User
  token: string
}

// ── レビュー ──────────────────────────────────────
export type Review = {
  id: number
  ulid: string
  product_id: number
  user_id: number
  rating: number
  body: string | null
  created_at: string
  user: Pick<User, 'id' | 'ulid' | 'name' | 'avatar_path'>
}