"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { basePermissions } from "@/components/admin/roles-permissions/data";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import { PermissionMatrixRow } from "@/components/admin/roles-permissions/types";

export function RoleEditDetailsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PermissionMatrixRow[]>(basePermissions);

  return (
    <div className="overflow-hidden px-4 pb-16 pt-5 lg:px-10 lg:pb-24 lg:pt-8">
      <div className="mx-auto max-w-[1500px]">
        <Button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 bg-transparent p-0 text-white/80 hover:bg-transparent hover:text-white"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-[108px] w-[108px] items-center justify-center rounded-[24px] bg-[#F1C7E6] text-[38px] font-medium text-black">
              PC
            </div>
            <div>
              <h1 className="text-[30px] font-semibold text-white">
                Prince Carter <span className="text-[#E5D5B8]">(Admin)</span>
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[15px] text-white/60">
                <span>Created : 02/02/2026 - 2:30PM</span>
                <span className="hidden h-6 w-px bg-white/20 md:block" />
                <span>Updated : 06/03/2025 - 1:00PM</span>
              </div>
            </div>
          </div>

          <span className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-full bg-[#D4F9DB] px-5 text-[15px] font-medium text-[#1EAD52]">
            Active
          </span>
        </div>

        <PermissionMatrixTable rows={rows} onChange={setRows} className="mt-6" />

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[78px] w-full rounded-[20px] border border-white/20 bg-transparent text-[24px] font-medium text-white transition hover:border-white/35 sm:max-w-[240px]"
          >
            Back
          </button>
          <button
            type="button"
            className="h-[78px] w-full rounded-[20px] bg-[#E5D5B8] text-[24px] font-medium text-black transition hover:bg-[#d6c29b] sm:max-w-[240px]"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
