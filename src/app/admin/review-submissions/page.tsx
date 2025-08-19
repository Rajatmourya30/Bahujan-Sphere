
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ref, deleteObject } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface BaseSubmission {
    id: string;
    submittedAt: any;
    submittedBy: string;
    status: 'pending';
    title: string;
}

interface EventSubmission extends BaseSubmission {
    type: 'Event';
    date: string;
    summary: string;
}
interface BookSubmission extends BaseSubmission {
    type: 'Book';
    authorKey: string;
    imageUrl: string;
}

interface ReadingRoomSubmission extends BaseSubmission {
    type: 'Reading Room';
    author: string;
    coverImageUrl: string;
    storagePath: string;
    coverImageStoragePath: string;
}

interface StoreSubmission extends BaseSubmission {
    type: 'Store';
    imageUrl: string;
}

interface KnowledgeHubSubmission extends BaseSubmission {
    type: 'Knowledge Hub';
    logoUrl: string;
}


type Submission = EventSubmission | BookSubmission | ReadingRoomSubmission | StoreSubmission | KnowledgeHubSubmission;


const collectionMap = {
    'Event': { submission: 'eventSubmissions', live: 'events' },
    'Book': { submission: 'bookSubmissions', live: 'books' },
    'Reading Room': { submission: 'readingRoomSubmissions', live: 'readingRoomPdfs' },
    'Store': { submission: 'storeSubmissions', live: 'stores' },
    'Knowledge Hub': { submission: 'knowledgeHubSubmissions', live: 'knowledgeHub' },
}

export default function ReviewSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.replace('/admin/login');
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        
        const submissionTypes: { name: Submission['type'], collection: string }[] = [
            { name: 'Event', collection: 'eventSubmissions' },
            { name: 'Book', collection: 'bookSubmissions' },
            { name: 'Reading Room', collection: 'readingRoomSubmissions' },
            { name: 'Store', collection: 'storeSubmissions' },
            { name: 'Knowledge Hub', collection: 'knowledgeHubSubmissions' },
        ];

        const unsubscribes = submissionTypes.map(({ name, collection: collectionName }) => {
            const q = query(collection(db, collectionName), where("status", "==", "pending"));
            return onSnapshot(q, (snapshot) => {
                const fetchedSubmissions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: name,
                    ...doc.data()
                } as Submission));
                
                setSubmissions(prev => {
                    const others = prev.filter(s => s.type !== name);
                    return [...others, ...fetchedSubmissions];
                });
                setIsLoading(false);
            }, (error) => {
                console.error(`Error fetching ${collectionName}:`, error);
                toast({ title: 'Error', description: `Could not fetch ${name} submissions.`, variant: 'destructive' });
                setIsLoading(false);
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());

    }, [user, toast]);

    const handleApprove = async (submission: Submission) => {
        if (!user) return;
        
        const { type, id, ...dataToApprove } = submission;
        const liveCollectionName = collectionMap[type].live;
        
        // Remove submission-specific fields before moving to live collection
        const { submittedAt, submittedBy, status, ...liveData } = dataToApprove;

        try {
            await setDoc(doc(db, liveCollectionName, id), {
                ...liveData,
                status: 'approved',
                approvedBy: user.uid,
                approvedAt: serverTimestamp(),
            });
            await deleteDoc(doc(db, collectionMap[type].submission, id));
            toast({ title: 'Approved!', description: `The ${type} submission has been published.` });
        } catch (error) {
            console.error('Error approving submission: ', error);
            toast({ title: 'Error', description: `Could not approve the ${type} submission.`, variant: 'destructive' });
        }
    };
    
    const handleReject = async (submission: Submission) => {
         try {
            // For Reading Room submissions, delete the associated files from Storage
            if (submission.type === 'Reading Room') {
                const pdfFileRef = ref(storage, submission.storagePath);
                await deleteObject(pdfFileRef);
                
                if (submission.coverImageStoragePath) {
                    const coverImageRef = ref(storage, submission.coverImageStoragePath);
                    await deleteObject(coverImageRef);
                }
            }
            // Delete the submission document from Firestore
            await deleteDoc(doc(db, collectionMap[submission.type].submission, submission.id));
            toast({ title: 'Rejected', description: `The ${submission.type} submission has been rejected and deleted.` });
        } catch (error) {
            console.error('Error rejecting submission: ', error);
            toast({ title: 'Error', description: `Could not reject the ${submission.type} submission.`, variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-3xl font-bold">Review Submissions</h1>
                <p className="text-muted-foreground">Approve or reject new content submitted by your team.</p>
            </header>
            <Card>
                <CardContent className="p-0">
                    {submissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title & Type</TableHead>
                                    <TableHead>Submitted By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.sort((a,b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis()).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div>{item.title}</div>
                                            <Badge variant="outline" className="mt-1">{item.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>{item.submittedBy}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {item.submittedAt ? formatDistanceToNow(item.submittedAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-green-600 border-green-600/40 hover:bg-green-50 hover:text-green-700"
                                                    onClick={() => handleApprove(item)}
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-600/40 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => handleReject(item)}
                                                >
                                                    <X className="mr-2 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center p-16">
                            <h3 className="text-lg font-medium">All caught up!</h3>
                            <p className="text-muted-foreground mt-2">There are no pending submissions to review.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}