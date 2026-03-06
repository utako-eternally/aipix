'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/types'
import { getMe, login, logout, register } from '@/lib/auth'

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const u = await login(email, password)
    setUser(u)
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  const handleRegister = async (name: string, email: string, password: string) => {
    const u = await register(name, email, password)
    setUser(u)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}