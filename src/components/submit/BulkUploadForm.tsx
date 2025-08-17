'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Download, FileJson, FileUp, Loader2 } from 'lucide-react';
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

    if (file.type !== 'application/json') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a valid JSON file.',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Basic validation
        if (!Array.isArray(data) || !data.every(item => item.title && item.date && item.summary && item.tags)) {
            throw new Error('JSON data must be an array of events with required fields (title, date, summary, tags).');
        }

        setStagedEvents(data);
      } catch (error: any) {
        toast({
          title: 'Error Parsing File',
          description: error.message || 'There was an issue reading the JSON file.',
          variant: 'destructive',
        });
        setStagedEvents([]);
        setFileName('');
      }
    };
    reader.readAsText(file);
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
    const template = [
      {
        "title": "Sample Event Title",
        "date": "1 January 2025",
        "summary": "This is a short summary of the sample event.",
        "readMoreUrl": "https://example.com/sample-event",
        "tags": ["sample", "template"]
      }
    ];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "event_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Event Upload</CardTitle>
        <CardDescription>
          Upload a JSON file containing an array of event objects.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <FileJson className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                The JSON file must be an array of objects, each with `title`, `date`, `summary`, and `tags` (array of strings). `readMoreUrl` is optional.
            </AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                </Button>
            </div>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="json-upload">Upload JSON File</Label>
          <div className="flex items-center gap-2">
            <Input id="json-upload" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor="json-upload" className="cursor-pointer">
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
