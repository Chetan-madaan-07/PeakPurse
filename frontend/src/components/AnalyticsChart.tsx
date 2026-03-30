"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  amount: number;
  category: string;
}

interface AnalyticsProps {
  transactions: Transaction[];
}

// Ekdum vibrant GenZ colours
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsChart({ transactions }: AnalyticsProps) {
  // Calculate total spent
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group data by category for the Recharts Donut Chart
  const categoryData = transactions.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 animate-fade-in-up">
      {/* Total Spend Summary Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
        <h3 className="text-lg font-medium text-gray-500">Total Extracted Spends</h3>
        <p className="text-5xl font-extrabold text-gray-900 mt-2">
          ₹{totalSpent.toLocaleString('en-IN')}
        </p>
        <p className="text-sm text-green-500 mt-4 font-medium bg-green-50 px-3 py-1 rounded-full">
          AI Parsing Successful
        </p>
      </div>

      {/* The Recharts Donut Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Spends by Category</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}