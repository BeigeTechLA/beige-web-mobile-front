"use client";

import ShootDetailsView from "@/components/admin/ShootDetailsView";
import { use } from "react";

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ShootDetailsView id={id} />;
}