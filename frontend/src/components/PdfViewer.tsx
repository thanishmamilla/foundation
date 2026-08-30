'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Ensure this only runs on the client to avoid SSR issues
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  url: string;
  activeQuestion?: any;
}

export default function PdfViewer({ url, activeQuestion }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="w-full flex flex-col gap-4 items-center h-[800px] overflow-y-auto bg-gray-300 p-4 rounded-lg">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col gap-4"
        loading={
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p>Loading PDF...</p>
          </div>
        }
      >
        {Array.from(new Array(numPages || 0), (el, index) => (
          <div key={`page_${index + 1}`} className="relative shadow-xl bg-white mb-4 inline-block">
            <Page 
              pageNumber={index + 1} 
              renderTextLayer={false} 
              renderAnnotationLayer={false}
              width={700}
              className="max-w-full"
            />
            
            {/* Bounding Box Highlight overlay for Active Question on this specific page */}
            {activeQuestion && activeQuestion.boundingBox && activeQuestion.pageNumber === (index + 1) && (
              (() => {
                const bbox = activeQuestion.boundingBox;
                let ymin, xmin, ymax, xmax;
                if (Array.isArray(bbox)) {
                  [ymin, xmin, ymax, xmax] = bbox;
                } else {
                  ({ ymin, xmin, ymax, xmax } = bbox);
                }
                
                if (ymin === undefined || xmin === undefined) return null;

                // Gemini sometimes returns 0-1 floats instead of 0-1000 integers
                const scale = (xmax <= 1.5 && ymax <= 1.5) ? 1 : 1000;

                return (
                  <div 
                    className="absolute border-2 border-green-500 bg-green-500/20 rounded shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300 pointer-events-none z-50" 
                    style={{ 
                      top: `${(ymin / scale) * 100}%`, 
                      left: `${(xmin / scale) * 100}%`, 
                      width: `${((xmax - xmin) / scale) * 100}%`, 
                      height: `${((ymax - ymin) / scale) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-3 -left-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                      Q{activeQuestion.number}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        ))}
      </Document>
    </div>
  );
}
