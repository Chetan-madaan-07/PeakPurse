"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import TransactionTable from "../components/TransactionTable";
import AnalyticsChart from "../components/AnalyticsChart";
import InvestmentAdvisor from '../components/InvestmentAdvisor';
import dynamic from 'next/dynamic';

// Next.js absolutely requires react-pdf to be rendered only on the client
const StatementViewer = dynamic(() => import('../components/StatementViewer'), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800 h-full min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Viewer</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);

  const handleDataReceived = (data: any, file: File) => {
    console.log("Data mapped to table and charts:", data);
    setTransactions(data);
    setUploadedPdf(file);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 mt-8 animate-fade-in-up transition-all duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-600 to-fuchsia-600 tracking-tight drop-shadow-sm pb-2">
            PeakPurse AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-semibold tracking-wide">
            Intelligent statement parsing and analytics engine.
          </p>
        </div>

        {transactions.length === 0 && (
          <div className="animate-fade-in-up delay-150 transition-all duration-700 transform">
            <FileUpload onDataReceived={handleDataReceived} />
          </div>
        )}

        {transactions.length > 0 && (
          <div className="space-y-12 animate-fade-in-down transition-all duration-700">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 h-full">
                <StatementViewer file={uploadedPdf} transactions={transactions} />
              </div>
              <div className="lg:col-span-7 flex flex-col justify-center h-full">
                <AnalyticsChart transactions={transactions} />
              </div>
            </div>
            
            <TransactionTable transactions={transactions} />

            <div className="mt-12 animate-fade-in-up transition-all duration-700">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Plan Your Financial Future</h2>
                <p className="text-gray-500 mt-2">Use our advisory engine to reach your goals.</p>
              </div>
              <InvestmentAdvisor />
            </div>

            <div className="text-center mt-12 pb-8">
              <button 
                onClick={() => {
                  setTransactions([]);
                  setUploadedPdf(null);
                }}
                className="px-8 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-gray-600 dark:text-gray-300 font-bold rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-md hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 tracking-wide uppercase text-sm"
              >
                Scan Another Statement
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}