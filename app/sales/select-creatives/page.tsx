"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import { toast } from "sonner";


export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="text-white font-sans">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
      >
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <CreativeProfileSelector />
    </div>
  );
}
