import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeSwitcher from '@/components/ThemeSwitcher';

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Change defaultTheme from "system" to "dark" */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="absolute top-4 right-4 z-50">
            <ThemeSwitcher />
          </div>
          
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}