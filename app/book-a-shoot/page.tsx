"use client";

import React, { useState, useEffect } from "react";
import { useBookingFlowVersion } from "@/lib/hooks/useBookingFlowVersion";
import { BookAShootV3 } from "@/components/book-a-shoot/v3/BookAShootV3";
import { BookAShootV4 } from "@/components/book-a-shoot/v4/BookAShootV4";
import { BookAShootV2 } from "@/components/book-a-shoot/BookAShootV2";

export default function BookAShootPage() {
  // const isV3 = useBookingFlowVersion();
  const version = useBookingFlowVersion();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering after mount on client
  // or accept the initial render might be V2 or V3 based on env
  // For smoothest UX, we want to render the correct one immediately if possible.
  // useBookingFlowVersion initializes with process.env, so it should match server render if env is consistent.
  // The only issue is if window logic changes it. 
  
  if (!mounted) {
      // Return V3 if env is true to match server, or null to wait for client
      // Returning null avoids mismatch but causes CLS. 
      // Returning isV3 based logic is fine if isV3 initial state matches server.
      // initial state of useBookingFlowVersion is based on process.env.
      // So if process.env is consistent, this is fine.
  }

  console.log("Booking Flow Version:", version);
  if (version === "v3") {
    return <BookAShootV3 />;
  }

  if (version === "v4") {
    return <BookAShootV4 />;
  }


  return <BookAShootV2 />;
}
