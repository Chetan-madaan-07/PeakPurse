"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Brain, TrendingUp, AlertTriangle, CheckCircle, ChevronRight, IndianRupee, RotateCcw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Goal { id: string; name: string; target_amount: number; current_amount: number; target_date: string; feasibility?: string; }
interface PlanData { plan_id: string; goal_name: string; risk_profile: string; feasibility: string; asset_mix: Record<string, number>; return_scenarios: Record<string, number>; monthly_sip: number; tax_benefit_80c: number; budget_conflict: boolean; alternatives: any; disclaimer: string; }

const RISK_QUESTIONS = [
  { q: "What is your primary investment goal?", options: ["Preserve capital (1)", "Steady income (2)", "Balanced growth (3)", "Maximum growth (4)"] },
  { q: "How long can you stay invested?", options: ["Less than 1 year (1)", "1–3 years (2)", "3–7 years (3)", "7+ years (4)"] },
  { q: "How would you react to a 20% portfolio drop?", options: ["Sell everything (1)", "Sell some (2)", "Hold (3)", "Buy more (4)"] },
  { q: "What is your monthly income range?", options: ["Below ₹30K (1)", "₹30K–₹75K (2)", "₹75K–₹1.5L (3)", "Above ₹1.5L (4)"] },
  { q: "What % of income can you invest monthly?", options: ["Less than 5% (1)", "5–10% (2)", "10–20% (3)", "More than 20% (4)"] },
  { q: "Do you have 6 months emergency fund?", options: ["No (1)", "Partially (2)", "Yes (3)", "Yes + more (4)"] },
  { q: "Your investment experience?", options: ["None (1)", "FDs/RDs only (2)", "Mutual funds (3)", "Stocks/ETFs (4)"] },
  { q: "How important is tax saving to you?", options: ["Not important (1)", "Somewhat (2)", "Important (3)", "Very important (4)"] },
];

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#F43F5E"];
const FEASIBILITY_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  achievable:  { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", icon: CheckCircle, label: "Achievable ✓" },
  stretched:   { color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",       icon: AlertTriangle, label: "Stretched ⚡" },
  unrealistic: { color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",               icon: AlertTriangle, label: "Unrealistic ✗" },
};

export default function InvestmentPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=goal, 2=risk, 3=plan
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(8).fill(0));
  const [riskProfile, setRiskProfile] = useState<string>("");
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [manualSurplus, setManualSurplus] = useState<string>("");
  const [needsManualInput, setNeedsManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goalForm, setGoalForm] = useState({ name: "", target_amount: "", current_amount: "", target_date: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push("/login"); return; }
    axios.get("/api/investments/goals", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setGoals(r.data)).catch(() => {});
  }, [token, authLoading]);

  const headers = { Authorization: `Bearer ${token}` };

  // Step 1: Create goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post("/api/investments/goals", {
        name: goalForm.name,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount || "0"),
        target_date: goalForm.target_date,
      }, { headers });
      setGoals(p => [res.data, ...p]);
      setSelectedGoal(res.data);
      setGoalForm({ name: "", target_amount: "", current_amount: "", target_date: "" });
      setStep(2);
    } catch { setError("Failed to create goal."); }
    finally { setLoading(false); }
  };

  // Step 2: Submit risk quiz
  const handleRiskSubmit = async () => {
    if (answers.some(a => a === 0)) { setError("Please answer all 8 questions."); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post("/api/investments/risk-profile", { answers }, { headers });
      setRiskProfile(res.data.data.risk_profile);
      setStep(3);
      await generatePlan();
    } catch { setError("Failed to submit quiz."); }
    finally { setLoading(false); }
  };

  // Step 3: Generate plan
  const generatePlan = async (surplus?: number) => {
    if (!selectedGoal) return;
    setLoading(true); setError(""); setNeedsManualInput(false);
    try {
      const body: any = { goalId: selectedGoal.id };
      if (surplus !== undefined) body.manualSurplus = surplus;
      const res = await axios.post("/api/investments/generate-plan", body, { headers });
      const data = res.data.data;
      if (data.requires_manual_input) {
        setNeedsManualInput(true);
        setPlan(null);
      } else {
        setPlan(data);
      }
    } catch { setError("Failed to generate plan."); }
    finally { setLoading(false); }
  };

  const handleManualSurplus = () => {
    const val = parseFloat(manualSurplus);
    if (!val || val <= 0) { setError("Please enter a valid monthly savings amount."); return; }
    generatePlan(val);
  };

  const reset = () => { setStep(1); setSelectedGoal(null); setPlan(null); setRiskProfile(""); setAnswers(Array(8).fill(0)); setNeedsManualInput(false); setManualSurplus(""); setError(""); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">Investment Planner</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Goal-based investment planning with risk profiling</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
          {[{ n: 1, label: "Goal", icon: Target }, { n: 2, label: "Risk Profile", icon: Brain }, { n: 3, label: "Your Plan", icon: TrendingUp }].map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step >= n ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-400"}`}>
                <Icon size={12} /><span className="hidden xs:inline">{label}</span>
              </div>
              {n < 3 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />}
            </div>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">{error}</p>}

        {/* ── Step 1: Goal ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Existing goals */}
            {goals.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">Your Goals — click to select</p>
                <div className="space-y-2">
                  {goals.map(g => (
                    <button key={g.id} onClick={() => { setSelectedGoal(g); setStep(2); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all text-left">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{g.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">₹{Number(g.target_amount).toLocaleString('en-IN')} by {new Date(g.target_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                      </div>
                      {g.feasibility && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${FEASIBILITY_CONFIG[g.feasibility]?.color || ''}`}>{g.feasibility}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* New goal form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2"><Target size={16} className="text-indigo-500" /> Create New Goal</h2>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Goal Name</label>
                    <input type="text" placeholder="e.g. New Car, House Down Payment" value={goalForm.name} onChange={e => setGoalForm(p => ({ ...p, name: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Target Amount (₹)</label>
                    <input type="number" placeholder="e.g. 2000000" value={goalForm.target_amount} onChange={e => setGoalForm(p => ({ ...p, target_amount: e.target.value }))} required min="1" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Already Saved (₹)</label>
                    <input type="number" placeholder="0" value={goalForm.current_amount} onChange={e => setGoalForm(p => ({ ...p, current_amount: e.target.value }))} min="0" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Target Date</label>
                    <input type="date" value={goalForm.target_date} onChange={e => setGoalForm(p => ({ ...p, target_date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60">
                  {loading ? "Creating..." : "Create Goal & Continue →"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Step 2: Risk Profiler ── */}
        {step === 2 && selectedGoal && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Brain size={16} className="text-indigo-500" /> Risk Profile Quiz</h2>
              <span className="text-xs text-gray-400">Goal: {selectedGoal.name}</span>
            </div>
            <div className="space-y-6">
              {RISK_QUESTIONS.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{qi + 1}. {q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      const val = oi + 1;
                      const selected = answers[qi] === val;
                      return (
                        <button key={oi} type="button" onClick={() => { const a = [...answers]; a[qi] = val; setAnswers(a); }}
                          className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${selected ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400"}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">← Back</button>
              <button onClick={handleRiskSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60">
                {loading ? "Analyzing..." : "Get My Investment Plan →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Zero transaction fallback ── */}
        {step === 3 && needsManualInput && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">No Transaction History Found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We couldn't calculate your monthly surplus automatically. Please enter your estimated monthly savings so we can check if your goal is feasible.</p>
              </div>
            </div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Estimated Monthly Savings (₹)</label>
            <div className="flex gap-3">
              <input type="number" placeholder="e.g. 15000" value={manualSurplus} onChange={e => setManualSurplus(e.target.value)} min="1"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleManualSurplus} disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm disabled:opacity-60">
                {loading ? "..." : "Calculate"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Plan Dashboard ── */}
        {step === 3 && plan && (
          <div className="space-y-5">
            {/* Feasibility badge */}
            {(() => {
              const cfg = FEASIBILITY_CONFIG[plan.feasibility] || FEASIBILITY_CONFIG.unrealistic;
              const Icon = cfg.icon;
              return (
                <div className={`rounded-2xl border p-5 flex items-center gap-4 ${cfg.bg}`}>
                  <Icon size={28} className={cfg.color} />
                  <div>
                    <p className={`text-xl font-extrabold ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      Goal: <strong>{plan.goal_name}</strong> · Risk: <strong className="capitalize">{plan.risk_profile}</strong>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* SIP + Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Recommended SIP", value: `₹${plan.monthly_sip.toLocaleString('en-IN')}`, sub: "per month" },
                { label: "80C Tax Benefit", value: `₹${Math.round(plan.tax_benefit_80c).toLocaleString('en-IN')}`, sub: "per year (ELSS)" },
                { label: "Budget Conflict", value: plan.budget_conflict ? "Yes ⚠️" : "No ✓", sub: plan.budget_conflict ? "SIP exceeds surplus" : "Within budget" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className="text-xl font-extrabold text-indigo-600 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Asset Mix donut */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Asset Allocation</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-36 h-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(plan.asset_mix).map(([k, v]) => ({ name: k.replace('_', ' '), value: Math.round(v * 100) }))} cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" dataKey="value" stroke="none">
                        {Object.keys(plan.asset_mix).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {Object.entries(plan.asset_mix).map(([k, v], i) => (
                    <div key={k} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{k.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Return scenarios line chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Monthly SIP Scenarios</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: "Conservative", sip: plan.return_scenarios.conservative },
                    { name: "Base", sip: plan.return_scenarios.base },
                    { name: "Optimistic", sip: plan.return_scenarios.optimistic },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Line type="monotone" dataKey="sip" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alternatives */}
            {plan.alternatives && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Alternative Suggestions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "option_a", label: "Option A — Extend Timeline", data: plan.alternatives.option_a, detail: `₹${plan.alternatives.option_a.monthly_sip.toLocaleString('en-IN')}/mo · ${plan.alternatives.option_a.new_target_months} months` },
                    { key: "option_b", label: "Option B — Increase SIP", data: plan.alternatives.option_b, detail: `₹${plan.alternatives.option_b.monthly_sip.toLocaleString('en-IN')}/mo · Original date` },
                  ].map(({ key, label, detail }) => (
                    <div key={key} className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center px-4">{plan.disclaimer}</p>

            <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              <RotateCcw size={14} /> Plan Another Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
