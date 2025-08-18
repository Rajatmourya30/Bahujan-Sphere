
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { allBooks, type Book } from '@/lib/books';
import { BookManagementTable } from '@/components/admin/BookManagementTable';
import { ManageBookDialog } from '@/components/admin/ManageBookDialog';

export default function ManageBooksPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [books, setBooks] = useState(allBooks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleOpenDialog = (book: Book | null = null) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };
  
  const handleSave = (bookData: Omit<Book, 'id'>) => {
    if (editingBook) {
      setBooks(currentBooks => currentBooks.map(b => b.id === editingBook.id ? { ...b, ...bookData } : b));
    } else {
      setBooks(currentBooks => [...currentBooks, { ...bookData, id: `book-${Date.now()}` }]);
    }
  };

  const handleRemove = (bookId: string) => {
    setBooks(currentBooks => currentBooks.filter(b => b.id !== bookId));
  };

  if (!isAuthenticated) {
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
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold">Manage Books</h1>
          <p className="text-muted-foreground">Add, edit, or remove books for the affiliate section.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </header>

      <section>
        <BookManagementTable
          books={books}
          onEdit={handleOpenDialog}
          onRemove={handleRemove}
        />
      </section>

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
