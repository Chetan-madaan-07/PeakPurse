"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, PiggyBank, TrendingUp, AlertCircle, Calendar, User, Coins, Wallet, ArrowRight } from "lucide-react";

export default function RetirementCalculator() {
  const { token } = useAuth();
  
  // Base State
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [expectedReturnRate, setExpectedReturnRate] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);
  
  // Realism States
  const [stepUpSIP, setStepUpSIP] = useState(true);
  const [includeEPF, setIncludeEPF] = useState(true);
  const [lifestyleRatio, setLifestyleRatio] = useState(1.0);
  
  // Manual Overrides
  const [manualTargetCorpus, setManualTargetCorpus] = useState("");
  const [manualMonthlyExpenses, setManualMonthlyExpenses] = useState("");
  const [manualCurrentSavings, setManualCurrentSavings] = useState("");

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [hasCalculated, setHasCalculated] = useState(false);

  // NEW: Ref to track and cancel outdated API requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const targetYear = new Date().getFullYear() + (retirementAge - currentAge);

  const handleCalculate = useCallback(async () => {
    if (!token) return setError("Please log in to generate a plan.");
    
    // NEW: If a previous request is still running, cancel it!
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new controller for this specific request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        "/api/investments/retirement-plan",
        {
          currentAge,
          retirementAge,
          lifeExpectancy,
          expectedReturnRate,
          inflationRate,
          includeEPF,
          stepUpSIP,
          lifestyleRatio,
          manualTargetCorpus: manualTargetCorpus ? Number(manualTargetCorpus) : undefined,
          manualMonthlyExpenses: manualMonthlyExpenses ? Number(manualMonthlyExpenses) : undefined,
          manualCurrentSavings: manualCurrentSavings ? Number(manualCurrentSavings) : undefined,
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal // Attach the cancel signal
        }
      );
      
      setResult(response.data.data);
      setHasCalculated(true);
      setLoading(false); // Only stop loading if the request fully succeeded
      
    } catch (err: any) {
      // NEW: If the error is just us canceling the request, silently ignore it
      if (axios.isCancel(err)) {
        return;
      }
      
      setError(err.response?.data?.message || "Failed to calculate retirement plan.");
      setLoading(false); // Stop loading on actual errors
    }
  }, [
    token, currentAge, retirementAge, lifeExpectancy, expectedReturnRate, 
    inflationRate, includeEPF, stepUpSIP, lifestyleRatio, manualTargetCorpus, 
    manualMonthlyExpenses, manualCurrentSavings
  ]);

  // Real-time update effect
  useEffect(() => {
    if (!hasCalculated) return;

    // REDUCED: Swapped 500ms to 300ms for a snappier feel
    const delayDebounceFn = setTimeout(() => {
      handleCalculate();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [handleCalculate, hasCalculated]);

  // Clean up any pending requests if the user leaves the page entirely
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Input Form Column */}
      <div className="col-span-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={24} /> Parameters
          </h2>
          {loading && hasCalculated && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
        </div>

        {/* Beautiful Sliders */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><User size={14} className="text-gray-400"/> Current Age</label>
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-extrabold">{currentAge} yrs</span>
            </div>
            <input type="range" min="20" max="60" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-gray-700" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Calendar size={14} className="text-gray-400"/> Retirement Age</label>
              <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-extrabold">{retirementAge} yrs</span>
            </div>
            <input type="range" min="40" max="70" value={retirementAge} onChange={(e) => setRetirementAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:bg-gray-700" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Coins size={14} className="text-gray-400"/> Expected Return</label>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-extrabold">{expectedReturnRate}%</span>
            </div>
            <input type="range" min="8" max="15" value={expectedReturnRate} onChange={(e) => setExpectedReturnRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-gray-700" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><TrendingUp size={14} className="text-gray-400"/> Inflation Rate</label>
              <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-extrabold">{inflationRate}%</span>
            </div>
            <input type="range" min="4" max="10" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:bg-gray-700" />
          </div>
        </div>

        {/* Overrides & Data */}
        <div className="border-t border-gray-100 dark:border-slate-700 pt-6 space-y-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Leave amounts empty to let PeakPurse auto-detect from your transactions.</p>
          
          <div>
            <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Target Corpus Override</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500 text-sm font-bold">₹</span>
              <input type="number" placeholder="e.g. 10000000" value={manualTargetCorpus} onChange={(e) => setManualTargetCorpus(e.target.value)} className="w-full pl-7 pr-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Expenses</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-xs font-bold">₹</span>
                <input type="number" placeholder="Auto" value={manualMonthlyExpenses} onChange={(e) => setManualMonthlyExpenses(e.target.value)} className="w-full pl-6 pr-2 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Savings</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-xs font-bold">₹</span>
                <input type="number" placeholder="Auto" value={manualCurrentSavings} onChange={(e) => setManualCurrentSavings(e.target.value)} className="w-full pl-6 pr-2 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Realism Controls */}
        <div className="border-t border-gray-100 dark:border-slate-700 pt-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Post-Retirement Lifestyle</label>
            <select 
              value={lifestyleRatio} 
              onChange={(e) => setLifestyleRatio(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer outline-none"
            >
              <option value={0.7}>Modest (70% of current expense)</option>
              <option value={1.0}>Same as Today (100%)</option>
              <option value={1.3}>Luxurious (130%)</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <div>
              <label className="text-sm font-bold text-gray-800 dark:text-gray-200 block">Step-Up SIP</label>
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Increase SIP by 10% yearly</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={stepUpSIP} onChange={(e) => setStepUpSIP(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Include EPF Projection</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={includeEPF} onChange={(e) => setIncludeEPF(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Initial Calculate Button - Hides after first click */}
        {!hasCalculated && (
          <button onClick={handleCalculate} disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
            {loading ? "Crunching Numbers..." : "Calculate My Future"} <ArrowRight size={18} />
          </button>
        )}
        
        {error && <p className="text-xs font-bold text-red-500 text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
      </div>

      {/* Results Column */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        {!result ? (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
            <PiggyBank className="w-20 h-20 text-gray-200 dark:text-slate-700 mb-6" />
            <h3 className="text-2xl font-extrabold text-gray-400 dark:text-slate-500">Ready to plan your future?</h3>
            <p className="text-sm font-medium text-gray-400 mt-3 max-w-sm">Enter your parameters on the left and click calculate. Once activated, the engine will update instantly as you explore different scenarios.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:border-indigo-200 transition-all">
                <div className="absolute top-0 right-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-3 py-1.5 rounded-bl-xl tracking-wider">
                  {result.is_step_up ? "YEAR 1 STARTING SIP" : "FLAT SIP"}
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <Wallet size={16} className="text-gray-400"/>
                   <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Required Monthly SIP</p>
                </div>
                <p className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 mt-2">
                  ₹{result.required_sip.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-500">
                    To reach your target corpus of <strong className="text-indigo-600 dark:text-indigo-400">₹{(result.required_corpus / 10000000).toFixed(2)} Cr</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-2 mb-2">
                   <Calendar size={16} className="text-gray-400"/>
                   <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Future Monthly Need (in {targetYear})</p>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-2">
                  ₹{result.future_monthly_expense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                   <p className="text-xs font-semibold text-gray-500">
                    Based on a <strong className="text-gray-700 dark:text-gray-300">₹{result.adjusted_monthly_expense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> lifestyle today with {inflationRate}% inflation.
                   </p>
                </div>
              </div>
            </div>

            {/* Warning if override is vastly different from ideal */}
            {manualTargetCorpus && (result.required_corpus < result.ideal_corpus * 0.8) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">High Risk of Depletion</p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-500 mt-1.5 leading-relaxed">
                    You entered a target of ₹{(result.required_corpus / 10000000).toFixed(2)} Cr, but based on inflation, you technically need <strong className="font-extrabold">₹{(result.ideal_corpus / 10000000).toFixed(2)} Cr</strong> to be completely safe until age {lifeExpectancy}.
                  </p>
                </div>
              </div>
            )}

            {/* Tax Box */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="text-emerald-400" size={24} />
                  <h3 className="font-extrabold text-xl tracking-wide">Tax Optimization Engine</h3>
                </div>
                <p className="text-sm font-medium text-indigo-200/80 mb-8 max-w-lg">
                  By routing this specific SIP intelligently, you secure massive, immediate tax benefits this financial year.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <p className="text-xs text-indigo-300 uppercase font-extrabold tracking-widest">NPS (Sec 80CCD(1B))</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">Save ₹{result.tax_savings_nps_80ccd.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <p className="text-xs text-indigo-300 uppercase font-extrabold tracking-widest">ELSS (Sec 80C)</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">Save ₹{result.tax_savings_elss_80c.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 p-5 rounded-2xl flex gap-3 items-start">
              <AlertCircle className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Regulatory Disclaimer</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{result.disclaimer}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}