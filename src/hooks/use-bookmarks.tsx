
'use client';

import { useState, useEffect, useCallback } from 'react';

const BOOKMARKS_STORAGE_KEY = 'bahujanSphereBookmarks';

const getStoredBookmarks = (): string[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading bookmarks from localStorage', error);
        return [];
    }
};

export const useBookmarks = () => {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  
  useEffect(() => {
    setBookmarkedIds(getStoredBookmarks());
  }, []);

  const setStoredBookmarks = (ids: string[]) => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Error saving bookmarks to localStorage', error);
    }
  };

  const addBookmark = useCallback((eventId: string) => {
    setBookmarkedIds(prev => {
        const newIds = [...prev, eventId];
        setStoredBookmarks(newIds);
        return newIds;
    });
  }, []);

  const removeBookmark = useCallback((eventId: string) => {
    setBookmarkedIds(prev => {
        const newIds = prev.filter(id => id !== eventId);
        setStoredBookmarks(newIds);
        return newIds;
    });
  }, []);
  
  const isBookmarked = useCallback((eventId: string) => {
    return bookmarkedIds.includes(eventId);
  }, [bookmarkedIds]);
  
  const toggleBookmark = useCallback((eventId: string) => {
      if (isBookmarked(eventId)) {
          removeBookmark(eventId);
      } else {
          addBookmark(eventId);
      }
  }, [addBookmark, removeBookmark, isBookmarked]);

  return { bookmarkedIds, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
};
