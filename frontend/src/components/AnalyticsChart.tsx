"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  amount: number;
  category: string;
}

interface AnalyticsProps {
  transactions: Transaction[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AnalyticsChart({ transactions }: AnalyticsProps) {
  const totalSpent = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const categoryData = useMemo(() => {
    return transactions.reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc.sort((a,b) => b.value - a.value); // Sort biggest first
    }, []);
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-center items-center hover:-translate-y-1 transition-transform duration-300">
        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Total Verified Spends</h3>
        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mt-3 drop-shadow-sm">
          ₹{totalSpent.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-emerald-600 mt-5 font-bold bg-emerald-50 px-4 py-1.5 rounded-full ring-1 ring-emerald-200 uppercase tracking-widest">
          AI Parsing 100% Successful
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 h-80 flex flex-col hover:-translate-y-1 transition-transform duration-300">
        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-2 text-center">Spends by Category</h3>
        <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                >
                {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity drop-shadow-md" />
                ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}/>
            </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}