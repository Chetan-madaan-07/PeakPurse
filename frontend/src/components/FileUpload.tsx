"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { FileUpload as AceternityFileUpload } from "@/components/ui/file-upload";

interface FileUploadProps {
  onDataReceived: (data: any, uploadedFile: File) => void;
}

export default function FileUpload({ onDataReceived }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const data = response.data;
      if (!data.success) {
        setError(data.error || 'Processing failed. Please try again.');
        return;
      }

      const transactions = data.data?.transactions || [];
      if (transactions.length === 0) {
        setError(data.data?.metadata?.note || 'No transactions found. Make sure this is a bank statement PDF.');
        return;
      }

      // Normalize to shape expected by TransactionTable and AnalyticsChart
      const normalized = transactions.map((t: any, i: number) => ({
        id: t.transaction_hash || String(i),
        date: t.date,
        description: t.description || t.merchant_name || 'Transaction',
        amount: Math.abs(t.amount),
        category: t.category || 'Other',
        isDebit: t.amount < 0,
        boundingBox: t.boundingBox || null,
      }));

      onDataReceived(normalized, file);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to connect to the server. Make sure the backend and ML service are running.';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-800 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">Scan Bank Statement</h2>

      <div className="w-full border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-black/20">
        <AceternityFileUpload onChange={handleFileChange} />
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          PDF Password (if protected)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password..."
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-6 w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300
          ${!file || isUploading
            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Extracting transactions...
          </span>
        ) : 'Analyze Statement with AI'}
      </button>
    </div>
  );
}
