"use client";

import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onDataReceived: (data: any) => void;
}

export default function FileUpload({ onDataReceived }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('statement', file);
    if (password) {
      formData.append('password', password);
    }

    try {
      console.log("Sending file to backend...");
      
      // Make the real API call to your backend server (we will build this next!)
      // Assuming your backend will run on port 5000
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Success! Backend says:", response.data);
      setIsUploading(false);
      
      // Pass the actual parsed JSON data back to your main page
      onDataReceived(response.data);

    } catch (error) {
      console.error("Upload failed completely. Is the backend running?", error);
      alert("Oops! Could not connect to the backend server.");
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Upload Bank Statement</h2>
      
      {/* The Dropzone Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p className="text-blue-600 font-medium">{file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-500">Drop the PDF here ...</p>
        ) : (
          <p className="text-gray-500">Drag & drop your PDF statement here, or click to select</p>
        )}
      </div>

      {/* Password Input */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          PDF Password (if protected)
        </label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button 
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`mt-6 w-full py-2 px-4 rounded-lg font-bold text-white transition-colors
          ${!file || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isUploading ? 'Processing...' : 'Analyze Statement'}
      </button>
    </div>
  );
}