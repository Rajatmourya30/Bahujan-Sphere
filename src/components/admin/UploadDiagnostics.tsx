'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';

interface DiagnosticResult {
    test: string;
    status: 'success' | 'error' | 'warning' | 'pending';
    message: string;
    details?: string;
}

export function UploadDiagnostics() {
    const [user, setUser] = useState<User | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<DiagnosticResult[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const addResult = (result: DiagnosticResult) => {
        setResults(prev => [...prev, result]);
    };

    const updateResult = (testName: string, updates: Partial<DiagnosticResult>) => {
        setResults(prev => prev.map(result => 
            result.test === testName ? { ...result, ...updates } : result
        ));
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setResults([]);

        // Test 1: Authentication
        addResult({ test: 'Authentication', status: 'pending', message: 'Checking authentication...' });
        
        if (!user) {
            updateResult('Authentication', { 
                status: 'error', 
                message: 'User not authenticated',
                details: 'Please log in to continue'
            });
            setIsRunning(false);
            return;
        }

        updateResult('Authentication', { 
            status: 'success', 
            message: `Authenticated as ${user.email}`,
            details: `UID: ${user.uid}`
        });

        // Test 2: Team Membership
        addResult({ test: 'Team Membership', status: 'pending', message: 'Checking team membership...' });
        
        try {
            const teamQuery = query(collection(db, "teamMembers"), where("email", "==", user.email));
            const querySnapshot = await getDocs(teamQuery);
            
            if (querySnapshot.empty) {
                updateResult('Team Membership', { 
                    status: 'error', 
                    message: 'User is not a team member',
                    details: 'Contact an administrator to be added to the team'
                });
            } else {
                const userDoc = querySnapshot.docs[0].data();
                updateResult('Team Membership', { 
                    status: 'success', 
                    message: `Team member with role: ${userDoc.role}`,
                    details: `Document ID: ${querySnapshot.docs[0].id}`
                });
            }
        } catch (error: any) {
            updateResult('Team Membership', { 
                status: 'error', 
                message: 'Failed to check team membership',
                details: error.message
            });
        }

        // Test 3: Firestore Write Access
        addResult({ test: 'Firestore Write', status: 'pending', message: 'Testing Firestore write access...' });
        
        try {
            const testDoc = await addDoc(collection(db, 'readingRoomSubmissions'), {
                test: true,
                timestamp: new Date(),
                userId: user.uid
            });
            
            // Clean up test document
            await deleteDoc(testDoc);
            
            updateResult('Firestore Write', { 
                status: 'success', 
                message: 'Firestore write access confirmed',
                details: 'Successfully created and deleted test document'
            });
        } catch (error: any) {
            updateResult('Firestore Write', { 
                status: 'error', 
                message: 'Firestore write access denied',
                details: error.message
            });
        }

        // Test 4: Storage Upload
        addResult({ test: 'Storage Upload', status: 'pending', message: 'Testing storage upload...' });
        
        try {
            // Create a small test file
            const testContent = 'This is a test file for upload diagnostics';
            const testFile = new Blob([testContent], { type: 'text/plain' });
            const testPath = `test-uploads/diagnostic-${Date.now()}.txt`;
            const storageRef = ref(storage, testPath);
            
            // Upload test file
            await uploadBytes(storageRef, testFile);
            
            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);
            
            // Clean up test file
            await deleteObject(storageRef);
            
            updateResult('Storage Upload', { 
                status: 'success', 
                message: 'Storage upload access confirmed',
                details: `Successfully uploaded and deleted test file at ${testPath}`
            });
        } catch (error: any) {
            updateResult('Storage Upload', { 
                status: 'error', 
                message: 'Storage upload access denied',
                details: `Error: ${error.code} - ${error.message}`
            });
        }

        // Test 5: PDF Processing
        addResult({ test: 'PDF Processing', status: 'pending', message: 'Testing PDF.js functionality...' });
        
        try {
            // Test if PDF.js is available and working
            const pdfjs = await import('pdfjs-dist');
            
            // Create a minimal PDF for testing
            const testPdfData = new Uint8Array([
                0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
                0x0a, 0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0xeb, 0xa7, 0xf3, 0xa0, 0xd0, 0xc4, 0xc6, 0x0a,
                0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x0a, 0x2f, 0x54, 0x79,
                0x70, 0x65, 0x20, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x0a, 0x2f, 0x50,
                0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x0a, 0x3e, 0x3e, 0x0a,
                0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a
            ]);
            
            const loadingTask = pdfjs.getDocument({ data: testPdfData });
            await loadingTask.promise;
            
            updateResult('PDF Processing', { 
                status: 'success', 
                message: 'PDF.js is working correctly',
                details: `PDF.js version: ${pdfjs.version}`
            });
        } catch (error: any) {
            updateResult('PDF Processing', { 
                status: 'warning', 
                message: 'PDF.js may have issues',
                details: `Error: ${error.message}. PDF uploads may still work without metadata extraction.`
            });
        }

        setIsRunning(false);
    };

    const getStatusIcon = (status: DiagnosticResult['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'pending':
                return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
        }
    };

    const getStatusColor = (status: DiagnosticResult['status']) => {
        switch (status) {
            case 'success':
                return 'border-green-200 bg-green-50';
            case 'error':
                return 'border-red-200 bg-red-50';
            case 'warning':
                return 'border-yellow-200 bg-yellow-50';
            case 'pending':
                return 'border-blue-200 bg-blue-50';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Diagnostics</CardTitle>
                <CardDescription>
                    Run diagnostics to identify issues with PDF upload functionality.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button 
                    onClick={runDiagnostics} 
                    disabled={isRunning}
                    className="w-full"
                >
                    {isRunning ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Running Diagnostics...
