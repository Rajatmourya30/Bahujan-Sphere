
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PdfViewer } from '@/components/reading-room/PdfViewer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  url: string;
  uploadedAt: Timestamp;
}


export default function BookViewerPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  
  const [pdf, setPdf] = useState<ReadingRoomPdf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;

    const fetchPdf = async () => {
        try {
            const docRef = doc(db, "readingRoomPdfs", bookId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setPdf({ id: docSnap.id, ...docSnap.data() } as ReadingRoomPdf);
            } else {
                setError("The requested document could not be found.");
            }
        } catch (err) {
            console.error("Error fetching document:", err);
            setError("An error occurred while fetching the document.");
        } finally {
            setIsLoading(false);
        }
    };

    fetchPdf();
  }, [bookId]);

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  if (error || !pdf) {
    return (
        <div className="flex items-center justify-center h-full min-h-screen">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error || "The requested document could not be loaded."}</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh_-_theme(spacing.14))]">
        <header className="p-4 border-b bg-background">
            <h1 className="font-headline text-2xl font-bold">{pdf.title}</h1>
            {pdf.author && <p className="text-muted-foreground">{pdf.author}</p>}
        </header>
        <div className="flex-grow">
            <PdfViewer file={pdf.url} />
        </div>
    </div>
  );
}
