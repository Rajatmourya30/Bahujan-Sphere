
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { ArrowDown, Book, Calendar, Store, Users, Library, BookOpen, Bookmark as BookmarkIcon, Building2, ShoppingBag, LibraryBig } from 'lucide-react';
import Image from 'next/image';
import { collection, getDocs, limit, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KnowledgeOrganization } from '@/lib/knowledge-hub';
import { Book as BookType } from '@/lib/books';
import { CalendarEvent } from '@/lib/events';
import { BahujanStore } from '@/lib/store';
import { ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { parseDate } from '@/lib/date-parser';
import { isValid, isSameDay, getMonth, getDate, subDays, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { useBookmarkStore } from '@/hooks/use-bookmarks';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

function ContentCard({ item, type }: { item: any, type: 'readingRoom' | 'store' | 'book' }) {
    const { t } = useLanguage();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { isBookmarked, toggleBookmark } = useBookmarkStore('bookBookmarks');

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAuthenticated) {
            toggleBookmark(item.id);
        } else {
            router.push('/login');
        }
    };

    let title, imageUrl, link, subText, imageAiHint;

    switch(type) {
        case 'readingRoom':
            title = item.title;
            imageUrl = item.coverImageUrl || 'https://placehold.co/400x600.png';
            link = `/reading-room/${item.id}`;
            subText = item.author || `Uploaded on ${item.uploadedAt.toDate().toLocaleDateString()}`;
            imageAiHint = "book cover";
            break;
        case 'store':
            title = t(item.nameKey);
            imageUrl = item.imageUrl;
            link = item.storeUrl;
            subText = t(item.descriptionKey);
            imageAiHint = item.imageAiHint;
            break;
        case 'book':
            title = t(item.titleKey);
            imageUrl = item.imageUrl;
            link = item.affiliateUrl;
            subText = t(item.authorKey);
            imageAiHint = item.imageAiHint;
            break;
    }

    return (
        <Link href={link} target={type === 'store' || type === 'book' ? '_blank' : '_self'} className="group block">
            <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-0">
                    <div className="relative aspect-[3/4] w-full">
                        <Image src={imageUrl} alt={title} fill className="object-cover" data-ai-hint={imageAiHint} />
                        {type === 'book' && (
                             <button
                                onClick={handleBookmarkClick}
                                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/70 backdrop-blur-sm transition-colors hover:bg-background"
                                aria-label="Bookmark this book"
                            >
                                <BookmarkIcon className={cn("h-5 w-5 text-muted-foreground transition-all", isAuthenticated && isBookmarked(item.id) ? "fill-primary text-primary" : "")} />
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                        <p className="font-headline text-base font-semibold truncate">{title}</p>
                        <p className="text-sm text-muted-foreground truncate">{subText}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}


export default function HomePage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // State for dynamic pillar data
  const [dailyEvents, setDailyEvents] = useState<{ yesterday: CalendarEvent[], today: CalendarEvent[], tomorrow: CalendarEvent[] }>({ yesterday: [], today: [], tomorrow: [] });
  const [recentResources, setRecentResources] = useState<ReadingRoomPdf[]>([]);
  const [recentOrgs, setRecentOrgs] = useState<KnowledgeOrganization[]>([]);
  const [recentStores, setRecentStores] = useState<BahujanStore[]>([]);
  const [essentialBooks, setEssentialBooks] = useState<BookType[]>([]);
  const [userCount, setUserCount] = useState<number>(0);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const yesterday = subDays(today, 1);
        const tomorrow = addDays(today, 1);
        
        // Fetch All Approved Events
        const eventsQuery = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
        const eventsSnap = await getDocs(eventsQuery);
        const allEvents = eventsSnap.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);
            if (!isValid(eventDate)) return null;
            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        }).filter(Boolean) as CalendarEvent[];
        
        setDailyEvents({
            yesterday: allEvents.filter(e => getMonth(e.date) === getMonth(yesterday) && getDate(e.date) === getDate(yesterday)),
            today: allEvents.filter(e => getMonth(e.date) === getMonth(today) && getDate(e.date) === getDate(today)),
            tomorrow: allEvents.filter(e => getMonth(e.date) === getMonth(tomorrow) && getDate(e.date) === getDate(tomorrow)),
        });

        // Fetch Recent Resources
        const resourcesQuery = query(collection(db, 'readingRoomPdfs'), where('status', '==', 'approved'), orderBy('uploadedAt', 'desc'), limit(5));
        const resourcesSnap = await getDocs(resourcesQuery);
        setRecentResources(resourcesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingRoomPdf)));

        // Fetch Recent Organizations
        const orgsQuery = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'), limit(4)); // Limit to 4 for the grid
        const orgsSnap = await getDocs(orgsQuery);
        setRecentOrgs(orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization)));

        // Fetch Recent Stores
        const storesQuery = query(collection(db, 'stores'), where('status', '==', 'approved'), limit(5));
        const storesSnap = await getDocs(storesQuery);
        setRecentStores(storesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BahujanStore)));

        // Fetch Essential Books
        const booksQuery = query(collection(db, 'books'), where('status', '==', 'approved'), limit(5));
        const booksSnap = await getDocs(booksQuery);
        setEssentialBooks(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookType)));
        
        // Fetch User Count
        const usersSnap = await getDocs(collection(db, 'users'));
        setUserCount(usersSnap.size);

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [t]);
  
  const handleScroll = () => {
    const element = document.getElementById('dashboard-start');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const renderEventLinks = (events: CalendarEvent[]) => {
      if (isLoading) return <Skeleton className="h-5 w-3/4" />;
      if (events.length === 0) return <p className="text-sm text-muted-foreground italic">No events scheduled for this day.</p>;
      return events.map((event, index) => (
          <Link href={`/calendar`} key={event.id} className="text-sm hover:underline text-primary">
              {event.title}{index < events.length - 1 ? ', ' : ''}
          </Link>
      ));
  }
  
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Section 1: Hero */}
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <Image src="https://placehold.co/1200x600.png" alt="Bahujan Community" fill className="object-cover" data-ai-hint="community celebration" />
        <div className="relative container z-20">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mt-4">Your Daily Connection to Bahujan Heritage.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore history, discover knowledge, support creators, and deepen your understanding—all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleScroll}>
              Explore Everything <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2: On This Day */}
      <section id="dashboard-start" className="container">
        <h2 className="font-headline text-3xl font-bold text-center mb-8">On This Day</h2>
        <Card className="shadow-lg">
            <CardContent className="p-0">
                 <div className="grid grid-cols-1 md:grid-cols-4">
                    <div className="p-6 space-y-2 border-b md:border-b-0 md:border-r">
                        <h3 className="font-semibold text-muted-foreground">Yesterday</h3>
                        <div className="flex flex-wrap gap-x-2">{renderEventLinks(dailyEvents.yesterday)}</div>
                    </div>
                    <div className="p-6 space-y-2 col-span-1 md:col-span-2 bg-muted/50 border-b md:border-b-0 md:border-r">
                        <h3 className="font-headline text-xl font-bold">Today</h3>
                        <div className="flex flex-wrap gap-x-2">{renderEventLinks(dailyEvents.today)}</div>
                    </div>
                    <div className="p-6 space-y-2">
                        <h3 className="font-semibold text-muted-foreground">Tomorrow</h3>
                        <div className="flex flex-wrap gap-x-2">{renderEventLinks(dailyEvents.tomorrow)}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </section>

      {/* Section 3: Recently Added to Reading Room */}
      <section className="container">
         <h2 className="font-headline text-3xl font-bold mb-6">Recently Added to the Reading Room</h2>
         <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-4">
                {isLoading ? Array.from({length: 5}).map((_, i) => <CarouselItem key={i} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"><Skeleton className="h-64 w-full" /></CarouselItem>)
                : recentResources.map(item => (
                    <CarouselItem key={item.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <ContentCard item={item} type="readingRoom" />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>

      {/* Section 4: Newly Listed Organizations */}
      <section className="container">
        <h2 className="font-headline text-3xl font-bold mb-6">Newly Listed Organizations</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {isLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
             : recentOrgs.map(org => (
                 <Link href={org.websiteUrl} target="_blank" key={org.id} className="group">
                    <Card className="h-full flex items-center justify-center p-4 transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="relative h-20 w-full">
                            <Image src={org.logoUrl} alt={t(org.nameKey)} fill className="object-contain" data-ai-hint={org.imageAiHint} />
                        </div>
                    </Card>
                 </Link>
             ))}
         </div>
      </section>

      {/* Section 5: Latest from Our Sellers */}
      <section className="container">
         <h2 className="font-headline text-3xl font-bold mb-6">Latest from Our Sellers</h2>
         <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-4">
                 {isLoading ? Array.from({length: 5}).map((_, i) => <CarouselItem key={i} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"><Skeleton className="h-64 w-full" /></CarouselItem>)
                : recentStores.map(item => (
                    <CarouselItem key={item.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <ContentCard item={item} type="store" />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>

      {/* Section 6: Essential Reads */}
      <section className="container">
         <h2 className="font-headline text-3xl font-bold mb-6">Essential Reads</h2>
         <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-4">
                 {isLoading ? Array.from({length: 5}).map((_, i) => <CarouselItem key={i} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"><Skeleton className="h-64 w-full" /></CarouselItem>)
                : essentialBooks.map(item => (
                    <CarouselItem key={item.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <ContentCard item={item} type="book" />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
      </section>

      {/* Section 7: Call to Sign Up */}
      <section className="bg-muted py-16">
        <div className="container text-center">
            <h2 className="font-headline text-3xl font-bold">Ready to Make This Your Own?</h2>
            <div className="mt-6 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Get personalized reminders</span> for events you care about.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Build your personal library</span> by saving books and articles.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Support creators</span> and track your purchases.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Curate your own learning journey.</span></p>
                </div>
            </div>
            <Button asChild size="lg" className="mt-8">
                <Link href="/signup">Create Your Free Account</Link>
            </Button>
            {userCount > 0 && (
                 <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                   <Users className="h-4 w-4" /> Trusted by {isLoading ? <Skeleton className="w-8 h-4" /> : userCount} learners and supporters.
                </p>
            )}
        </div>
      </section>
    </div>
  );
}
