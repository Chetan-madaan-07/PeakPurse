"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Updated paths for the CSS
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface ViewerProps {
  file: File | null;
}

export default function StatementViewer({ file }: ViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // This is the magic fix: we only set the worker inside the browser
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;
    setIsReady(true);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!file || !isReady) return <div className="p-10 text-center">Initializing PDF Engine...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full animate-fade-in-up">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Original Document</h3>
      
      <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-[500px] bg-gray-100 flex justify-center p-4">
        <Document 
          file={file} 
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p className="text-gray-500 font-medium">Loading PDF...</p>}
          error={<p className="text-red-500">Failed to load PDF.</p>}
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
          Showing Page 1 of {numPages}
        </p>
      )}
    </div>
  );
}