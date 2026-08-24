import { useState, useEffect } from 'react';

export function useBookingFlowVersion() {
  const [isV3, setIsV3] = useState(() => {
    // Initialize state directly from env to match server render
    // This assumes process.env is available during SSR
    return process.env.NEXT_PUBLIC_BOOKING_FLOW_V3 === 'true';
  });

  const [isV4, setIsV4] = useState(() => {
    // Initialize state directly from env to match server render
    // This assumes process.env is available during SSR
    return process.env.NEXT_PUBLIC_BOOKING_FLOW_V4 === 'true';
  });

  useEffect(() => {
    // Only check query params on client side effect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      // const urlOverride = urlParams.get('v3');
      const urlOverride = urlParams.get('v4');

      console.log(urlParams, urlOverride);
      
      if (urlOverride === 'true') {
        // setIsV3(true);
        setIsV4(true);
      } else if (urlOverride === 'false') {
        // setIsV3(false);
        setIsV3(true);
      }
    }
  }, []);

  // return isV3;
  return isV3 ? "v3": "v4";
}
