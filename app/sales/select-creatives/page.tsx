"use client";

import React, { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";


export default function ClientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
  <>
    <Topbar pathname={pathname}
      actions={
        <>
          <div className="flex gap-3">
            <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
              <Video size={16} />
              <span>Videographer(s) : 02/06</span>
            </div>
            <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
              <Camera size={16} />
              <span>Photographers(s) : 02/06</span>
            </div>
          </div>

          <Button onClick={() => router.push("/admin/sales-representative/create-new-deal")} className="h-12 px-4 lg:px-7 bg-[#E5D5B8] text-black">
            Assign (count) CPs
          </Button>
        </>
      }
    />

    <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans">
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
  </>
  );
}
