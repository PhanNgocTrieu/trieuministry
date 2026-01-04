"use client";

import { useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

export function useTrackVisit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const trackVisit = async () => {
      // Check if we've already tracked this session
      const sessionKey = 'visit_tracked_' + new Date().toDateString();
      if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
        return;
      }

      try {
        const statsRef = doc(db, 'stats', 'general');
        // Check if doc exists first (optional, but good for first run)
        // For atomic increment, updateDoc is best if doc exists.
        // setDoc with merge: true works for both creating and updating
        
        await setDoc(statsRef, {
            totalVisits: increment(1)
        }, { merge: true });

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(sessionKey, 'true');
        }
      } catch (error) {
        console.error("Error tracking visit:", error);
      }
    };

    trackVisit();
  }, []);
}
