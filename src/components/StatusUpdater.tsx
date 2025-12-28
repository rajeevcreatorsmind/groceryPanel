// components/StatusUpdater.tsx
'use client';

import { useEffect } from 'react';
import { startAutoStatusUpdates } from '@/lib/autoStatusUpdater';

export default function StatusUpdater() {
  useEffect(() => {
    // Start auto updates every 30 minutes
    const interval = startAutoStatusUpdates(30);
    
    // Cleanup on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}