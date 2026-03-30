export const metadata = {
  title: 'PeakPurse AI',
  description: 'Intelligent Statement Parsing',
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