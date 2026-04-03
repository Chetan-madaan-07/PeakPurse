"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bot, Home, LogIn, LogOut, User, Users, 
  BarChart2, Bell, RefreshCw, TrendingUp, 
  FileText, Coffee, Menu, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useState, useEffect } from "react";
import axios from "axios";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/chat", label: "PeakBot", icon: Bot },
  { href: "/investment", label: "Invest", icon: TrendingUp },
  { href: "/retirement", label: "Retire", icon: Coffee },
  { href: "/tax", label: "Tax", icon: FileText },
  { href: "/ca-directory", label: "CA Finder", icon: Users },
  { href: "/benchmarking", label: "Benchmarking", icon: BarChart2 },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
];

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios.get("/api/subscriptions/notifications", { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => setNotifications(res.data))
      .catch(() => {});
  }, [token]);

  const handleLogout = () => { 
    logout(); 
    router.push("/login"); 
  };

  const markRead = async (id: string) => {
    await axios.post(`/api/subscriptions/notifications/${id}/read`, {}, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group" onClick={() => setMobileMenuOpen(false)}>
          <div className="size-7 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md group-hover:scale-110 transition-transform" />
          <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
            PeakPurse
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Global Utilities */}
        <div className="flex items-center gap-2 ml-auto">
          {user && (
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(p => !p)}
                className="relative p-2 rounded-full text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-[calc(100vw-2rem)] max-w-xs bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center italic">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-slate-800 flex items-start justify-between gap-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{n.message}</p>
                          <button onClick={() => markRead(n.id)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase flex-shrink-0">Dismiss</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <ThemeSwitcher />

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100/50 dark:border-indigo-500/10">
                  <User size={12} />
                  {user.name || user.email.split("@")[0]}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
              >
                <LogIn size={14} />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <User size={14} className="text-indigo-500" />
                  {user.name || user.email.split("@")[0]}
                </span>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <LogOut size={13} /> Log out
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
                <LogIn size={15} /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}