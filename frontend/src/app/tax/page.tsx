"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, TrendingDown, Lightbulb, CheckCircle } from "lucide-react";

interface TaxComparison {
  profile: any;
  tax_old_regime: number;
  tax_new_regime: number;
  recommended_regime: string;
  potential_saving: number;
  deduction_opportunities: { section: string; message: string }[];
  disclaimer: string;
}

const FY_OPTIONS = ["2025-26", "2024-25", "2023-24"];

export default function TaxPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [fy, setFy] = useState("2025-26");
  const [form, setForm] = useState({ gross_income: "", deduction_80c: "", deduction_80d: "", deduction_80ccd: "" });
  const [comparison, setComparison] = useState<TaxComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push("/login"); return; }
    // Load existing profile
    axios.get(`/api/tax/profile?fy=${fy}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const p = r.data;
        setForm({ gross_income: p.gross_income || "", deduction_80c: p.deduction_80c || "", deduction_80d: p.deduction_80d || "", deduction_80ccd: p.deduction_80ccd || "" });
      }).catch(() => {});
  }, [token, authLoading, fy]);

  const handleCompute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await axios.post("/api/tax/profile", { fy, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v as string) || 0])) }, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`/api/tax/comparison?fy=${fy}`, { headers: { Authorization: `Bearer ${token}` } });
      setComparison(res.data);
    } catch { setError("Failed to compute tax. Please try again."); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Tax Assistant</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Old vs New regime comparison with deduction discovery</p>
        </div>

        {/* FY selector */}
        <div className="flex justify-center gap-2 mb-6">
          {FY_OPTIONS.map(f => (
            <button key={f} onClick={() => { setFy(f); setComparison(null); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${fy === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-900 text-gray-500 border-gray-200 dark:border-slate-700 hover:border-indigo-400"}`}>
              FY {f}
            </button>
          ))}
        </div>

        {/* Input form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2"><FileText size={16} className="text-indigo-500" /> Income & Deductions</h2>
          <form onSubmit={handleCompute} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "gross_income", label: "Gross Annual Income (₹)", placeholder: "e.g. 1200000" },
                { key: "deduction_80c", label: "80C Investments (₹)", placeholder: "Max ₹1,50,000 (ELSS/PPF/LIC)" },
                { key: "deduction_80d", label: "80D Health Insurance (₹)", placeholder: "Max ₹25,000" },
                { key: "deduction_80ccd", label: "80CCD NPS (₹)", placeholder: "Max ₹50,000 extra" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
                  <input type="number" placeholder={placeholder} value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    min="0" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !form.gross_income}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60">
              {loading ? "Computing..." : "Compare Regimes →"}
            </button>
          </form>
        </div>

        {/* Results */}
        {comparison && (
          <div className="space-y-5">
            {/* Regime comparison */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Old Regime", tax: comparison.tax_old_regime, recommended: comparison.recommended_regime === 'old' },
                { label: "New Regime", tax: comparison.tax_new_regime, recommended: comparison.recommended_regime === 'new' },
              ].map(({ label, tax, recommended }) => (
                <div key={label} className={`rounded-2xl border p-5 text-center transition-all ${recommended ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className={`text-2xl font-extrabold mt-1 ${recommended ? "text-indigo-600" : "text-gray-700 dark:text-gray-200"}`}>{fmt(tax)}</p>
                  {recommended && <p className="text-xs text-indigo-500 font-bold mt-1 flex items-center justify-center gap-1"><CheckCircle size={11} /> Recommended</p>}
                </div>
              ))}
            </div>

            {/* Saving banner */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
              <TrendingDown size={20} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                You save <strong>{fmt(comparison.potential_saving)}</strong> by choosing the <strong className="capitalize">{comparison.recommended_regime} regime</strong>.
              </p>
            </div>

            {/* Deduction opportunities */}
            {comparison.deduction_opportunities.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Lightbulb size={14} className="text-amber-500" /> Deduction Opportunities</p>
                <div className="space-y-3">
                  {comparison.deduction_opportunities.map(({ section, message }) => (
                    <div key={section} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full flex-shrink-0">{section}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">{comparison.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
