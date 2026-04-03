"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Trash2, IndianRupee, Bell, RefreshCw, CalendarX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  id: string;
  merchant_name: string;
  amount: number;
  billing_cycle: string;
  start_date: string;
  end_date: string | null;
  next_renewal: string;
}

const BILLING_CYCLES = [
  { value: "weekly",    label: "Weekly" },
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly" },
];

const CYCLE_LABEL: Record<string, string> = {
  weekly: "/ week", monthly: "/ month", quarterly: "/ quarter", yearly: "/ year",
};

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
}

function RenewalBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days <= 1) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Due Tomorrow</span>;
  if (days <= 7) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Due in {days}d</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400">{new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>;
}

const emptyForm = { merchant_name: "", amount: "", billing_cycle: "monthly", start_date: "", end_date: "" };

export default function SubscriptionsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    axios.get("/api/subscriptions", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSubscriptions(res.data))
      .catch(() => setError("Failed to load subscriptions."))
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload: any = {
        merchant_name: formData.merchant_name,
        amount: parseFloat(formData.amount),
        billing_cycle: formData.billing_cycle,
        start_date: formData.start_date,
      };
      if (formData.end_date) payload.end_date = formData.end_date;
      const res = await axios.post("/api/subscriptions", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(prev => [...prev, res.data]);
      setFormData(emptyForm);
    } catch {
      setError("Failed to add subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/subscriptions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const totalByMonth = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount);
    switch (s.billing_cycle) {
      case 'weekly':    return sum + amt * 4.33;
      case 'quarterly': return sum + amt / 3;
      case 'yearly':    return sum + amt / 12;
      default:          return sum + amt;
    }
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">
            Subscription Tracker
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Track and manage your recurring payments</p>
        </div>

        {subscriptions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{subscriptions.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Est. Monthly</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-1">₹{Math.round(totalByMonth).toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* Add Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Plus size={16} className="text-indigo-500" /> Add Subscription
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">

            {/* Name + Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Service Name</label>
                <input type="text" placeholder="e.g. Netflix, Spotify"
                  value={formData.merchant_name}
                  onChange={e => setFormData(p => ({ ...p, merchant_name: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Amount (₹)</label>
                <input type="number" placeholder="e.g. 199"
                  value={formData.amount}
                  onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                  required min="0" step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Billing Cycle</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BILLING_CYCLES.map(c => (
                  <button key={c.value} type="button"
                    onClick={() => setFormData(p => ({ ...p, billing_cycle: c.value }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all
                      ${formData.billing_cycle === c.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900"
                        : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"
                      }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start + End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input type="date"
                  value={formData.start_date}
                  onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  End Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                  min={formData.start_date || undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank if ongoing</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              <Plus size={15} />
              {submitting ? "Adding..." : "Add Subscription"}
            </button>
          </form>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No subscriptions yet</p>
            <p className="text-sm mt-1">Add your first subscription above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{sub.merchant_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{sub.merchant_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <IndianRupee size={10} />
                        <span className="font-semibold">{Number(sub.amount).toLocaleString('en-IN')}</span>
                        <span>{CYCLE_LABEL[sub.billing_cycle] || ''}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(sub.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400 capitalize">{sub.billing_cycle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.end_date && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarX size={11} />
                        Ends {new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    )}
                    <RenewalBadge dateStr={sub.next_renewal} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
