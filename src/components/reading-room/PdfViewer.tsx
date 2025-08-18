
'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = '/_next/static/chunks/pdf.worker.min.mjs';

interface PdfViewerProps {
  file: string;
}

export function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => (prevPageNumber > 1 ? prevPageNumber - 1 : 1));
  };

  const goToNextPage = useCallback(() => {
    if (numPages) {
        setPageNumber(prevPageNumber => (prevPageNumber < numPages ? prevPageNumber + 1 : numPages));
    }
  }, [numPages]);
  
  const zoomIn = () => {
      setScale(s => Math.min(s + 0.2, 3.0));
  }
  
  const zoomOut = () => {
      setScale(s => Math.max(s - 0.2, 0.5));
  }
  

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center flex-wrap gap-2 p-2 bg-card border-b">
         <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                <ChevronLeft />
            </Button>
            <span>
            Page {pageNumber} of {numPages || '--'}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>
                <ChevronRight />
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut}>
                <ZoomOut />
            </Button>
            <Button variant="outline" size="icon" onClick={zoomIn}>
                <ZoomIn />
            </Button>
        </div>
      </div>
      <div className="flex-grow overflow-auto p-4 flex justify-center">
         <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<LoaderWithSkeleton />}
          error={<p>Failed to load PDF file.</p>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={true} 
            renderAnnotationLayer={true}
            loading={<LoaderWithSkeleton />}
          />
        </Document>
      </div>
    </div>
  );
}

const LoaderWithSkeleton = () => (
    <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin" />
        <Skeleton className="h-[842px] w-[595px]" />
    </div>
);
