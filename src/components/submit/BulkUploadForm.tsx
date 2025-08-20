
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Download, FileUp, Loader2, Table } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import { isValid } from 'date-fns';

interface StagedEvent {
  title: string;
  date: Date; // Store as a Date object internally
  summary: string;
  readMoreUrl?: string;
  tags: string[];
}

// Function to parse various date formats, including Excel serial numbers
function parseDateFromExcel(dateValue: any): Date | null {
    if (!dateValue) return null;

    // Try converting to a number first for Excel serial dates
    const numericDate = Number(dateValue);
    if (!isNaN(numericDate) && numericDate > 0) {
        // Excel serial date is days since 1900-01-01. JS Date is ms since 1970-01-01.
        // 25569 is days between 1900 and 1970, accounting for Excel's 1900 leap year bug.
        const utcDate = new Date(Date.UTC(0, 0, numericDate - 1));
        if (isValid(utcDate)) {
            return utcDate;
        }
    }
    
    // Fallback for standard string dates
    if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (isValid(parsedDate)) {
            return parsedDate;
        }
    }
    
    return null; // Return null if parsing fails
}


export function BulkUploadForm() {
  const { toast } = useToast();
  const [stagedEvents, setStagedEvents] = useState<StagedEvent[]>([]);
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
    if (!file) {
      return;
    }

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
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedEvents: StagedEvent[] = json.map((row, index) => {
            const lowerCaseRow: { [key: string]: any } = {};
            for (const key in row) {
                lowerCaseRow[key.toLowerCase()] = row[key];
            }

            const { title, date, summary, tags, readmoreurl } = lowerCaseRow;

            if (!title || !date || !summary || !tags) {
                throw new Error(`Row ${index + 2}: Each row must have title, date, summary, and tags.`);
            }

            const parsedDate = parseDateFromExcel(date);
            if (!parsedDate || !isValid(parsedDate)) {
                 throw new Error(`Row ${index + 2}: The date value "${date}" is invalid or could not be parsed.`);
            }

            return {
                title: String(title),
                date: parsedDate,
                summary: String(summary),
                readMoreUrl: readmoreurl ? String(readmoreurl) : undefined,
                tags: String(tags).split(',').map(tag => tag.trim()),
            };
        });

        setStagedEvents(parsedEvents);
      } catch (error: any) {
        toast({
          title: 'Error Parsing File',
          description: error.message || 'There was an issue reading the file.',
          variant: 'destructive',
        });
        setStagedEvents([]);
        setFileName('');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to submit.", variant: "destructive" });
        return;
    }
    if (stagedEvents.length === 0) {
        toast({ title: "No Events to Submit", description: "Please upload a file with events first.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    
    const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
    const collectionName = canPublishDirectly ? 'calendarEvents' : 'eventSubmissions';
    const status = canPublishDirectly ? 'approved' : 'pending';

    try {
        const batch = writeBatch(db);
        const targetCollection = collection(db, collectionName);

        stagedEvents.forEach(event => {
            const docRef = doc(targetCollection);
            const { date, ...restOfEvent } = event;
            const dataToSave: any = {
                ...restOfEvent,
                date: Timestamp.fromDate(date), // Convert JS Date to Firestore Timestamp
                status: status,
            };

            if (canPublishDirectly) {
                dataToSave.approvedBy = user.uid;
                dataToSave.approvedAt = serverTimestamp();
            } else {
                dataToSave.submittedBy = user.email || 'Admin';
                dataToSave.submittedAt = serverTimestamp();
            }
            
            batch.set(docRef, dataToSave);
        });

        await batch.commit();

        toast({
            title: canPublishDirectly ? "Events Published!" : "Events Submitted!",
            description: `${stagedEvents.length} events have been successfully ${canPublishDirectly ? 'published' : 'submitted for review'}.`,
        });

        setStagedEvents([]);
        setFileName('');
    } catch (error) {
        console.error("Error submitting bulk events:", error);
        toast({ title: "Submission Failed", description: "An error occurred while saving the events.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const headers = ["title", "date", "summary", "readMoreUrl", "tags"];
    const data = [
      {
        "title": "Sample Event Title",
        "date": "2025-01-01",
        "summary": "This is a short summary of the sample event.",
        "readMoreUrl": "https://example.com/sample-event",
        "tags": "sample, template"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "event_template.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Event Upload</CardTitle>
        <CardDescription>
          Upload an Excel or CSV file with event data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Table className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                The file must have columns: `title`, `date`, `summary`, and `tags`. `readMoreUrl` is optional. Dates should be in a standard format (e.g., YYYY-MM-DD). For multiple tags, separate them with a comma.
            </AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                </Button>
            </div>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload Excel/CSV File</Label>
          <div className="flex items-center gap-2">
            <Input id="file-upload" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                    <FileUp className="mr-2 h-4 w-4" /> Choose File
                </label>
            </Button>
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
          </div>
        </div>

        {stagedEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedEvents.length} events)</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="space-y-2">
                {stagedEvents.map((event, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-muted-foreground">{event.date.toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : `Submit ${stagedEvents.length} Events`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
