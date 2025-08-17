
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import type { CalendarEvent } from '@/lib/events';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventDetailModalProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: t(event.titleKey),
      text: t(event.descriptionKey).substring(0, 280) + '...', // Keep it concise for sharing
      url: event.readMoreUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
            title: t('event_modal.share_success_title'),
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
        toast({
            title: t('event_modal.share_not_supported_title'),
            description: t('event_modal.share_not_supported_description'),
            variant: 'destructive',
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl shadow-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t(event.titleKey)}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4">
          <p className="text-muted-foreground">{t(event.descriptionKey)}</p>
        </ScrollArea>
        
        {/* Placeholder for banner ad */}
        <div className="my-4 flex h-24 items-center justify-center rounded-md border-2 border-dashed bg-muted/50">
            <span className="text-sm text-muted-foreground">{t('event_modal.ad_placeholder')}</span>
        </div>

        <DialogFooter className="flex-col-reverse items-center gap-2 sm:flex-row sm:justify-between sm:gap-0">
          <p className="text-xs text-muted-foreground">{t('event_modal.powered_by')}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{t('event_modal.share_button')}</span>
            </Button>
            <Button asChild>
                <Link href={event.readMoreUrl} target="_blank" onClick={onClose}>
                {t('event_calendar.read_full_article_button')}
                </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
