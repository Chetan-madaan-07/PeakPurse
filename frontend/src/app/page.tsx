"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import TransactionTable from "../components/TransactionTable";
import AnalyticsChart from "../components/AnalyticsChart";
import InvestmentAdvisor from '../components/InvestmentAdvisor';
import Hero from '../components/Hero';
import Features from '../components/Features';
import dynamic from 'next/dynamic';
import { useRef } from 'react';

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

  const uploadRef = useRef<HTMLDivElement>(null);

  const handleDataReceived = (data: any, file: File) => {
    console.log("Data mapped to table and charts:", data);
    setTransactions(data);
    setUploadedPdf(file);
    // Smooth scroll to the top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-200">
      <div className="max-w-7xl mx-auto">
        {transactions.length === 0 ? (
          <div className="space-y-0">
            <Hero onGetStarted={scrollToUpload} />
            
            <div ref={uploadRef} className="py-20 animate-fade-in-up">
              <div className="max-w-2xl mx-auto px-4">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Upload Your Statement</h2>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Supported formats: PDF, CSV, Excel. Max 10MB.</p>
                </div>
                <FileUpload onDataReceived={handleDataReceived} />
              </div>
            </div>

            <Features />
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in-down transition-all duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-800 shadow-soft mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">Analysis Workspace</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Viewing report for: <span className="font-bold text-gray-700 dark:text-gray-200">{uploadedPdf?.name}</span></p>
              </div>
              <button 
                onClick={() => {
                  setTransactions([]);
                  setUploadedPdf(null);
                }}
                className="mt-4 md:mt-0 px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all text-xs uppercase tracking-widest"
              >
                Scan New File
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-12 h-full">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
                   <div className="p-6 border-b border-gray-50 dark:border-slate-800">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Statement View</h2>
                   </div>
                   <StatementViewer file={uploadedPdf} transactions={transactions} />
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col h-full gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 flex-1">
                   <AnalyticsChart transactions={transactions} />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 overflow-hidden">
                  <TransactionTable transactions={transactions} />
                </div>
              </div>
              <div className="lg:col-span-4 h-full">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 sticky top-24">
                   <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">Investment AI Advisor</h3>
                   <InvestmentAdvisor />
                </div>
              </div>
            </div>

            <div className="text-center mt-12 pb-8">
              <p className="text-sm text-gray-400 uppercase tracking-[0.2em] font-medium">End of Analysis Report</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}