
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, UploadCloud, X, FileCheck, AlertCircle, Settings, CheckCircle, ImageUp, Download } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Image from 'next/image';
import * as pdfjs from 'pdfjs-dist';
import { Textarea } from '../ui/textarea';

type FileStatus = 'pending' | 'configured' | 'uploading' | 'success' | 'error';

export interface StagedPdf {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  errorMessage?: string;
  // Metadata
  title: string;
  author: string;
  description: string;
  coverImageFile: File | null;
  coverImagePreviewUrl: string | null;
  tags: string[];
  language: string;
  publicationYear: number | undefined;
  // Auto-extracted
  fileName: string;
  fileSize: number;
  pageCount: number;
}


function MetadataEditor({ pdf, onSave, onCoverImageChange }: { pdf: StagedPdf, onSave: (data: Partial<StagedPdf>) => void, onCoverImageChange: (file: File | null) => void }) {
    const [title, setTitle] = useState(pdf.title);
    const [author, setAuthor] = useState(pdf.author);
    const [description, setDescription] = useState(pdf.description);
    const [tags, setTags] = useState(pdf.tags.join(', '));
    const [language, setLanguage] = useState(pdf.language);
    const [publicationYear, setPublicationYear] = useState(pdf.publicationYear);

    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(pdf.title);
        setAuthor(pdf.author);
        setDescription(pdf.description);
        setTags(pdf.tags.join(', '));
        setLanguage(pdf.language);
        setPublicationYear(pdf.publicationYear);
    }, [pdf]);

    const handleSave = () => {
        onSave({ 
            title, 
            author, 
            description,
            tags: tags.split(',').map(s => s.trim()).filter(Boolean),
            language,
            publicationYear,
            status: 'configured' 
        });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onCoverImageChange(file);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Metadata</CardTitle>
                <CardDescription className="truncate">
                    Editing: <span className="font-semibold">{pdf.fileName}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                 <div className="space-y-2">
                    <Label htmlFor="pdf-title">Title</Label>
                    <Input id="pdf-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="pdf-author">Author</Label>
                    <Input id="pdf-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="pdf-description">Description</Label>
                    <Textarea id="pdf-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative h-24 w-20 flex-shrink-0 border rounded-md">
                            <Image
                                src={pdf.coverImagePreviewUrl || 'https://placehold.co/400x600.png'}
                                alt="Cover preview"
                                fill
                                className="object-cover rounded-md"
                            />
                        </div>
                        <div className="flex-grow space-y-2">
                             <input type="file" accept="image/*" ref={coverInputRef} onChange={handleFileChange} className="hidden" />
                            <Button variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                                <ImageUp className="mr-2 h-4 w-4" />
                                Change Cover
                            </Button>
                            <p className="text-xs text-muted-foreground">Upload a custom cover image.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pdf-tags">Tags (comma-separated)</Label>
                    <Input id="pdf-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-lang">Language</Label>
                        <Input id="pdf-lang" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g., en" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="pdf-year">Publication Year</Label>
                        <Input id="pdf-year" type="number" value={publicationYear || ''} onChange={(e) => setPublicationYear(Number(e.target.value))} placeholder="e.g., 1936" />
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} className="w-full">Save Metadata</Button>
            </CardFooter>
        </Card>
    );
}

