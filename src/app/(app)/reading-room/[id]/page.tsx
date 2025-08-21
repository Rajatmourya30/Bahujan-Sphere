
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PdfViewer } from '@/components/reading-room/PdfViewer';
import { ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { Skeleton } from '@/components/ui/skeleton';
import { isTeamMember as checkIsTeamMember } from '@/lib/firebase-utils';

export default function PdfViewPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [pdf, setPdf] = useState<ReadingRoomPdf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'teamMembers', user.uid));
          if (userDoc.exists()) {
              const role = userDoc.data().role;
              setUserRole(role);
              setIsTeamMember(checkIsTeamMember(role));
          } else {
              setUserRole(null);
              setIsTeamMember(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
          setIsTeamMember(false);
        }
      } else {
        setUserRole(null);
        setIsTeamMember(false);
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
          
          // CRITICAL SECURITY FIX: Verify document status on the client-side
          if (pdfData.status !== 'approved' && !isTeamMember) {
            setError('This document is not available for public viewing.');
            setIsLoading(false);
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

    // We wait for the user role to be determined before fetching the PDF
    if (userRole !== undefined) {
        fetchPdf();
    }
  }, [id, userRole, isTeamMember]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
            <p className="text-destructive text-center p-4">{error}</p>
        </div>
    );
  }

  if (!pdf) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
            <p>No document to display.</p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
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
        <div className="p-4 h-full">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-8" />
            <div className="border rounded-lg overflow-hidden">
                <Skeleton className="h-12 bg-muted" />
                <Skeleton className="h-[calc(100vh-25rem)]" />
            </div>
        </div>
    )
}
