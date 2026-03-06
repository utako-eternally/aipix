'use client'

import { getToken, removeToken, authApi, setToken } from '@/lib/api'
import type { User } from '@/types'

// ── ログイン状態確認 ──────────────────────────────
export async function getMe(): Promise<User | null> {
  const token = getToken()
  if (!token) return null
  try {
    return await authApi.me()
  } catch {
    removeToken()
    return null
  }
}

// ── ログアウト ────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } finally {
    removeToken()
  }
}

// ── ログイン ──────────────────────────────────────
export async function login(email: string, password: string): Promise<User> {
  const res = await authApi.login({ email, password })
  setToken(res.token)
  return res.user
}

// ── 登録 ─────────────────────────────────────────
export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const res = await authApi.register({
    name,
    email,
    password,
    password_confirmation: password,
  })
  setToken(res.token)
  return res.user
}