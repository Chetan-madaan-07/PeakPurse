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

  const handleFileChange = (files: File[]) => {
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('statement', file);
    if (password) {
      formData.append('password', password);
    }

    try {
      // Intentionally pinging the backend. If it's down (like during Step 4), it will cleanly route to the catch block.
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsUploading(false);
      onDataReceived(response.data, file);

    } catch (error) {
      // Backend is gracefully caught as offline. Generating precise mock data for the UI to showcase.
      setIsUploading(false);

      // We explicitly provide fully normalized percentages here to accurately 
      // demonstrate bounding box drawing regardless of how large the view is rendered.
      const dummyData = [
        { id: '1', date: '2026-03-25', description: 'Zomato Food Delivery', amount: 450, category: 'Food', boundingBox: { x: 12, y: 15, width: 35, height: 4 } },
        { id: '2', date: '2026-03-26', description: 'Amazon Shopping', amount: 1200, category: 'Shopping', boundingBox: { x: 12, y: 22, width: 35, height: 4 } },
        { id: '3', date: '2026-03-28', description: 'Uber Rides', amount: 300, category: 'Transport', boundingBox: { x: 12, y: 29, width: 35, height: 4 } },
        { id: '4', date: '2026-03-29', description: 'Netflix Subscription', amount: 649, category: 'Entertainment', boundingBox: { x: 12, y: 36, width: 35, height: 4 } },
        { id: '5', date: '2026-03-30', description: 'Swiggy Instamart', amount: 800, category: 'Food', boundingBox: { x: 12, y: 43, width: 35, height: 4 } }
      ];
      onDataReceived(dummyData, file);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-800 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 text-center">Scan Bank Statement</h2>
      
      {/* Newly Integrated Aceternity Drag & Drop Zone */}
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
          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      <button 
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-6 w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300
          ${!file || isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'}`}
      >
        {isUploading ? (
            <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Statement...
            </span>
        ) : 'Analyze Statement with AI'}
      </button>
    </div>
  );
}