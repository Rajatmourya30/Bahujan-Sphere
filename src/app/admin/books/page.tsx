
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/lib/books';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookManagementTable } from '@/components/admin/BookManagementTable';
import { ManageBookDialog } from '@/components/admin/ManageBookDialog';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';

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
    const q = query(collection(db, 'books'));
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
  
  const handleSave = async (bookData: Omit<Book, 'id' | 'imageUrl'>, newImageFile?: File) => {
    try {
      if (editingBook) { // Editing existing book
        let newImageUrl = editingBook.imageUrl;
        let newImageStoragePath = editingBook.imageStoragePath;
        
        if (newImageFile) {
          if (editingBook.imageStoragePath) {
            const oldImageRef = ref(storage, editingBook.imageStoragePath);
            await deleteObject(oldImageRef).catch(err => console.error("Old image delete failed:", err));
          }
          const newImageRef = ref(storage, `images/books/${Date.now()}-${newImageFile.name}`);
          const uploadResult = await uploadBytes(newImageRef, newImageFile);
          newImageUrl = await getDownloadURL(uploadResult.ref);
          newImageStoragePath = newImageRef.fullPath;
        }

        await updateDoc(doc(db, 'books', editingBook.id), {
          ...bookData,
          imageUrl: newImageUrl,
          imageStoragePath: newImageStoragePath,
        });

        toast({ title: 'Book Updated', description: 'The book has been successfully updated.' });

      } else { // Adding new book
        if (!newImageFile) {
            toast({ title: 'Image Required', description: 'Please provide an image for the new book.', variant: 'destructive' });
            return;
        }

        const newImageRef = ref(storage, `images/books/${Date.now()}-${newImageFile.name}`);
        const uploadResult = await uploadBytes(newImageRef, newImageFile);
        const newImageUrl = await getDownloadURL(uploadResult.ref);

        await addDoc(collection(db, 'books'), {
            ...bookData,
            imageUrl: newImageUrl,
            imageStoragePath: newImageRef.fullPath,
            createdAt: serverTimestamp(),
        });

        toast({ title: 'Book Added', description: 'The new book has been successfully added.' });
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast({ title: 'Error', description: 'Could not save the book.', variant: 'destructive' });
    }
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold">Manage Books</h1>
          <p className="text-muted-foreground">Add, edit, or remove books for the affiliate section.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2" />
          Add Book
        </Button>
      </header>
      
      <BookManagementTable
        books={books}
        onEdit={handleOpenDialog}
        onRemove={handleRemove}
      />

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
