
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { Heart, ExternalLink } from 'lucide-react';

interface DonationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

export function DonationDialog({ isOpen, onOpenChange, userName }: DonationDialogProps) {
    const { t } = useLanguage();
    const router = useRouter();
    
    const handleGoToDonationPage = () => {
        onOpenChange(false);
        router.push('/donate');
    };
    
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Support Our Cause
          </DialogTitle>
          <DialogDescription>
            Thank you for considering a donation, {userName}! Your support helps us continue our mission to serve the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We have a comprehensive donation system with multiple payment options including UPI, bank transfer, and QR codes.
            </p>
            <p className="text-sm font-medium">
              Click below to access our full donation page with all available payment methods.
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGoToDonationPage} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Go to Donation Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
