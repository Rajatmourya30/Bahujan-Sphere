
'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

interface LoginPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptDialog({ isOpen, onOpenChange }: LoginPromptDialogProps) {
    const { t } = useLanguage();

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('login_prompt.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('login_prompt.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline">{t('login_prompt.cancel_button')}</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/login">
                            <Button>{t('login_prompt.login_button')}</Button>
                        </Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
