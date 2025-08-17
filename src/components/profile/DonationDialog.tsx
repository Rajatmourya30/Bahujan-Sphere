
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Landmark, Loader2 } from 'lucide-react';
// A simple PayPal-like icon
const PayPalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.1,3.4H8.4c-2.4,0-4.4,2-4.4,4.4v8.4c0,2.4,2,4.4,4.4,4.4h4.7c2.4,0,4.4-2,4.4-4.4v-3.3c0-2.4-2-4.4-4.4-4.4Z" fill="#003087"></path>
        <path d="M12.6,3.4H9.8c-2.4,0-4.4,2-4.4,4.4v8.4c0,2.4,2,4.4,4.4,4.4h2.8c2.4,0,4.4-2,4.4-4.4v-3.3c0-2.4-2-4.4-4.4-4.4Z" fill="#009cde"></path>
        <path d="M11.9,3.4H9.1c-2.4,0-4.4,2-4.4,4.4v8.4c0,2.4,2,4.4,4.4,4.4h2.8c2.4,0,4.4-2,4.4-4.4v-3.3c0-2.4-2-4.4-4.4-4.4Z" fill="#012169"></path>
    </svg>
);


interface DonationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

type PaymentMethod = 'upi' | 'card' | 'paypal';

export function DonationDialog({ isOpen, onOpenChange, userName }: DonationDialogProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [amount, setAmount] = useState('500');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleDonate = () => {
        setIsLoading(true);
        // Simulate API call to process payment
        setTimeout(() => {
            console.log({
                userName,
                amount: Number(amount),
                paymentMethod,
                timestamp: new Date().toISOString(),
            });

            toast({
                title: t('donation_dialog.toast_success_title'),
                description: t('donation_dialog.toast_success_description'),
            });
            setIsLoading(false);
            onOpenChange(false);
        }, 1500);
    };
    
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{t('donation_dialog.title')}</DialogTitle>
          <DialogDescription>{t('donation_dialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-2">
                {['100', '250', '500'].map((val) => (
                    <Button key={val} variant={amount === val ? 'default' : 'outline'} onClick={() => setAmount(val)}>
                        ₹{val}
                    </Button>
                ))}
            </div>
            <div className="space-y-2">
                <Label htmlFor="amount">{t('donation_dialog.amount_label')}</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('donation_dialog.amount_placeholder')}
                />
            </div>
             <div className="space-y-2">
                <Label>{t('donation_dialog.payment_method_label')}</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)} className="grid grid-cols-3 gap-4">
                     <div>
                        <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                        <Label htmlFor="upi" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <Landmark className="mb-2" />
                            UPI
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                        <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <CreditCard className="mb-2" />
                            Card
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
                        <Label htmlFor="paypal" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <PayPalIcon />
                            PayPal
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('donation_dialog.cancel_button')}
          </Button>
          <Button onClick={handleDonate} disabled={isLoading || !amount || Number(amount) <= 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t('donation_dialog.donating_button') : t('donation_dialog.donate_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
