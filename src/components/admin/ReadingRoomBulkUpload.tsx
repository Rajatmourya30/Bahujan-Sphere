
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Download, FileUp, Loader2, Table } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface StagedDocument {
  title: string;
  author?: string;
}

export function ReadingRoomBulkUpload() {
  const { toast } = useToast();
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
        toast({
            title: 'Invalid File Type',
            description: 'Please upload a valid Excel or CSV file.',
            variant: 'destructive',
        });
        return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedDocs = json.map(row => {
            if (!row.title) {
                throw new Error('Each row must have a `title` column.');
            }
            // This is a simplified version; real uploads would need URLs to PDFs.
            return {
                title: String(row.title),
                author: row.author ? String(row.author) : undefined,
            };
        });

        setStagedDocs(parsedDocs);
      } catch (error: any) {
        toast({
          title: 'Error Parsing File',
          description: error.message || 'There was an issue reading the file.',
          variant: 'destructive',
        });
        setStagedDocs([]);
        setFileName('');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }

    // NOTE: This is a placeholder for a real bulk upload implementation.
    // A real implementation would require a more complex process:
    // 1. Upload all associated PDF files to Firebase Storage.
    // 2. Get the download URLs for each.
    // 3. Match URLs to the data from the CSV.
    // 4. Write all entries to Firestore in a batch operation.
    // For now, we will just add the metadata to Firestore as a demonstration.
    
    try {
        for (const doc of stagedDocs) {
            await addDoc(collection(db, "readingRoomPdfs"), {
                ...doc,
                url: "https://example.com/placeholder.pdf", // Placeholder URL
                storagePath: "placeholders/placeholder.pdf",
                coverImageUrl: null,
                coverImageStoragePath: null,
                uploadedAt: serverTimestamp(),
                uploaderUid: user.uid
            });
        }
        
        toast({
            title: `${stagedDocs.length} Documents Submitted`,
            description: 'The document metadata has been added. Note: This is a demo; PDFs are not actually uploaded.',
        });
        setStagedDocs([]);
        setFileName('');
    } catch (error) {
        console.error("Error submitting documents:", error);
        toast({ title: 'Submission Failed', description: 'Could not save document metadata to the database.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const headers = ["title", "author"];
    const data = [{ "title": "Sample Document Title", "author": "Sample Author" }];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "document_template.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Document Upload</CardTitle>
        <CardDescription>
          Upload an Excel or CSV file with document metadata. Note: This feature is for demonstration and does not upload actual PDF files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Table className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                The file must have a `title` column. `author` is optional.
            </AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                </Button>
            </div>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="file-upload-bulk">Upload Excel/CSV File</Label>
          <div className="flex items-center gap-2">
            <Input id="file-upload-bulk" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor="file-upload-bulk" className="cursor-pointer">
                    <FileUp className="mr-2 h-4 w-4" /> Choose File
                </label>
            </Button>
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
          </div>
        </div>

        {stagedDocs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedDocs.length} documents)</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="space-y-2">
                {stagedDocs.map((doc, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold">{doc.title}</p>
                    {doc.author && <p className="text-muted-foreground">{doc.author}</p>}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : `Submit ${stagedDocs.length} Documents`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    