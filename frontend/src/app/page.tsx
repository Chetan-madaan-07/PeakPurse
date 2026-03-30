"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const [transactions, setTransactions] = useState([]);

  const handleDataReceived = (data: any) => {
    console.log("Data received from backend:", data);
    setTransactions(data);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            PeakPurse AI
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Intelligent statement parsing in seconds.
          </p>
        </div>

        {/* Magic Switch: If no data, show uploader. If data exists, show dashboard! */}
        {transactions.length === 0 ? (
          <FileUpload onDataReceived={handleDataReceived} />
        ) : (
          <Dashboard transactions={transactions} />
        )}
      </div>
    </main>
  );
}