"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Updated paths for the CSS - stable for Next.js 14
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface ViewerProps {
  file: File | null;
}

export default function StatementViewer({ file }: ViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Step 4.4: The "Wow" Factor Initialization
    // We use the legacy build and a hardcoded version string if pdfjs.version is undefined
    const version = pdfjs.version || '3.11.174';
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.js`;
    
    setIsReady(true);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Prevent any PDF rendering until the browser-only worker is active
  if (!file || !isReady) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-500 font-medium animate-pulse">Initializing PDF Engine...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 h-full animate-slide-up">
      <h3 className="text-lg font-bold text-secondary-900 mb-4 text-center">Original Document</h3>
      
      <div className="border border-secondary-200 rounded-xl overflow-y-auto max-h-[500px] bg-secondary-50 flex justify-center p-4">
        <Document 
          file={file} 
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p className="text-primary-500 font-medium">Loading PDF...</p>}
          error={<p className="text-error-500 font-medium">Failed to load PDF.</p>}
        >
          <Page 
            pageNumber={1} 
            width={300} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            className="shadow-medium rounded-sm"
          />
        </Document>
      </div>
      
      {numPages && (
        <p className="text-center text-sm text-secondary-500 mt-3 font-medium">
          Showing Page 1 of {numPages}
        </p>
      )}
    </div>
  );
}