"use client";

import React, { useState, useEffect } from "react";
import { useBookingFlowVersion } from "@/lib/hooks/useBookingFlowVersion";
import { BookAShootV4 } from "@/components/book-a-shoot/v4/BookAShootV4";
import { BookAShootV3 } from "@/components/book-a-shoot/v3/BookAShootV3";
import { BookAShootV2 } from "@/components/book-a-shoot/BookAShootV2";

export default function BookAShootPage() {
  const isV3 = useBookingFlowVersion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use V4 booking flow as primary
  return <BookAShootV4 />;
}

