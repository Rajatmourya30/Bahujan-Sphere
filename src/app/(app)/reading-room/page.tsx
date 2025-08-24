
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, type Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import { READING_ROOM_CATEGORIES } from '@/lib/categories';
import { languages } from '@/lib/i18n/languages';

interface ReadingRoomPdf {
  id: string;
  title: string;
  author?: string;
  description?: string;
  uploadedAt: Timestamp;
  coverImageUrl?: string;
  status?: 'approved' | 'pending' | 'rejected';
  tags?: string[];
  language?: string;
  publicationYear?: number;
}

function ReadingRoomBookCard({ pdf }: { pdf: ReadingRoomPdf }) {
    const { t } = useLanguage();

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4">
                <div className="relative h-32 w-24 flex-shrink-0">
                    <Image
                        src={pdf.coverImageUrl || 'https://placehold.co/400x600.png'}
                        alt={pdf.title}
                        fill
                        sizes="96px"
                        className="object-cover rounded-md"
                        data-ai-hint="book cover"
                    />
                </div>
                <div className="flex-grow">
                    <CardTitle className="font-headline text-lg">{pdf.title}</CardTitle>
                    {pdf.author && <CardDescription className="text-sm font-medium">{pdf.author}</CardDescription>}
                    {pdf.publicationYear && (
                        <CardDescription className="text-xs text-muted-foreground">
                            Published: {pdf.publicationYear}
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {pdf.description || "A publicly available document for reading and study."}
                </p>
                {pdf.tags && pdf.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {pdf.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {pdf.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{pdf.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                    <Link href={`/reading-room/${pdf.id}`}>
                       <BookOpen className="mr-2 h-4 w-4" />
                        {t('reading_room.read_now_button')}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ReadingRoomPage() {
    const { t } = useLanguage();
    const [pdfs, setPdfs] = useState<ReadingRoomPdf[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLanguage, setSelectedLanguage] = useState('all');

    useEffect(() => {
        const q = query(
            collection(db, "readingRoomPdfs"),
            where("status", "==", "approved"),
            orderBy("uploadedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedPdfs: ReadingRoomPdf[] = [];
            querySnapshot.forEach((doc) => {
                fetchedPdfs.push({ id: doc.id, ...doc.data() } as ReadingRoomPdf);
            });
            setPdfs(fetchedPdfs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching PDFs:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter and search functionality
    const filteredPdfs = useMemo(() => {
        return pdfs.filter(pdf => {
            // Category filter
            const categoryMatch = selectedCategory === 'all' || 
                (pdf.tags && pdf.tags.map(t => t.toLowerCase()).includes(selectedCategory.toLowerCase()));

            // Language filter
            const languageMatch = selectedLanguage === 'all' || 
                (pdf.language && pdf.language.toLowerCase() === selectedLanguage.toLowerCase());
            
            // Search filter
            const searchMatch = searchTerm === '' || 
                pdf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pdf.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pdf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pdf.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            return categoryMatch && languageMatch && searchMatch;
        });
    }, [pdfs, searchTerm, selectedCategory, selectedLanguage]);


    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">{t('reading_room.title')}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('reading_room.description')}
                </p>
            </header>

            {/* Search and Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Search & Filter
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Bar */}
                    <div className="relative md:col-span-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, author, description, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {/* Category Filter */}
                    <div>
                        <Label>Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {READING_ROOM_CATEGORIES.map(category => (
                                    <SelectItem key={category.key} value={category.label}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Language Filter */}
                    <div>
                        <Label>Language</Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Languages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Languages</SelectItem>
                                {languages.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                        {isLoading ? 'Loading...' : `${filteredPdfs.length} Document${filteredPdfs.length !== 1 ? 's' : ''} Found`}
                    </h2>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : filteredPdfs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                        {filteredPdfs.map(pdf => (
                            <ReadingRoomBookCard key={pdf.id} pdf={pdf} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <CardContent>
                            <h3 className="text-lg font-medium">
                                {searchTerm || selectedCategory !== 'all' || selectedLanguage !== 'all' 
                                    ? 'No Documents Match Your Filters' 
                                    : 'No Documents Available'
                                }
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                {searchTerm || selectedCategory !== 'all' || selectedLanguage !== 'all' 
                                    ? 'Try adjusting your search or filter options.' 
                                    : 'Check back later for new additions to the reading room.'
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
