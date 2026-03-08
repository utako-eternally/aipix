import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { R18Provider } from '@/context/R18Context'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'AIPIX',
  description: 'AI画像販売プラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <R18Provider>
            <Navbar />
            {children}
          </R18Provider>
        </AuthProvider>
      </body>
    </html>
  )
}