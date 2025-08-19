
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

interface StagedEvent {
  title: string;
  date: string;
  summary: string;
  readMoreUrl?: string;
  tags: string[];
}

export function BulkUploadForm() {
  const { toast } = useToast();
  const [stagedEvents, setStagedEvents] = useState<StagedEvent[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedEvents = json.map(row => {
            // Make keys lowercase for case-insensitive matching
            const lowerCaseRow: { [key: string]: any } = {};
            for (const key in row) {
                lowerCaseRow[key.toLowerCase()] = row[key];
            }

            const { title, date, summary, tags, readmoreurl } = lowerCaseRow;

            if (!title || !date || !summary || !tags) {
                throw new Error('Each row must have title, date, summary, and tags.');
            }
            return {
                title: String(title),
                date: String(date),
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

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        console.log('Submitting bulk events:', stagedEvents);
        toast({
        title: `${stagedEvents.length} Events Submitted`,
        description: 'The events have been submitted for review.',
        });
        // Reset state after submission
        setStagedEvents([]);
        setFileName('');
        setIsLoading(false);
    }, 1500);
  };
  
  const downloadTemplate = () => {
    const headers = ["title", "date", "summary", "readMoreUrl", "tags"];
    const data = [
      {
        "title": "Sample Event Title",
        "date": "1 January 2025",
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
                The file must have columns: `title`, `date`, `summary`, and `tags`. `readMoreUrl` is optional. For multiple tags, separate them with a comma (e.g., "tag1, tag2").
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
                    <p className="text-muted-foreground">{event.date}</p>
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
