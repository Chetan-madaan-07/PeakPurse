import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InvestmentAdvisor() {
  const [step, setStep] = useState(1);
  const [planData, setPlanData] = useState<any>(null);
  const [error, setError] = useState('');

  // Step 1 Form
  const { register: registerGoal, handleSubmit: handleGoalSubmit } = useForm();
  
  // Step 2 Form
  const { register: registerRisk, handleSubmit: handleRiskSubmit } = useForm();

  const onGoalSubmit = (data: any) => {
    // Edge Case: Check if target date is in the current month 
    const targetDate = new Date(data.targetDate);
    const currentDate = new Date();
    if (targetDate.getMonth() === currentDate.getMonth() && targetDate.getFullYear() === currentDate.getFullYear()) {
        setError('Target date cannot be in the current month.');
        return;
    }
    setError('');
    setStep(2);
  };

  const onRiskSubmit = async (data: any) => {
    // Here you will call your Investment_Service backend 
    // Simulating backend response for the dashboard
    const simulatedResponse = {
      riskIdentity: "Moderate Investor",
      feasibility: "Stretched", // achievable, stretched, unrealistic 
      assetMix: [
        { name: 'Equity Funds', value: 50 },
        { name: 'Debt Funds', value: 50 }
      ],
      scenarios: [
        { year: 1, conservative: 10, base: 12, optimistic: 15 },
        { year: 5, conservative: 50, base: 60, optimistic: 75 },
      ]
    };
    setPlanData(simulatedResponse);
    setStep(3);
  };

  const COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#f59e0b'];

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800">
      
      {/* Step 1: Goal Intake Form */}
      {step === 1 && (
        <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Step 1: Define Your Goal</h2>
          {error && <p className="text-red-500 font-semibold">{error}</p>}
          
          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Goal Name</label>
            <input {...registerGoal("goalName", { required: true })} placeholder="e.g., Retirement Fund" className="mt-1 block w-full rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white transition-all" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Target Amount (₹)</label>
            <input type="number" {...registerGoal("targetAmount", { required: true })} placeholder="20,00,000" className="mt-1 block w-full rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white transition-all" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Target Date</label>
            <input type="date" {...registerGoal("targetDate", { required: true })} className="mt-1 block w-full rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white transition-all" />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-bold mt-4">Next: Risk Profiling</button>
        </form>
      )}

      {/* Step 2: Risk Profiler UI */}
      {step === 2 && (
        <form onSubmit={handleRiskSubmit(onRiskSubmit)} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Step 2: Risk Profiler</h2>
          <p className="text-gray-500">Please answer these questions to determine your risk appetite.</p>
          
          {/* Example Question */}
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
            <p className="font-semibold mb-2">1. How would you react if your portfolio dropped 20% in a month?</p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="radio" value="conservative" {...registerRisk("q1")} className="text-indigo-600 focus:ring-indigo-500" />
                <span>I would sell everything immediately.</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="moderate" {...registerRisk("q1")} className="text-indigo-600 focus:ring-indigo-500" />
                <span>I would wait and watch.</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="aggressive" {...registerRisk("q1")} className="text-indigo-600 focus:ring-indigo-500" />
                <span>I would buy more.</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="text-gray-600 font-semibold hover:text-gray-900">Back</button>
            <button type="submit" className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 font-bold">Generate Plan</button>
          </div>
        </form>
      )}

      {/* Step 3: The Plan Dashboard */}
      {step === 3 && planData && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-slate-700">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Investment Plan</h2>
                <p className="text-indigo-600 font-semibold mt-1">Profile: {planData.riskIdentity}</p>
            </div>
            {/* Feasibility Badge */}
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide
              ${planData.feasibility === 'Achievable' ? 'bg-green-100 text-green-800' : 
                planData.feasibility === 'Stretched' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}>
              {planData.feasibility}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donut Chart for Asset Mix */}
            <div className="h-64 flex flex-col items-center">
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Recommended Asset Mix</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planData.assetMix} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {planData.assetMix.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart for Scenarios */}
            <div className="h-64 flex flex-col items-center">
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Return Scenarios</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={planData.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="optimistic" stroke="#10b981" />
                  <Line type="monotone" dataKey="base" stroke="#4f46e5" />
                  <Line type="monotone" dataKey="conservative" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Step 4: Alternative Suggestions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 p-6 rounded-r-xl mt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-500">Plan Adjustments Required</h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400/80 mb-4 font-medium">Your current goal is {planData.feasibility.toLowerCase()}. Consider these optimized alternatives:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option A & B */}
                <button className="text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-all font-semibold shadow-sm">
                  <span className="text-yellow-600 block text-xs uppercase tracking-widest mb-1">Option A</span>
                  Lower monthly contribution + Extended target date
                </button>
                <button className="text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-yellow-200 dark:border-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-all font-semibold shadow-sm">
                  <span className="text-yellow-600 block text-xs uppercase tracking-widest mb-1">Option B</span>
                  Higher monthly contribution + Original date
                </button>
              </div>
            </div>

          <div className="mt-8 text-xs text-gray-400 text-center">
             * Disclaimer: This platform is not a SEBI-registered RIA. Recommendations are strictly educational.
          </div>
        </div>
      )}
    </div>
  );
}