import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'PeakPurse AI',
  description: 'Intelligent Personal Finance Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
