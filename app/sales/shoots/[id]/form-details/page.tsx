"use client";

import FormDetailsPage from "@/app/admin/shoots/[id]/form-details/page";

export default function SalesFormDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <FormDetailsPage params={params} />;
}
