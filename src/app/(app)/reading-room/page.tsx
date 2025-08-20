
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, type Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import Image from 'next/image';

interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  uploadedAt: Timestamp;
  coverImageUrl?: string;
  status?: 'approved' | 'pending' | 'rejected';
}

function ReadingRoomBookCard({ pdf }: { pdf: ReadingRoomPdf }) {
    const { t } = useLanguage();

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4">
                <div className="relative h-32 w-24 flex-shrink-0">
                    <Image
                        src={pdf.coverImageUrl || 'https://placehold.co/400x600.png'}
                        alt={pdf.title}
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint="book cover"
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{pdf.title}</CardTitle>
                    {pdf.author && <CardDescription className="text-sm font-medium">{pdf.author}</CardDescription>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    A publicly available document for reading and study.
                </p>
            </CardContent>
            <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                    <Link href={`/reading-room/${pdf.id}`}>
                       <BookOpen className="mr-2 h-4 w-4" />
                        {t('reading_room.read_now_button')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ReadingRoomPage() {
    const { t } = useLanguage();
    const [pdfs, setPdfs] = useState<ReadingRoomPdf[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "readingRoomPdfs"),
            where("status", "==", "approved"),
            orderBy("uploadedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPdfs: ReadingRoomPdf[] = [];
            querySnapshot.forEach((doc) => {
                fetchedPdfs.push({ id: doc.id, ...doc.data() } as ReadingRoomPdf);
            });
            setPdfs(fetchedPdfs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching PDFs:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('reading_room.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('reading_room.description')}
                </p>
            </header>
            
            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : pdfs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {pdfs.map(pdf => (
                        <ReadingRoomBookCard key={pdf.id} pdf={pdf} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <CardContent>
                        <h3 className="text-lg font-medium">No Documents Available</h3>
                        <p className="text-muted-foreground mt-2">Check back later for new additions to the reading room.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
