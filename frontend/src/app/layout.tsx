import './globals.css';

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
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}