"use client";

import EditShootBookingPage from "@/app/admin/shoots/[id]/edit-booking/page";

export default function SalesEditShootBookingPage({ params }: { params: Promise<{ id: string }> }) {
  return <EditShootBookingPage params={params} />;
}
