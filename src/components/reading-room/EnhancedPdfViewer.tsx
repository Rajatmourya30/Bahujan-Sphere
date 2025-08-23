'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, RotateCw, Download, BookOpen, Scroll } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface EnhancedPdfViewerProps {
  file: string;
}

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function EnhancedPdfViewer({ file }: EnhancedPdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'single'>('scroll');
  const [currentPage, setCurrentPage] = useState(1);
  const [rotation, setRotation] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // This ensures the component only renders on the client.
  useEffect(() => {
    setIsClient(true);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  }

  const zoomIn = () => {
    setScale(s => Math.min(s + 0.2, 3.0));
  };
  
  const zoomOut = () => {
    setScale(s => Math.max(s - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(r => (r + 90) % 360);
  };

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = file;
    link.download = 'document.pdf';
    link.click();
  };

  const scrollToPage = (pageNum: number) => {
    if (viewMode === 'scroll' && pageRefs.current[pageNum - 1]) {
      pageRefs.current[pageNum - 1]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else if (viewMode === 'single') {
      setCurrentPage(pageNum);
    }
  };

  const goToPrevPage = () => {
    if (viewMode === 'single') {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } else {
      scrollToPage(Math.max(currentPage - 1, 1));
    }
  };

  const goToNextPage = () => {
    if (viewMode === 'single') {
      setCurrentPage(prev => Math.min(prev + 1, numPages || 1));
    } else {
      scrollToPage(Math.min(currentPage + 1, numPages || 1));
    }
  };

  // Track current page in scroll mode
  useEffect(() => {
    if (viewMode !== 'scroll' || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = pageRefs.current.findIndex(ref => ref === entry.target);
            if (pageIndex !== -1) {
              setCurrentPage(pageIndex + 1);
            }
          }
        });
      },
      { threshold: 0.5, root: scrollContainerRef.current }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [viewMode, numPages]);

  if (!isClient) {
    return <LoaderWithSkeleton />;
  }

  const renderPages = () => {
    if (!numPages) return null;

    if (viewMode === 'single') {
      return (
        <div className="flex justify-center">
          <Page 
            pageNumber={currentPage} 
            scale={scale} 
            rotate={rotation}
            renderTextLayer={true} 
            renderAnnotationLayer={true}
            loading={<LoaderWithSkeleton />}
          />
        </div>
      );
    }

    // Scroll mode - render all pages
    return (
      <div className="space-y-4">
        {Array.from(new Array(numPages), (el, index) => (
          <div 
            key={`page_${index + 1}`}
            ref={(el) => { pageRefs.current[index] = el; }}
            className="flex justify-center"
          >
            <div className="relative">
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -left-2 z-10"
              >
                {index + 1}
              </Badge>
              <Page 
                pageNumber={index + 1} 
                scale={scale} 
                rotate={rotation}
                renderTextLayer={true} 
                renderAnnotationLayer={true}
                loading={<PageSkeleton />}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Enhanced Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-card border-b shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Page {currentPage} of {numPages || '--'}
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevPage} 
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={!numPages || currentPage >= numPages}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'scroll' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('scroll')}
              className="h-8"
            >
              <Scroll className="h-4 w-4 mr-1" />
              Scroll
            </Button>
            <Button
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('single')}
              className="h-8"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Single
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Additional Controls */}
          <Button variant="outline" size="sm" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow overflow-auto p-4 bg-muted/30"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin'
        }}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<LoaderWithSkeleton />}
          error={
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="text-destructive text-lg font-medium">
                Failed to load PDF file
              </div>
              <p className="text-muted-foreground">
                Please check if the file exists and is a valid PDF document.
              </p>
            </div>
          }
        >
          {renderPages()}
        </Document>
      </div>

      {/* Page Navigation for Scroll Mode */}
      {viewMode === 'scroll' && numPages && numPages > 1 && (
        <div className="border-t bg-card p-2">
          <div className="flex items-center justify-center gap-1 overflow-x-auto">
            {Array.from(new Array(numPages), (el, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => scrollToPage(index + 1)}
                className="min-w-[40px] h-8"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const LoaderWithSkeleton = () => (
  <div className="flex flex-col items-center gap-4 p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <div className="text-sm text-muted-foreground">Loading PDF...</div>
    <Skeleton className="h-[842px] w-[595px] rounded-lg" />
  </div>
);

const PageSkeleton = () => (
  <div className="flex items-center justify-center">
    <Skeleton className="h-[400px] w-[300px] rounded-lg" />
  </div>
);
