"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import TransactionTable from "../components/TransactionTable";
import AnalyticsChart from "../components/AnalyticsChart";
import dynamic from 'next/dynamic';

const StatementViewer = dynamic(() => import('../components/StatementViewer'), {
  ssr: false,
});

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);

  // Catch both the data AND the file
  const handleDataReceived = (data: any, file: File) => {
    console.log("Data mapped to table and charts:", data);
    setTransactions(data);
    setUploadedPdf(file);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
            PeakPurse AI
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Intelligent statement parsing in seconds.
          </p>
        </div>

        {/* The Dropzone */}
        {transactions.length === 0 && (
          <FileUpload onDataReceived={handleDataReceived} />
        )}

        {/* The Dashboard */}
        {transactions.length > 0 && (
          <div className="space-y-8">
            
            {/* Split Screen: PDF on the Left, Analytics on the Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <StatementViewer file={uploadedPdf} />
              </div>
              <div className="lg:col-span-2">
                <AnalyticsChart transactions={transactions} />
              </div>
            </div>
            
            {/* The Table below them */}
            <TransactionTable transactions={transactions} />
          </div>
        )}
      </div>
    </main>
  );
}