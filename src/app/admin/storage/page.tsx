
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Folder, File, Download, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface StorageFile {
    name: string;
    path: string;
    url: string;
    size: number;
    updated: string;
}

const FOLDERS_TO_EXPLORE = ['pdfs', 'bookCovers', 'images/books', 'images/logos', 'images/stores'];

export default function StorageExplorerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filesByFolder, setFilesByFolder] = useState<Record<string, StorageFile[]>>({});
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);

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

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const allFilesData: Record<string, StorageFile[]> = {};
            for (const folder of FOLDERS_TO_EXPLORE) {
                const folderRef = ref(storage, folder);
                const res = await listAll(folderRef);
                const filePromises = res.items.map(async (itemRef) => {
                    const [url, metadata] = await Promise.all([
                        getDownloadURL(itemRef),
                        getMetadata(itemRef),
                    ]);
                    return {
                        name: itemRef.name,
                        path: itemRef.fullPath,
                        url,
                        size: metadata.size,
                        updated: metadata.updated,
                    };
                });
                allFilesData[folder] = await Promise.all(filePromises);
            }
            setFilesByFolder(allFilesData);
        } catch (error: any) {
            console.error("Error fetching files from storage:", error);
            toast({
                title: "Error fetching files",
                description: "Could not retrieve file list from Firebase Storage. Check your console for details.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchFiles();
  }, [user, toast]);

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const fileRef = ref(storage, fileToDelete.path);
      await deleteObject(fileRef);

      toast({
        title: "File Deleted",
        description: `"${fileToDelete.name}" has been permanently deleted from storage.`,
      });
      
      // Refresh the file list
      setFilesByFolder(prev => {
          const newFiles = {...prev};
          for (const folder in newFiles) {
              newFiles[folder] = newFiles[folder].filter(f => f.path !== fileToDelete.path);
          }
          return newFiles;
      });

    } catch (error: any) {
        console.error("Error deleting file:", error);
        toast({
            title: "Deletion Failed",
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setFileToDelete(null);
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
        <h1 className="font-headline text-3xl font-bold">Storage Explorer</h1>
        <p className="text-muted-foreground">View and manage files in your Firebase Storage.</p>
      </header>

      <div className="space-y-6">
        {Object.entries(filesByFolder).map(([folder, files]) => (
            <Card key={folder}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Folder className="h-6 w-6" />
                        <span>{folder}/</span>
                    </CardTitle>
                    <CardDescription>{files.length} file(s) found in this directory.</CardDescription>
                </CardHeader>
                <CardContent>
                    {files.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Last Modified</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {files.map(file => (
                                    <TableRow key={file.path}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                           <File className="h-4 w-4 text-muted-foreground" />
                                           {file.name}
                                        </TableCell>
                                        <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                                        <TableCell>{format(new Date(file.updated), 'PPp')}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={file.url} target="_blank">
                                                        <ExternalLink className="mr-2 h-4 w-4" /> View
                                                    </Link>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setFileToDelete(file)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No files found in this folder.</p>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>
      
      {fileToDelete && (
        <AlertDialog open={!!fileToDelete} onOpenChange={(isOpen) => !isOpen && setFileToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the file <span className="font-semibold">{fileToDelete.name}</span>. This action cannot be undone and may break parts of your application if this file is in use.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete File</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
