'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { storage, auth } from '@/lib/firebase';
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { Trash2, Download, Search, File, Image as ImageIcon, FileText, Folder } from 'lucide-react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface StorageItem {
  name: string;
  fullPath: string;
  downloadURL: string;
  size: number;
  contentType: string;
  timeCreated: string;
  type: 'file' | 'folder';
}

export function StorageExplorer() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const { toast } = useToast();

  const loadStorageItems = async (path: string = '') => {
    setIsLoading(true);
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const itemsData: StorageItem[] = [];

      // Add folders
      for (const folderRef of result.prefixes) {
        itemsData.push({
          name: folderRef.name,
          fullPath: folderRef.fullPath,
          downloadURL: '',
          size: 0,
          contentType: 'folder',
          timeCreated: '',
          type: 'folder'
        });
      }

      // Add files
      for (const itemRef of result.items) {
        try {
          const [downloadURL, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef)
          ]);

          itemsData.push({
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            downloadURL,
            size: metadata.size,
            contentType: metadata.contentType || 'unknown',
            timeCreated: metadata.timeCreated,
            type: 'file'
          });
        } catch (error) {
          console.error(`Error loading metadata for ${itemRef.name}:`, error);
        }
      }

      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (error: any) {
      console.error('Error loading storage items:', error);
      
      let errorMessage = 'Failed to load storage items.';
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to access storage. Please ensure you have admin privileges and your custom claims are set correctly.';
      }
      
      toast({
        title: 'Storage Access Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageItems(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleDelete = async (item: StorageItem) => {
    try {
      const itemRef = ref(storage, item.fullPath);
      await deleteObject(itemRef);
      
      toast({
        title: 'Success',
        description: `${item.name} has been deleted.`
      });
      
      // Reload the current directory
      loadStorageItems(currentPath);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (item: StorageItem) => {
    if (item.downloadURL) {
      const link = document.createElement('a');
      link.href = item.downloadURL;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType === 'folder') return <Folder className="h-4 w-4" />;
    if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (contentType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeColor = (contentType: string) => {
    if (contentType === 'folder') return 'bg-blue-100 text-blue-800';
    if (contentType.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (contentType === 'application/pdf') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Storage Explorer</span>
          <div className="flex items-center gap-2">
            {currentPath && (
              <Button variant="outline" size="sm" onClick={navigateUp}>
                ← Back
              </Button>
            )}
            <Badge variant="secondary">
              {filteredItems.length} items
            </Badge>
          </div>
        </CardTitle>
        {currentPath && (
          <p className="text-sm text-muted-foreground">
            Current path: /{currentPath}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.fullPath}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(item.contentType)}
                          <div className="flex items-center gap-2">
                            {item.type === 'file' && item.contentType.startsWith('image/') && (
                              <div className="relative h-8 w-8 flex-shrink-0">
                                <Image
                                  src={item.downloadURL}
                                  alt={item.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <span 
                              className={item.type === 'folder' ? 'cursor-pointer hover:underline' : ''}
                              onClick={() => item.type === 'folder' && navigateToFolder(item.fullPath)}
                            >
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFileTypeColor(item.contentType)}>
                          {item.type === 'folder' ? 'Folder' : item.contentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.type === 'file' ? formatFileSize(item.size) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.timeCreated ? new Date(item.timeCreated).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.type === 'file' && (
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(item)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
