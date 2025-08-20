
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { ArrowDown, Book, Calendar, Store, Users, Library, BookOpen, Bookmark as BookmarkIcon } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import Image from 'next/image';
import { collection, getDocs, limit, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KnowledgeOrganization } from '@/lib/knowledge-hub';
import { Book as BookType } from '@/lib/books';
import { CalendarEvent } from '@/lib/events';
import { BahujanStore } from '@/lib/store';
import { ReadingRoomPdf } from '@/app/admin/reading-room/page';
import { parseDate } from '@/lib/date-parser';
import { isValid, isSameDay, getMonth, getDate } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface PillarCardProps {
  icon: React.ElementType;
  title: string;
  data: string | null;
  fallback: string;
  buttonText: string;
  href: string;
  isLoading: boolean;
}

function PillarCard({ icon: Icon, title, data, fallback, buttonText, href, isLoading }: PillarCardProps) {
  const previewText = data || fallback;

  return (
    <Link href={href} className="group h-full">
      <div className="flex flex-col items-center text-center p-6 h-full rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary hover:-translate-y-1">
        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-accent/10 text-accent group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="font-headline text-lg mb-2">{title}</h3>
        <div className="text-sm text-muted-foreground mb-4 flex-grow min-h-[40px] flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="h-5 w-3/4" />
          ) : (
            <p>{previewText}</p>
          )}
        </div>
        <span className="text-sm font-medium text-primary group-hover:underline transition-colors">
          {buttonText} →
        </span>
      </div>
    </Link>
  );
}


export default function HomePage() {
  const { t } = useLanguage();
  const [userCount, setUserCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // State for dynamic pillar data
  const [todayEvent, setTodayEvent] = useState<CalendarEvent | null>(null);
  const [featuredResource, setFeaturedResource] = useState<ReadingRoomPdf | null>(null);
  const [featuredOrg, setFeaturedOrg] = useState<KnowledgeOrganization | null>(null);
  const [featuredStore, setFeaturedStore] = useState<BahujanStore | null>(null);
  const [featuredBook, setFeaturedBook] = useState<BookType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        
        // Fetch Today's Event
        const eventsQuery = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
        const eventsSnap = await getDocs(eventsQuery);
        const allEvents = eventsSnap.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);
            if (!isValid(eventDate)) return null;
            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        }).filter(Boolean) as CalendarEvent[];
        const todaysEvents = allEvents.filter(event => getMonth(event.date) === getMonth(today) && getDate(event.date) === getDate(today));
        setTodayEvent(todaysEvents.length > 0 ? todaysEvents[0] : null);

        // Fetch Featured Resource from Reading Room
        const resourceQuery = query(collection(db, 'readingRoomPdfs'), where('status', '==', 'approved'), limit(1));
        const resourceSnap = await getDocs(resourceQuery);
        if (!resourceSnap.empty) {
            setFeaturedResource({ id: resourceSnap.docs[0].id, ...resourceSnap.docs[0].data() } as ReadingRoomPdf);
        }

        // Fetch Featured Organization
        const orgQuery = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'), limit(1));
        const orgSnap = await getDocs(orgQuery);
        if (!orgSnap.empty) {
            setFeaturedOrg({ id: orgSnap.docs[0].id, ...orgSnap.docs[0].data() } as KnowledgeOrganization);
        }
        
        // Fetch Featured Store
        const storeQuery = query(collection(db, 'stores'), where('status', '==', 'approved'), limit(1));
        const storeSnap = await getDocs(storeQuery);
        if (!storeSnap.empty) {
            setFeaturedStore({ id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() } as BahujanStore);
        }

        // Fetch Featured Book
        const bookQuery = query(collection(db, 'books'), where('status', '==', 'approved'), limit(1));
        const bookSnap = await getDocs(bookQuery);
        if (!bookSnap.empty) {
            setFeaturedBook({ id: bookSnap.docs[0].id, ...bookSnap.docs[0].data() } as BookType);
        }

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
    const element = document.getElementById('pillars');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const pillarData = {
    calendar: todayEvent ? `Today: ${todayEvent.title}` : null,
    readingRoom: featuredResource ? `Featured: ${featuredResource.title}` : null,
    knowledge: featuredOrg ? `Featured: ${t(featuredOrg.nameKey)}` : null,
    store: featuredStore ? `From: ${t(featuredStore.nameKey)}` : null,
    books: featuredBook ? `Book of the Week: ${t(featuredBook.titleKey)}` : null,
  };

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Section 1: Hero */}
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <Image src="https://placehold.co/1200x600.png" alt="Bahujan Community" fill className="object-cover" data-ai-hint="community celebration" />
        <div className="relative container z-20">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mt-4">Your Trusted Source for Bahujan Heritage.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore a curated calendar of history, a digital library, a community directory, a creators' marketplace, and essential books.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleScroll}>
              Explore Everything <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2: The Five Pillars */}
      <section id="pillars" className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <PillarCard 
                icon={Calendar} 
                title="Calendar"
                data={pillarData.calendar}
                fallback="Explore historical events"
                buttonText="Explore Calendar"
                href="/calendar"
                isLoading={isLoading}
            />
             <PillarCard 
                icon={BookOpen} 
                title="Reading Room"
                data={pillarData.readingRoom}
                fallback="Discover our archives"
                buttonText="Enter Reading Room"
                href="/reading-room"
                isLoading={isLoading}
            />
            <PillarCard 
                icon={Library} 
                title="Knowledge Hub"
                data={pillarData.knowledge}
                fallback="Find community organizations"
                buttonText="Discover Knowledge"
                href="/knowledge-hub"
                isLoading={isLoading}
            />
            <PillarCard 
                icon={Store} 
                title="Store"
                data={pillarData.store}
                fallback="Support creators"
                buttonText="Visit Store"
                href="/store"
                isLoading={isLoading}
            />
            <PillarCard 
                icon={BookmarkIcon} 
                title="Books"
                data={pillarData.books}
                fallback="Find essential readings"
                buttonText="Browse Books"
                href="/books"
                isLoading={isLoading}
            />
        </div>
      </section>

      {/* Section 3: Call to Sign Up */}
      <section className="bg-muted py-16">
        <div className="container text-center">
            <h2 className="font-headline text-3xl font-bold">Make This Your Own</h2>
            <div className="mt-6 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Never miss a date</span> – Bookmark events and get reminders.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Build your library</span> – Save articles and book lists for later.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Support directly</span> – Easily track your purchases and wishlists.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Deepen your knowledge</span> – Curate your personal learning journey.</p>
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
