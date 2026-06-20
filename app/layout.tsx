import type { Metadata } from 'next'
import { Baloo_2, Mulish } from 'next/font/google'
import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700'],
})

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Drishti',
  description: 'Build and teach yoga class sequences',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${baloo2.variable} ${mulish.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}