"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import CSS - Important for visual correctness
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function StatementViewer({ file }: { file: File | null }) {
  const [numPages, setNumPages] = useState<number>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Force the legacy worker build from cdnjs (very stable)
    const version = '3.11.174'; 
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
    setIsReady(true);
  }, []);

  if (!file || !isReady) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 font-medium animate-pulse">Preparing Document Viewer...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Statement Preview</h3>
      
      <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-[500px] bg-gray-50 flex justify-center p-4">
        <Document 
          file={file} 
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p className="text-blue-500 font-medium">Loading PDF...</p>}
          error={<p className="text-red-500">Error loading document.</p>}
        >
          <Page 
            pageNumber={1} 
            width={300} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
      
      {numPages && (
        <p className="text-center text-sm text-gray-500 mt-3 font-medium">
          Page 1 of {numPages}
        </p>
      )}
    </div>
  );
}