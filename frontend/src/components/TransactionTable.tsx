"use client";

import React from 'react';

// Defining the shape of our JSON data
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8 animate-fade-in-up">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Extracted Transactions</h3>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
          {transactions.length} Records Found
        </span>
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
            {/* Step 4.2: Mapping the data into a clean table */}
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
  );
}