
'use server';

import { collection, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { PendingReadingRoomItem } from '@/components/admin/ReviewReadingRoomSubmissionsTab';

type SampleSubmission = Omit<PendingReadingRoomItem, 'id' | 'submittedAt' | 'submittedBy' | 'status'>;

export const sampleSubmissions: SampleSubmission[] = [
    {
        title: "The Buddha and His Dhamma",
        author: "Dr. B. R. Ambedkar",
        description: "A treatise on the life and philosophy of the Buddha by Dr. Ambedkar, presenting Buddhism in a rational, scientific, and socially engaged manner.",
        tags: ["buddhism", "philosophy", "ambedkarite"],
        language: "en",
        publicationYear: 1957,
        url: "https://firebasestorage.googleapis.com/v0/b/your-project-id.appspot.com/o/sample-placeholder.pdf?alt=media",
        storagePath: "pendingPdfs/sample1.pdf",
        coverImageUrl: "https://placehold.co/400x600.png?text=Buddha+%26+Dhamma",
        coverImageStoragePath: "pendingCovers/sample1.png",
        fileName: "the-buddha-and-his-dhamma.pdf",
        fileSize: 1500000,
        pageCount: 599,
    },
    {
        title: "Periyar on Women's Rights",
        author: "E. V. Ramasamy (Periyar)",
        description: "A collection of Periyar's revolutionary thoughts on feminism, the caste system, and atheism, advocating for the complete liberation of women.",
        tags: ["feminism", "social-reform", "periyar"],
        language: "en",
        publicationYear: 1929,
        url: "https://firebasestorage.googleapis.com/v0/b/your-project-id.appspot.com/o/sample-placeholder.pdf?alt=media",
        storagePath: "pendingPdfs/sample2.pdf",
        coverImageUrl: "https://placehold.co/400x600.png?text=Periyar",
        coverImageStoragePath: "pendingCovers/sample2.png",
        fileName: "periyar-on-womens-rights.pdf",
        fileSize: 800000,
        pageCount: 120,
    }
];

// This is a server action to seed the database with sample data.
// In a real app, you would have more robust data management.
export async function seedSampleSubmissions() {
    const submissionsCollection = collection(db, 'readingRoomSubmissions');

    // Check if there's already data to prevent re-seeding
    const snapshot = await getDocs(submissionsCollection);
    if (!snapshot.empty) {
        throw new Error("Sample data already exists. Please clear the 'readingRoomSubmissions' collection in Firestore to re-seed.");
    }
    
    const batch = writeBatch(db);

    sampleSubmissions.forEach(submission => {
        const docRef = collection(db, 'readingRoomSubmissions').doc();
        batch.set(docRef, {
            ...submission,
            submittedAt: serverTimestamp(),
            submittedBy: 'sample-seed@example.com',
            status: 'pending'
        });
    });

    await batch.commit();
}
