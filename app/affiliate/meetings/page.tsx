"use client";

import React from "react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import AffiliateMeetings from "@/components/affiliate/AffiliateMeetings";

export default function AffiliateMeetingsPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <AffiliateMeetings />
    </>
  );
}
