const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api'

// ── トークン管理 ──────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function removeToken(): void {
  localStorage.removeItem('token')
}

// ── fetch ラッパー ────────────────────────────────
type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
  body?: unknown
  auth?: boolean  // true のとき Bearer トークンを付与
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = false } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw { status: res.status, ...error }
  }

  return res.json() as Promise<T>
}

export async function apiFetchMultipart<T>(path: string, data: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: data,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw { status: res.status, ...error }
  }

  return res.json() as Promise<T>
}

// ── 認証 ─────────────────────────────────────────
import type { AuthResponse, User} from '@/types'

export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST', auth: true }),

  me: () =>
    apiFetch<User>('/auth/me', { auth: true }),
}

// ── 作品 ─────────────────────────────────────────
import type { Product, Paginated } from '@/types'

export const productApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<Paginated<Product>>(`/products${query}`)
  },

  show: (ulid: string, auth = false) =>
    apiFetch<Product>(`/products/${ulid}`, { auth }),

  store: (data: FormData) =>
    apiFetchMultipart<Product>('/products', data),

  myList: () =>
    apiFetch<Paginated<Product>>('/my/products', { auth: true }),

  destroy: (ulid: string) =>
    apiFetch<{ message: string }>(`/products/${ulid}`, { method: 'DELETE', auth: true }),
}

// ── 注文 ─────────────────────────────────────────
import type { Order } from '@/types'

export const orderApi = {
  store: (product_ulid: string) =>
    apiFetch<{ order: Order }>('/orders', { method: 'POST', body: { product_ulid }, auth: true }),

  myList: () =>
    apiFetch<Paginated<Order>>('/my/orders', { auth: true }),

  devComplete: (ulid: string) =>
    apiFetch<{ message: string; order: Order }>(`/dev/orders/${ulid}/complete`, { method: 'POST', auth: true }),
}

// ── いいね ────────────────────────────────────────
export const likeApi = {
  store: (ulid: string) =>
    apiFetch<{ like_count: number }>(`/products/${ulid}/like`, { method: 'POST', auth: true }),

  destroy: (ulid: string) =>
    apiFetch<{ like_count: number }>(`/products/${ulid}/like`, { method: 'DELETE', auth: true }),
}

// ── ランキング ────────────────────────────────────
import type { Ranking } from '@/types'

export const rankingApi = {
  index: (params: { period: string; axis: string; age_rating?: string }) => {
    const query = '?' + new URLSearchParams(params).toString()
    return apiFetch<{ data: Ranking[]; snapshotted_at: string }>(`/rankings${query}`)
  },
}

// ── 管理者 ────────────────────────────────────────
export const adminApi = {
  list: (status = 'pending') =>
    apiFetch<Paginated<Product>>(`/admin/products?status=${status}`, { auth: true }),

  approve: (ulid: string) =>
    apiFetch<{ message: string }>(`/admin/products/${ulid}/approve`, { method: 'POST', auth: true }),

  reject: (ulid: string, reason: string) =>
    apiFetch<{ message: string }>(`/admin/products/${ulid}/reject`, { method: 'POST', body: { reason }, auth: true }),

  hide: (ulid: string, reason?: string) =>
    apiFetch<{ message: string }>(`/admin/products/${ulid}/hide`, { method: 'POST', body: { reason }, auth: true }),

  restore: (ulid: string) =>
    apiFetch<{ message: string }>(`/admin/products/${ulid}/restore`, { method: 'POST', auth: true }),
}

export function storageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://127.0.0.1:8000'
  return `${base}/storage/${path}`
}

// ── プロフィール ──────────────────────────────────
export const profileApi = {
  show: () =>
    apiFetch<User>('/profile', { auth: true }),

  update: (data: { name: string; bio?: string }) =>
    apiFetch<User>('/profile', { method: 'POST', body: data, auth: true }),

  updateAvatar: (data: FormData) =>
    apiFetchMultipart<{ avatar_path: string }>('/profile/avatar', data),

  updatePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    apiFetch<{ message: string }>('/profile/password', { method: 'POST', body: data, auth: true }),
}

import type { Review } from '@/types'
// ── ユーザー ─────────────────────────────────────
export const userApi = {
  show: (ulid: string) =>
    apiFetch<{
      id: number
      ulid: string
      name: string
      bio: string | null
      avatar_path: string | null
      followers_count: number
      following_count: number
      products_count: number
      is_following: boolean
      created_at: string
    }>(`/users/${ulid}`),

  products: (ulid: string, page = 1) =>
    apiFetch<Paginated<Product>>(`/users/${ulid}/products?page=${page}`),

    following: (ulid: string, page = 1) =>
    apiFetch<Paginated<{ id: number; ulid: string; name: string; avatar_path: string | null; bio: string | null }>>(`/users/${ulid}/following?page=${page}`),

    followers: (ulid: string, page = 1) =>
    apiFetch<Paginated<{ id: number; ulid: string; name: string; avatar_path: string | null; bio: string | null }>>(`/users/${ulid}/followers?page=${page}`),

    reviews: (ulid: string, page = 1) =>
    apiFetch<{ reviews: Paginated<Review>; avg_rating: number | null; count: number }>(`/products/${ulid}/reviews?page=${page}`),

}

// ── フォロー ──────────────────────────────────────
export const followApi = {
  store: (ulid: string) =>
    apiFetch<{ following: boolean; followers_count: number }>(`/users/${ulid}/follow`, { method: 'POST', auth: true }),

  destroy: (ulid: string) =>
    apiFetch<{ following: boolean; followers_count: number }>(`/users/${ulid}/follow`, { method: 'DELETE', auth: true }),
}

// ── レビュー ──────────────────────────────────────
export const reviewApi = {
  store: (ulid: string, data: { rating: number; body?: string }) =>
    apiFetch<Review>(`/products/${ulid}/reviews`, { method: 'POST', body: data, auth: true }),
}