"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import TransactionTable from "../components/TransactionTable";
import AnalyticsChart from "../components/AnalyticsChart";

export default function Home() {
  const [transactions, setTransactions] = useState([]);

  const handleDataReceived = (data: any) => {
    console.log("Data mapped to table and charts:", data);
    setTransactions(data);
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

        {/* Step 4.1: The Dropzone */}
        {transactions.length === 0 && (
          <FileUpload onDataReceived={handleDataReceived} />
        )}

        {/* Show Analytics and Table ONLY when we have data */}
        {transactions.length > 0 && (
          <div className="space-y-8">
            {/* Step 4.3: GenZ Analytics */}
            <AnalyticsChart transactions={transactions} />
            
            {/* Step 4.2: Data Visualization */}
            <TransactionTable transactions={transactions} />
          </div>
        )}
      </div>
    </main>
  );
}