export function ReadingRoomBulkUpload() {
  const { toast } = useToast();
  const [stagedPdfs, setStagedPdfs] = useState<StagedPdf[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `/static/js/pdf.worker.min.mjs`;
  }, []);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return;
    
    const newFilesPromises: Promise<StagedPdf>[] = Array.from(files)
      .filter(file => file.type === 'application/pdf')
      .map(async file => {
        let pageCount = 0;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            pageCount = pdf.numPages;
        } catch (error) {
            console.error("Could not read PDF for page count", error);
        }

        return {
            id: `${file.name}-${file.lastModified}`,
            file,
            status: 'pending',
            progress: 0,
            title: file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
            author: '',
            description: '',
            coverImageFile: null,
            coverImagePreviewUrl: null,
            tags: [],
            language: '',
            publicationYear: undefined,
            fileName: file.name,
            fileSize: file.size,
            pageCount,
        };
      });
      
    const newFiles = await Promise.all(newFilesPromises);

    setStagedPdfs(prev => {
        const existingIds = new Set(prev.map(f => f.id));
        const trulyNewFiles = newFiles.filter(f => !existingIds.has(f.id));
        return [...prev, ...trulyNewFiles];
    });
  };

  const handleMetadataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setMetadataFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);

            setStagedPdfs(prev => {
                return prev.map(pdf => {
                    const meta = json.find(row => row.filename === pdf.fileName);
                    if (meta) {
                        return {
                            ...pdf,
                            title: meta.title || pdf.title,
                            author: meta.author || pdf.author,
                            description: meta.description || pdf.description,
                            tags: meta.tags ? String(meta.tags).split(',').map(s => s.trim()) : pdf.tags,
                            language: meta.language || pdf.language,
                            publicationYear: meta.publicationYear || pdf.publicationYear,
                        };
                    }
                    return pdf;
                });
            });
            toast({ title: "Metadata applied", description: "Matched metadata from your file to staged PDFs." });
        } catch (error) {
            toast({ title: "Error reading metadata file", variant: "destructive" });
        }
      };
      reader.readAsBinaryString(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); handleFilesSelected(e.dataTransfer.files); };

  const removeFile = (id: string) => {
    setStagedPdfs(prev => prev.filter(f => f.id !== id));
    if (selectedPdfId === id) setSelectedPdfId(null);
  };

  const handleSaveMetadata = (data: Partial<StagedPdf>) => {
    if (!selectedPdfId) return;
    setStagedPdfs(prev => prev.map(p => p.id === selectedPdfId ? {...p, ...data } : p));
    toast({ title: "Metadata Saved", description: "The details for the selected PDF have been updated locally." });
  };

  const handleCoverImageChange = (id: string, file: File | null) => {
      setStagedPdfs(prev => prev.map(p => {
          if (p.id === id) {
              if (p.coverImagePreviewUrl && p.coverImagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(p.coverImagePreviewUrl);
              return { ...p, coverImageFile: file, coverImagePreviewUrl: file ? URL.createObjectURL(file) : null };
          }
          return p;
      }));
  }
  
  const uploadSingleFile = (file: File, path: string, onProgress: (p: number) => void): Promise<{ downloadURL: string, storagePath: string }> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', (s) => onProgress((s.bytesTransferred / s.totalBytes) * 100), reject, async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, storagePath: path });
        });
    });
  };

  const processAndUploadFile = (pdf: StagedPdf): Promise<any> => {
     return new Promise(async (resolve, reject) => {
        try {
            if (!pdf.coverImageFile) throw new Error("Cover image is missing.");
            
            const coverPath = `bookCovers/${Date.now()}-${pdf.coverImageFile.name}`;
            const coverInfo = await uploadSingleFile(pdf.coverImageFile, coverPath, () => {});

            const pdfPath = `pdfs/${Date.now()}-${pdf.file.name}`;
            const pdfInfo = await uploadSingleFile(pdf.file, pdfPath, (p) => setStagedPdfs(prev => prev.map(f => f.id === pdf.id ? { ...f, progress: p } : f)));
            
            setStagedPdfs(prev => prev.map(f => f.id === pdf.id ? { ...f, status: 'success' } : f));
            resolve({ ...pdf, pdfInfo, coverInfo });
        } catch (error: any) {
            setStagedPdfs(prev => prev.map(f => f.id === pdf.id ? { ...f, status: 'error', errorMessage: error.message } : f));
            reject({id: pdf.id, error});
        }
    });
  }

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) { toast({ title: 'Not Authenticated', variant: 'destructive' }); return; }

    const filesToUpload = stagedPdfs.filter(pdf => pdf.status === 'configured');
    if (filesToUpload.length === 0) { toast({ title: 'No Configured Files', description: 'Please configure metadata for at least one file.', variant: 'destructive' }); return; }
    
    setIsUploading(true);
    setStagedPdfs(prev => prev.map(f => f.status === 'configured' ? { ...f, status: 'uploading', progress: 0 } : f));

    const results = await Promise.allSettled(filesToUpload.map(processAndUploadFile));
    
    const successfulUploads = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value);

    if (successfulUploads.length > 0) {
        try {
            const batch = writeBatch(db);
            successfulUploads.forEach(upload => {
                const docRef = doc(collection(db, "readingRoomPdfs"));
                batch.set(docRef, {
                    title: upload.title, author: upload.author, description: upload.description,
                    tags: upload.tags, language: upload.language || null, publicationYear: upload.publicationYear || null,
                    url: upload.pdfInfo.downloadURL, storagePath: upload.pdfInfo.storagePath,
                    coverImageUrl: upload.coverInfo.downloadURL, coverImageStoragePath: upload.coverInfo.storagePath,
                    fileName: upload.fileName, fileSize: upload.fileSize, pageCount: upload.pageCount,
                    uploadedAt: serverTimestamp(), uploaderUid: user.uid,
                });
            });
            await batch.commit();
            toast({ title: 'Bulk Upload Complete', description: `${successfulUploads.length}/${filesToUpload.length} documents uploaded.` });
            setStagedPdfs(prev => prev.filter(f => f.status !== 'success'));
            setSelectedPdfId(null);
        } catch (error) {
             toast({ title: 'Firestore Error', description: 'Files uploaded, but failed to save metadata.', variant: 'destructive' });
        }
    }
    if (results.some(r => r.status === 'rejected')) {
        toast({ title: 'Upload Failed', description: 'Some documents failed to upload.', variant: 'destructive' });
    }
    setIsUploading(false);
  };
  
  const downloadTemplate = () => {
    const headers = ["filename", "title", "author", "description", "tags", "language", "publicationYear"];
    const data = [{ "filename": "MyBook.pdf", "title": "My Book Title", "author": "Author Name", "description": "A short summary.", "tags": "history, politics", "language": "en", "publicationYear": 2024 }];
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata");
    XLSX.writeFile(wb, "metadata_template.xlsx");
  };
  
  const overallProgress = useMemo(() => {
    const uploading = stagedPdfs.filter(f => f.status === 'uploading');
    if (uploading.length === 0) return 0;
    return uploading.reduce((acc, f) => acc + f.progress, 0) / uploading.length;
  }, [stagedPdfs]);
  
  const filesToUploadCount = stagedPdfs.filter(f => f.status === 'configured').length;
  const currentlySelectedPdf = useMemo(() => stagedPdfs.find(p => p.id === selectedPdfId) || null, [selectedPdfId, stagedPdfs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card>
            <CardHeader>
                <CardTitle>1. Select Files & Metadata</CardTitle>
                <CardDescription>Upload PDFs and an optional metadata file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label>PDF Files</Label>
                    <div 
                        className={cn("relative flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer", isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}
                        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Drag & drop PDF files here, or click</p>
                        <input id="bulk-pdf-upload" type="file" accept=".pdf" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFilesSelected(e.target.files)} disabled={isUploading}/>
                    </div>
                </div>
                 <div>
                    <Label>Metadata File (Optional)</Label>
                    <div className="flex items-center gap-2">
                        <Input id="metadata-file" type="file" accept=".xlsx, .xls, .csv" onChange={handleMetadataFileChange} className="flex-grow"/>
                        <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                    </div>
                 </div>

                {stagedPdfs.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium">Staged for Upload ({stagedPdfs.length} files)</h3>
                    {isUploading && <Progress value={overallProgress} className="w-full" />}
                    <ScrollArea className="h-64 w-full rounded-md border">
                    <div className="p-2 space-y-2">
                        {stagedPdfs.map((item) => (
                        <div key={item.id} className={cn("flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer", selectedPdfId === item.id ? "bg-muted" : "hover:bg-muted/50")} onClick={() => setSelectedPdfId(item.id)}>
                            <div className="flex-shrink-0">
                                {item.status === 'success' && <FileCheck className="text-green-500" />}
                                {item.status === 'error' && <AlertCircle className="text-destructive" />}
                                {item.status === 'configured' && <CheckCircle className="text-blue-500" />}
                                {item.status === 'pending' && <Settings className="text-muted-foreground" />}
                                {item.status === 'uploading' && <Loader2 className="animate-spin" />}
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <p className="text-sm font-semibold truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.fileName}</p>
                                {item.status === 'uploading' && <Progress value={item.progress} className="h-1 mt-1" />}
                                {item.status === 'error' && <p className="text-xs text-destructive truncate">{item.errorMessage}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="flex-shrink-0 w-6 h-6" onClick={(e) => { e.stopPropagation(); removeFile(item.id); }} disabled={isUploading}><X className="w-4 h-4" /></Button>
                        </div>))}
                    </div>
                    </ScrollArea>
                </div>)}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} disabled={isUploading || filesToUploadCount === 0} className="w-full">
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    {isUploading ? `Uploading... (${Math.round(overallProgress)}%)` : `Upload ${filesToUploadCount} Configured File(s)`}
                </Button>
            </CardFooter>
        </Card>

        <div>
            {currentlySelectedPdf ? (
                <MetadataEditor pdf={currentlySelectedPdf} onSave={handleSaveMetadata} onCoverImageChange={(file) => handleCoverImageChange(currentlySelectedPdf.id, file)} />
            ) : (
                 <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground p-6">
                        <FileUp className="mx-auto h-12 w-12" />
                        <p className="mt-4">Select a file from the list to edit its details.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
