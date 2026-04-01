"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Home, LogIn, LogOut, User, Users, BarChart2, Bell, RefreshCw, TrendingUp, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useState, useEffect } from "react";
import axios from "axios";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/chat", label: "PeakBot", icon: Bot },
  { href: "/investment", label: "Invest", icon: TrendingUp },
  { href: "/tax", label: "Tax", icon: FileText },
  { href: "/ca-directory", label: "CA Finder", icon: Users },
  { href: "/benchmarking", label: "Benchmarking", icon: BarChart2 },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios.get("/api/subscriptions/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNotifications(res.data))
      .catch(() => {});
  }, [token]);

  const handleLogout = () => { logout(); router.push("/login"); };

  const markRead = async (id: string) => {
    await axios.post(`/api/subscriptions/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 flex-shrink-0">
          PeakPurse
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
                  ${isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
                    : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800"
                  }`}>
                <Icon size={13} />{label}
              </Link>
            );
          })}
        </div>

        {/* Auth + Bell */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <div className="relative">
              <button onClick={() => setShowNotifs(p => !p)}
                className="relative p-2 rounded-full text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all">
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notifications</p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-400 text-center">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-slate-800 flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{n.message}</p>
                        <button onClick={() => markRead(n.id)} className="text-xs text-indigo-500 hover:underline flex-shrink-0">Dismiss</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <ThemeSwitcher />

          {user ? (
            <>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <User size={12} />{user.name || user.email.split("@")[0]}
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <LogOut size={12} />Logout
              </button>
            </>
          ) : (
            <Link href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
              <LogIn size={13} />Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
