
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

interface StagedStore {
  nameKey: string;
  descriptionKey: string;
  storeUrl: string;
}

export function StoreBulkUpload() {
  const { toast } = useToast();
  const [stagedStores, setStagedStores] = useState<StagedStore[]>([]);
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

        const parsedStores: StagedStore[] = json.map((row, index) => {
            const lowerCaseRow: { [key: string]: any } = {};
            for (const key in row) {
                lowerCaseRow[key.toLowerCase()] = row[key];
            }

            const { namekey, descriptionkey, storeurl } = lowerCaseRow;

            if (!namekey || !descriptionkey || !storeurl) {
                throw new Error(`Row ${index + 2}: Each row must have nameKey, descriptionKey, and storeUrl.`);
            }

            return {
                nameKey: String(namekey),
                descriptionKey: String(descriptionkey),
                storeUrl: String(storeurl),
            };
        });

        setStagedStores(parsedStores);
      } catch (error: any) {
        toast({
          title: 'Error Parsing File',
          description: error.message || 'There was an issue reading the file.',
          variant: 'destructive',
        });
        setStagedStores([]);
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
    if (stagedStores.length === 0) {
        toast({ title: "No Stores to Submit", description: "Please upload a file with stores first.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    
    const canPublishDirectly = userRole === 'Admin' || userRole === 'Manager';
    const collectionName = canPublishDirectly ? 'stores' : 'storeSubmissions';
    const status = canPublishDirectly ? 'approved' : 'pending';

    try {
        const batch = writeBatch(db);
        const targetCollection = collection(db, collectionName);

        stagedStores.forEach(store => {
            const docRef = doc(targetCollection);
            const dataToSave: any = {
                ...store,
                imageUrl: 'https://placehold.co/400x400.png', // Placeholder image
                imageStoragePath: '',
                imageAiHint: 'store placeholder',
                status: status,
            };

            if (canPublishDirectly) {
                dataToSave.approvedBy = user.uid;
                dataToSave.approvedAt = serverTimestamp();
            } else {
                dataToSave.submittedBy = user.email || 'Admin';
                dataToSave.submittedAt = serverTimestamp();
                dataToSave.title = store.nameKey; // for display in review table
            }
            
            batch.set(docRef, dataToSave);
        });

        await batch.commit();

        toast({
            title: canPublishDirectly ? "Stores Published!" : "Stores Submitted!",
            description: `${stagedStores.length} stores have been successfully ${canPublishDirectly ? 'published' : 'submitted for review'}. Images must be added manually.`,
        });

        setStagedStores([]);
        setFileName('');
    } catch (error) {
        console.error("Error submitting bulk stores:", error);
        toast({ title: "Submission Failed", description: "An error occurred while saving the stores.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const headers = ["nameKey", "descriptionKey", "storeUrl"];
    const data = [
      {
        "nameKey": "store_sample_name",
        "descriptionKey": "store_sample_description",
        "storeUrl": "https://example.com/store",
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "store_template.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Store Upload</CardTitle>
        <CardDescription>
          Upload an Excel or CSV file with store data. Images must be added manually after upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Table className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription>
                The file must have columns: `nameKey`, `descriptionKey`, and `storeUrl`. All other fields will be set to default values.
            </AlertDescription>
            <div className="mt-4">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                </Button>
            </div>
        </Alert>
        
        <div className="space-y-2">
          <Label htmlFor="store-file-upload">Upload Excel/CSV File</Label>
          <div className="flex items-center gap-2">
            <Input id="store-file-upload" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor="store-file-upload" className="cursor-pointer">
                    <FileUp className="mr-2 h-4 w-4" /> Choose File
                </label>
            </Button>
            {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
          </div>
        </div>

        {stagedStores.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Staged for Upload ({stagedStores.length} stores)</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="space-y-2">
                {stagedStores.map((store, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-semibold">{store.nameKey}</p>
                    <p className="text-muted-foreground truncate">{store.descriptionKey}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Submitting...' : `Submit ${stagedStores.length} Stores`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
