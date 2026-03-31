"use client";

import React from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface TableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800 overflow-hidden mt-8 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Extracted Transactions</h3>
        <span className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-teal-800 dark:text-teal-400 shadow-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          {transactions.length} Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Merchant / Description</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {transactions.map((t, index) => (
              <tr key={t.id || index} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors duration-200">
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm font-medium">{t.date}</td>
                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{t.description}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-extrabold text-gray-900 dark:text-gray-100 text-right text-base">
                  {t.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}