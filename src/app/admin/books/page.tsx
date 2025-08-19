
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookManagementTable } from '@/components/admin/BookManagementTable';
import type { Book } from '@/lib/books';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookSubmissionForm } from '@/components/admin/submissions/BookSubmissionForm';
import { ReviewBookSubmissionsTab } from '@/components/admin/review/ReviewBookSubmissionsTab';
import { ManageBookDialog } from '@/components/admin/ManageBookDialog';

export default function ManageBooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

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
    const q = query(collection(db, 'books'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(fetchedBooks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching books:", error);
      toast({ title: 'Error', description: 'Could not fetch books.', variant: 'destructive' });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, toast]);
  
  const handleOpenDialog = (book: Book | null = null) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };
  
  const handleSave = (bookData: Omit<Book, 'id'>) => {
    // This function can be expanded to handle updates in Firestore
    console.log("Saving book (not implemented):", bookData);
  };

  const handleRemove = async (bookId: string) => {
    try {
        await deleteDoc(doc(db, "books", bookId));
        toast({ title: "Book Removed", description: "The book has been successfully deleted." });
    } catch (error) {
        console.error("Error removing book: ", error);
        toast({ title: "Error", description: "There was a problem deleting the book.", variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Books</h1>
        <p className="text-muted-foreground">Add, edit, or remove books for the affiliate section.</p>
      </header>
      
       <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
           <TabsTrigger value="manage">Manage Books</TabsTrigger>
           <TabsTrigger value="single-book">Submit Book</TabsTrigger>
           <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
            <BookManagementTable
              books={books}
              onEdit={handleOpenDialog}
              onRemove={handleRemove}
            />
        </TabsContent>
        
        <TabsContent value="single-book" className="mt-6">
          <BookSubmissionForm />
        </TabsContent>
        
        <TabsContent value="review" className="mt-6">
          <ReviewBookSubmissionsTab currentUser={user} />
        </TabsContent>
        
      </Tabs>


      {isDialogOpen && (
        <ManageBookDialog
          book={editingBook}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          managePdfUrl={false}
          manageAffiliateUrl={true}
        />
      )}
    </div>
  );
}
