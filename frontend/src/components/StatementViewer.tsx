"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import CSS - Important for visual correctness
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Fix Next.js Webpack Worker issue definitively
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Transaction {
  id: string;
  amount: number;
  category: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface StatementViewerProps {
  file: File | null;
  transactions?: Transaction[];
}

export default function StatementViewer({ file, transactions = [] }: StatementViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!file || !isReady) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Viewer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 h-full flex flex-col">
      <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4 text-center">AI Document Preview</h3>
      
      <div className="flex-1 min-h-[400px] border border-gray-200 rounded-xl overflow-y-auto bg-gray-50/50 flex justify-center p-4 relative shadow-inner">
        <Document 
          file={file} 
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex items-center text-indigo-500 font-bold tracking-widest text-sm pt-20">
              <span className="animate-pulse">Parsing PDF Layout...</span>
            </div>
          }
          error={<p className="text-red-500 font-bold text-sm tracking-wide pt-20">Error loading document. Ensure it's a valid PDF.</p>}
        >
          <div className="relative inline-block shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-md overflow-hidden bg-white">
            <Page 
              pageNumber={1} 
              width={350} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              className="transition-opacity duration-500 ease-in-out"
            />
            {/* The "Wow" Factor: Bounding Box Overlay */}
            {transactions.map((t, idx) => {
              if (t.boundingBox) {
                return (
                  <div
                    key={`bbox-${t.id || idx}`}
                    className="absolute border-2 border-fuchsia-500 bg-fuchsia-500/20 backdrop-blur-[1px] pointer-events-none transition-all duration-300 animate-pulse shadow-sm"
                    style={{
                      left: `${t.boundingBox.x}%`,
                      top: `${t.boundingBox.y}%`,
                      width: `${t.boundingBox.width}%`,
                      height: `${t.boundingBox.height}%`,
                      borderRadius: '4px'
                    }}
                  />
                );
              }
              return null;
            })}
          </div>
        </Document>
      </div>
      
      {numPages && (
        <p className="text-center text-xs text-gray-400 mt-4 font-bold uppercase tracking-widest">
          Page 1 / {numPages}
        </p>
      )}
    </div>
  );
}