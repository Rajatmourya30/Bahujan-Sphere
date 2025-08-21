
'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginPromptDialog } from '@/components/shared/LoginPromptDialog';

export function useAuthAction() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthChecked(true);
        });
        return () => unsubscribe();
    }, []);

    const performAction = useCallback((action: () => void) => {
        if (!isAuthChecked) {
            // Still checking auth, do nothing for now to prevent premature actions
            return;
        }
        if (user) {
            action();
        } else {
            setIsPromptOpen(true);
        }
    }, [user, isAuthChecked]);

    const AuthActionPrompt = () => (
        <LoginPromptDialog isOpen={isPromptOpen} onOpenChange={setIsPromptOpen} />
    );
    
    return { performAction, AuthActionPrompt, isAuthenticated: !!user, isAuthChecked };
}
