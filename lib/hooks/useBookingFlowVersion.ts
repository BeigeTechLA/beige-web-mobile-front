import { useState, useEffect } from 'react';

export function useBookingFlowVersion() {
  const [isV3, setIsV3] = useState(() => {
    // Initialize state directly from env to match server render
    // This assumes process.env is available during SSR
    return process.env.NEXT_PUBLIC_BOOKING_FLOW_V3 === 'true';
  });

  useEffect(() => {
    // Only check query params on client side effect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlOverride = urlParams.get('v3');
      
      if (urlOverride === 'true') {
        setIsV3(true);
      } else if (urlOverride === 'false') {
        setIsV3(false);
      }
    }
  }, []);

  return isV3;
}
