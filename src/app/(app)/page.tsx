
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { ArrowRight, Book, Calendar, Store, Users } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import Image from 'next/image';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KnowledgeOrganization } from '@/lib/knowledge-hub';
import { Book as BookType } from '@/lib/books';
import { CalendarEvent } from '@/lib/events';
import { parseDate } from '@/lib/date-parser';
import { isValid, isSameDay } from 'date-fns';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


function ValuePropositionCard({ icon: Icon, title, description, linkText, href, children }: { icon: React.ElementType, title: string, description: string, linkText: string, href: string, children: React.ReactNode }) {
  return (
    <Card className="flex flex-col text-center">
      <CardHeader className="items-center">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center items-center p-4 min-h-[100px] bg-muted/50">
        {children}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href={href}>
            {linkText} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function FeaturedContentCard({ item, type }: { item: any, type: 'event' | 'book' | 'org' }) {
    const { t } = useLanguage();
    let title, description, imageUrl, href, ctaText;

    switch (type) {
        case 'event':
            title = item.title;
            description = item.summary;
            imageUrl = 'https://placehold.co/600x400.png';
            href = `/calendar`;
            ctaText = 'View Event';
            break;
        case 'book':
            title = t(item.titleKey);
            description = t(item.descriptionKey);
            imageUrl = item.imageUrl;
            href = `/books`;
            ctaText = 'Explore Books';
            break;
        case 'org':
            title = t(item.nameKey);
            description = t(item.descriptionKey);
            imageUrl = item.logoUrl;
            href = `/knowledge-hub`;
            ctaText = 'Learn More';
            break;
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <Image src={imageUrl} alt={title} fill className="object-cover" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardTitle className="font-headline text-lg line-clamp-2">{title}</CardTitle>
                <CardDescription className="mt-2 text-sm line-clamp-3">{description}</CardDescription>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={href}>
                        {ctaText}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function HomePage() {
  const { t } = useLanguage();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [featuredOrgs, setFeaturedOrgs] = useState<KnowledgeOrganization[]>([]);
  const [featuredBook, setFeaturedBook] = useState<BookType | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  
  const today = new Date();

  useEffect(() => {
    const fetchData = async () => {
        // Fetch Today's Events
        const eventsQuery = query(collection(db, 'calendarEvents'), where('status', '==', 'approved'));
        const eventsSnap = await getDocs(eventsQuery);
        const allEvents = eventsSnap.docs.map(doc => {
            const data = doc.data();
            const eventDate = parseDate(data.date);
            if (!isValid(eventDate)) return null;
            return { id: doc.id, ...data, date: eventDate } as CalendarEvent;
        }).filter(Boolean) as CalendarEvent[];
        setTodayEvents(allEvents.filter(event => isSameDay(event.date, today)));

        // Fetch Featured Orgs
        const orgsQuery = query(collection(db, 'knowledgeHub'), where('status', '==', 'approved'), limit(3));
        const orgsSnap = await getDocs(orgsQuery);
        setFeaturedOrgs(orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeOrganization)));

        // Fetch Featured Book
        const booksQuery = query(collection(db, 'books'), where('status', '==', 'approved'), limit(1));
        const booksSnap = await getDocs(booksQuery);
        if (!booksSnap.empty) {
            setFeaturedBook({ id: booksSnap.docs[0].id, ...booksSnap.docs[0].data() } as BookType);
        }
        
        // Fetch User Count
        const usersSnap = await getDocs(collection(db, 'users'));
        setUserCount(usersSnap.size);
    };
    fetchData();
  }, []);

  const featuredContent = [
      ...todayEvents.slice(0, 1).map(item => ({ type: 'event' as const, data: item })),
      ...(featuredBook ? [{ type: 'book' as const, data: featuredBook }] : []),
      ...featuredOrgs.slice(0, 1).map(item => ({ type: 'org' as const, data: item }))
  ];

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Section 1: Hero */}
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <Image src="https://placehold.co/1200x600.png" alt="Bahujan Community" fill className="object-cover" data-ai-hint="community celebration" />
        <div className="relative container z-20">
          <div className="flex justify-center items-center gap-2">
            <Logo className="h-12 w-12" />
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-bold mt-4">Discover, Celebrate, and Strengthen Bahujan Heritage.</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our historical calendar, digital library, and marketplace supporting community creators.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/calendar">Explore the Calendar</Link>
            </Button>
            <Button asChild variant="link" size="lg" className="text-foreground">
              <Link href="#value-prop">Learn More ▼</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2: Value Proposition */}
      <section id="value-prop" className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValuePropositionCard icon={Calendar} title="Our Living History" description="Discover significant events from Bahujan history, culture, and resistance." linkText="Browse Full Calendar" href="/calendar">
                <div className="font-bold text-primary text-5xl">{today.getDate()}</div>
                <div className="font-semibold text-lg">{today.toLocaleString('default', { month: 'long' })}</div>
                {todayEvents.length > 0 ? (
                    <p className="text-sm mt-1">Today in History: {todayEvents[0].title}</p>
                ): (
                    <p className="text-sm mt-1 text-muted-foreground">No major events today.</p>
                )}
            </ValuePropositionCard>
             <ValuePropositionCard icon={Store} title="Community Directory" description="Connect with and support organizations dedicated to empowerment." linkText="Discover Organizations" href="/knowledge-hub">
               <div className="flex items-center justify-center gap-4">
                    {featuredOrgs.map(org => (
                        <div key={org.id} className="relative h-12 w-12 rounded-full border bg-background p-1">
                            <Image src={org.logoUrl} alt={t(org.nameKey)} fill className="object-contain" />
                        </div>
                    ))}
               </div>
            </ValuePropositionCard>
            <ValuePropositionCard icon={Book} title="Support Creators" description="Find books and products from Bahujan creators and businesses." linkText="Explore the Store" href="/store">
                 {featuredBook && (
                    <div className="relative h-24 w-20">
                         <Image src={featuredBook.imageUrl} alt={t(featuredBook.titleKey)} fill className="object-cover rounded" />
                    </div>
                )}
            </ValuePropositionCard>
        </div>
      </section>

      {/* Section 3: Featured Content */}
      <section className="container">
         <h2 className="font-headline text-3xl font-bold text-center">From Our Community</h2>
         <p className="text-muted-foreground text-center mt-2">The latest and most important content from across BahujanSphere.</p>
         <div className="mt-8">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                    {featuredContent.map((item, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1 h-full">
                                <FeaturedContentCard item={item.data} type={item.type} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
         </div>
      </section>
      
      {/* Section 4: Call to Sign Up */}
      <section className="bg-muted py-16">
        <div className="container text-center">
            <h2 className="font-headline text-3xl font-bold">Join Your Digital Commons</h2>
            <div className="mt-6 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Bookmark events</span> and articles for later.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Get reminders</span> for important anniversaries.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Build your personal wishlist</span> of books.</p>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-primary">✓</span>
                    <p><span className="font-semibold">Contribute</span> to our growing knowledge base.</p>
                </div>
            </div>
            <Button asChild size="lg" className="mt-8">
                <Link href="/signup">Create Your Free Account</Link>
            </Button>
            {userCount > 0 && (
                <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                   <Users className="h-4 w-4" /> Joined by over {userCount} community members.
                </p>
            )}
        </div>
      </section>

    </div>
  );
}
