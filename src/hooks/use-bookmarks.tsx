
'use client';

import { useState, useEffect, useCallback } from 'react';

const getStoredBookmarks = (key: string): string[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error(`Error reading bookmarks from localStorage for key "${key}"`, error);
        return [];
    }
};

const setStoredBookmarks = (key: string, ids: string[]) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
        console.error(`Error saving bookmarks to localStorage for key "${key}"`, error);
    }
};

export const useBookmarkStore = (storageKey: string) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  
  useEffect(() => {
    setBookmarkedIds(getStoredBookmarks(storageKey));
  }, [storageKey]);

  const addBookmark = useCallback((itemId: string) => {
    setBookmarkedIds(prev => {
        if (prev.includes(itemId)) return prev;
        const newIds = [...prev, itemId];
        setStoredBookmarks(storageKey, newIds);
        return newIds;
    });
  }, [storageKey]);

  const removeBookmark = useCallback((itemId: string) => {
    setBookmarkedIds(prev => {
        const newIds = prev.filter(id => id !== itemId);
        setStoredBookmarks(storageKey, newIds);
        return newIds;
    });
  }, [storageKey]);
  
  const isBookmarked = useCallback((itemId: string) => {
    return bookmarkedIds.includes(itemId);
  }, [bookmarkedIds]);
  
  const toggleBookmark = useCallback((itemId: string) => {
      if (isBookmarked(itemId)) {
          removeBookmark(itemId);
      } else {
          addBookmark(itemId);
      }
  }, [addBookmark, removeBookmark, isBookmarked]);

  return { bookmarkedIds, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
};
