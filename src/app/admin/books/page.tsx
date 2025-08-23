
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/lib/books';
import { BookSubmissionForm } from '@/components/admin/submissions/BookSubmissionForm';
import { ReviewBookSubmissionsTab } from '@/components/admin/review/ReviewBookSubmissionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BooksStatsDashboard } from '@/components/admin/BooksStatsDashboard';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { BookManagementTable } from '@/components/admin/BookManagementTable';
import { ManageBookDialog } from '@/components/admin/ManageBookDialog';
import { BookBulkUpload } from '@/components/admin/submissions/BookBulkUpload';

export default function ManageBooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        setBooks(fetchedBooks);
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch books:", error);
        toast({ title: 'Error', description: 'Could not fetch books.', variant: 'destructive' });
        setIsLoading(false);
    });
    return () => unsubscribeFirestore();
  }, [user, toast]);

  const handleOpenDialog = (book: Book | null = null) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const handleRemove = async (bookId: string) => {
      if (!window.confirm("Are you sure you want to delete this book?")) return;
      try {
          const bookToDelete = books.find(b => b.id === bookId);
          if (bookToDelete?.imageStoragePath) {
              await deleteObject(ref(storage, bookToDelete.imageStoragePath));
          }
          await deleteDoc(doc(db, 'books', bookId));
          toast({ title: 'Success', description: 'Book deleted.' });
      } catch (error) {
          console.error("Error removing book:", error);
          toast({ title: 'Error', description: 'Could not delete book.', variant: 'destructive' });
      }
  };

  const handleSave = async (data: Omit<Book, 'id' | 'imageUrl'>, newImageFile?: File) => {
      if (!editingBook) return;
      try {
          let imageUrl = editingBook.imageUrl;
          let imageStoragePath = editingBook.imageStoragePath || '';

          if (newImageFile) {
              if (editingBook.imageStoragePath) {
                  await deleteObject(ref(storage, editingBook.imageStoragePath));
              }
              const imageRef = ref(storage, `images/books/${Date.now()}-${newImageFile.name}`);
              await uploadBytes(imageRef, newImageFile);
              imageUrl = await getDownloadURL(imageRef);
              imageStoragePath = imageRef.fullPath;
          }
          
          await updateDoc(doc(db, 'books', editingBook.id), {
              ...data,
              imageUrl,
              imageStoragePath,
          });
          toast({ title: 'Success', description: 'Book updated.' });
      } catch (error) {
          console.error("Error saving book:", error);
          toast({ title: 'Error', description: 'Could not save book.', variant: 'destructive' });
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
          <p className="text-muted-foreground">Manage, submit, or review books for the directory.</p>
      </header>

      <BooksStatsDashboard />
      
      <Tabs defaultValue="manage">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="submit">Submit Single</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="review">Review Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
            <BookManagementTable
                books={books}
                onEdit={handleOpenDialog}
                onRemove={handleRemove}
            />
        </TabsContent>
        <TabsContent value="submit" className="mt-6">
            <BookSubmissionForm />
        </TabsContent>
        <TabsContent value="bulk-upload" className="mt-6">
            <BookBulkUpload />
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
        />
      )}
    </div>
  );
}
