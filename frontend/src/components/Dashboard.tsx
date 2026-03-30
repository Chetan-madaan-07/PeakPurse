"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface DashboardProps {
  transactions: Transaction[];
}

// GenZ vibrant colours for the chart
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard({ transactions }: DashboardProps) {
  // Calculate total spent
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group data by category for the Donut Chart
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
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-8 animate-fade-in-up">
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Total Spend Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <h3 className="text-lg font-medium text-gray-500">Total Extracted Spends</h3>
          <p className="text-5xl font-extrabold text-gray-900 mt-2">
            ₹{totalSpent.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-green-500 mt-4 font-medium bg-green-50 px-3 py-1 rounded-full">
            AI Parsing Successful
          </p>
        </div>

        {/* GenZ Donut Chart */}
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

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Extracted Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Merchant / Description</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600 text-sm">{t.date}</td>
                  <td className="p-4 font-medium text-gray-800">{t.description}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900 text-right">
                    {t.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}