"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";

export default function Home() {
  // We will store the parsed transactions here later
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

        {/* Show the uploader if we don't have transactions yet */}
        {transactions.length === 0 ? (
          <FileUpload onDataReceived={handleDataReceived} />
        ) : (
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold text-green-600">Data Parsed Successfully!</h2>
            <p className="text-gray-600 mt-2">Table and Charts coming up next...</p>
          </div>
        )}
      </div>
    </main>
  );
}