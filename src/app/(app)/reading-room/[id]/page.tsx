'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PdfViewer } from '@/components/reading-room/PdfViewer';
import { ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PdfViewPage() {
  const params = useParams();
  const { id } = params;
  const [pdf, setPdf] = useState<ReadingRoomPdf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'teamMembers', user.uid));
          setUserRole(userDoc.exists() ? userDoc.data().role : null);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof id !== 'string') {
        setError("Invalid document ID.");
        setIsLoading(false);
        return;
    }

    const fetchPdf = async () => {
      try {
        const docRef = doc(db, 'readingRoomPdfs', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const pdfData = { id: docSnap.id, ...docSnap.data() } as ReadingRoomPdf;
          
          // CRITICAL FIX: Verify document status
          const isTeamMember = userRole && ['Admin', 'Manager', 'Editor', 'Reviewer', 'Contributor'].includes(userRole);
          
          if (pdfData.status !== 'approved' && !isTeamMember) {
            setError('This document is not available for public viewing.');
            return;
          }
          
          setPdf(pdfData);
        } else {
          setError('Document not found.');
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError('Failed to load the document.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();
  }, [id, userRole]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-red-500">{error}</p>
        </div>
    );
  }

  if (!pdf) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p>No document to display.</p>
        </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">{pdf.title}</h1>
        {pdf.author && <p className="text-sm text-muted-foreground">by {pdf.author}</p>}
      </header>
      <div className="flex-grow">
        <PdfViewer file={pdf.url} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
    return (
        <div className="p-4 h-screen">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-8" />
            <div className="border rounded-lg overflow-hidden">
                <Skeleton className="h-12 bg-gray-200" />
                <Skeleton className="h-[calc(100vh-200px)]" />
            </div>
        </div>
    )
}
