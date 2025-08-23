
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Download, FileUp, Loader2, Table } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

interface StagedBook {
  titleKey: string;
  authorKey: string;
  descriptionKey: string;
  affiliateUrl: string;
}

export function BookBulkUpload() {
  const { toast } = useToast();
  const [stagedBooks, setStagedBooks] = useState<StagedBook[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'teamMembers', currentUser.uid);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role);
            }
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedBooks: StagedBook[] = json.map((row, index) => {
            const lowerCaseRow: { [key: string]: any } = {};
            for (const key in row) {
                lowerCaseRow[key.toLowerCase()] = row[key];
            }
            const { titlekey, authorkey, descriptionkey, affiliateurl } = lowerCaseRow;
            if (!titlekey || !authorkey || !descriptionkey || !affiliateurl) {
                throw new Error(`Row ${index + 2}: Each row must have titleKey, authorKey, descriptionKey, and affiliateUrl.`);
            }
            return {
                titleKey: String(titlekey),
                authorKey: String(authorkey),
                descriptionKey: String(descriptionkey),
                affiliateUrl: String(affiliateurl),
            };
        });
        setStagedBooks(parsedBooks);
      } catch (error: any) {
        toast({
          title: 'Error Parsing File',
          description: error.message || 'There was an issue reading the file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!user) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    if (stagedBooks.length === 0) {
        toast({ title: "No Books to Submit", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    
    const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
    const collectionName = canPublishDirectly ? 'books' : 'bookSubmissions';
    const status = canPublishDirectly ? 'approved' : 'pending';

    try {
        const batch = writeBatch(db);
        const targetCollection = collection(db, collectionName);
        stagedBooks.forEach(book => {
            const docRef = doc(targetCollection);
            const dataToSave: any = {
                ...book,
                imageUrl: 'https://placehold.co/400x600.png',
                imageStoragePath: '',
                imageAiHint: 'book cover placeholder',
                status: status,
            };

            if (canPublishDirectly) {
                dataToSave.approvedBy = user.uid;
                dataToSave.approvedAt = serverTimestamp();
            } else {
                dataToSave.submittedBy = user.email || 'Admin';
                dataToSave.submittedAt = serverTimestamp();
                dataToSave.title = book.titleKey;
            }
            batch.set(docRef, dataToSave);
        });
        await batch.commit();
        toast({
            title: canPublishDirectly ? "Books Published!" : "Books Submitted!",
            description: `${stagedBooks.length} books have been ${canPublishDirectly ? 'published' : 'submitted'}. Images must be added manually.`,
        });
        setStagedBooks([]);
        setFileName('');
    } catch (error) {
        console.error("Error submitting bulk books:", error);
        toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const headers = ["titleKey", "authorKey", "descriptionKey", "affiliateUrl"];
    const data = [{
        "titleKey": "book_sample_title",
        "authorKey": "book_sample_author",
        "descriptionKey": "book_sample_description",
        "affiliateUrl": "https://example.com/book"
    }];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadNode = document.createElement('a');
    downloadNode.setAttribute("href", dataStr);
    downloadNode.setAttribute("download", "book_template.csv");
    document.body.appendChild(downloadNode);
    downloadNode.click();
    downloadNode.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Book Upload</CardTitle>
        <CardDescription>
          Upload an Excel or CSV file with book data. Images must be added manually after upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Table className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                The file must have columns: `titleKey`, `authorKey`, `descriptionKey`, and `affiliateUrl`.
            </AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                </Button>
            </div>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="book-file-upload">Upload Excel/CSV File</Label>
          <div className="flex items-center gap-2">
            <Input id="book-file-upload" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor="book-file-upload" className="cursor-pointer">
                    <FileUp className="mr-2 h-4 w-4" /> Choose File
                </label>
            </Button>
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
          </div>
        </div>

        {stagedBooks.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedBooks.length} books)</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="space-y-2">
                {stagedBooks.map((book, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold">{book.titleKey}</p>
                    <p className="text-muted-foreground truncate">{book.authorKey}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : `Submit ${stagedBooks.length} Books`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
