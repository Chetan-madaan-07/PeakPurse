"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  pseudo_name: string;
  health_score: number;
  saving_rate: string;
  city_tier: string;
}

interface BenchmarkData {
  userProfile: { score: number; percentileText: string };
  leaderboard: LeaderboardEntry[];
}

function ScoreColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export default function BenchmarkingPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return; // wait for auth to restore from localStorage
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    axios.get("/api/benchmark/mock-summary", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setData(res.data))
      .catch(() => setError("Unable to load benchmarking data at this time."))
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
            Social Benchmarking
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">See how your finances compare with peers</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {error && <div className="text-center py-20 text-red-500 font-semibold">{error}</div>}

        {data && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 text-center">
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Your Financial Health Score</p>
              <div className={`text-7xl font-extrabold ${ScoreColor(data.userProfile.score)}`}>
                {data.userProfile.score}
              </div>
              <div className="mt-2 text-sm text-gray-400">out of 100</div>
              <div className="mt-5 flex items-start justify-center gap-2 max-w-lg mx-auto">
                <Trophy size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed text-left">
                  {data.userProfile.percentileText}
                </p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <Medal size={18} className="text-indigo-500" />
                <h2 className="font-bold text-gray-800 dark:text-gray-100">Top Savers in Your Bracket</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold">Rank</th>
                      <th className="px-6 py-3 text-left font-semibold">Alias</th>
                      <th className="px-6 py-3 text-left font-semibold">Health Score</th>
                      <th className="px-6 py-3 text-left font-semibold">Savings Rate</th>
                      <th className="px-6 py-3 text-left font-semibold">City Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {data.leaderboard.map((entry, index) => (
                      <tr key={entry.pseudo_name} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`font-bold ${index < 3 ? "text-amber-500" : "text-gray-400"}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">{entry.pseudo_name}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${ScoreColor(entry.health_score)}`}>{entry.health_score}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{entry.saving_rate}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            {entry.city_tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 dark:text-gray-600">
              All peer data is anonymized. No personal information is shared.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
