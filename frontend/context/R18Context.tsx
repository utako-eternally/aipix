'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const R18_MODE_KEY     = 'aipix_r18_mode'
const R18_VERIFIED_KEY = 'aipix_r18_verified'

type R18ContextType = {
  isR18Mode: boolean
  isVerified: boolean
  enableR18: () => void   // 年齢確認済みでR18モードON
  disableR18: () => void  // 一般モードに戻す
  verify: () => void      // 年齢確認完了
}

const R18Context = createContext<R18ContextType | null>(null)

export function R18Provider({ children }: { children: React.ReactNode }) {
  const [isR18Mode, setIsR18Mode] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const mode     = localStorage.getItem(R18_MODE_KEY) === 'true'
    const verified = localStorage.getItem(R18_VERIFIED_KEY) === 'true'
    setIsR18Mode(mode)
    setIsVerified(verified)
  }, [])

  const verify = () => {
    localStorage.setItem(R18_VERIFIED_KEY, 'true')
    setIsVerified(true)
  }

  const enableR18 = () => {
    localStorage.setItem(R18_MODE_KEY, 'true')
    setIsR18Mode(true)
  }

  const disableR18 = () => {
    localStorage.setItem(R18_MODE_KEY, 'false')
    setIsR18Mode(false)
  }

  return (
    <R18Context.Provider value={{ isR18Mode, isVerified, enableR18, disableR18, verify }}>
      {children}
    </R18Context.Provider>
  )
}

export function useR18() {
  const ctx = useContext(R18Context)
  if (!ctx) throw new Error('useR18 must be used within R18Provider')
  return ctx
}