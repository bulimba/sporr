import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sporr — Proof of delivery for every club',
  description: 'The proof-of-delivery infrastructure for sport and community investment.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
