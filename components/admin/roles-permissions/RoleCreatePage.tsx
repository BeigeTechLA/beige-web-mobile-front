"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { basePermissions } from "@/components/admin/roles-permissions/data";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import { PermissionMatrixRow } from "@/components/admin/roles-permissions/types";

export function RoleCreatePage() {
  const router = useRouter();
  const [rows, setRows] = useState<PermissionMatrixRow[]>(basePermissions);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="overflow-hidden px-4 pb-16 pt-5 lg:px-10 lg:pb-24 lg:pt-8">
      <div className="mx-auto max-w-[1500px]">
        <Button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 bg-transparent p-0 text-white/80 hover:bg-transparent hover:text-white"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <h1 className="text-[30px] font-semibold text-white">Add Roles</h1>
        <p className="mt-2 text-[15px] text-white/60">
          Create roles to manage permissions and control what users can access on
          the platform.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-3 block text-[18px] text-white/70">Enter Role Name</span>
            <input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              className="h-[92px] w-full rounded-[22px] border border-white/16 bg-[#101010] px-8 text-xl text-white outline-none transition focus:border-[#E5D5B8]"
            />
          </label>

          <label className="block">
            <span className="mb-3 block text-[18px] text-white/70">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[220px] w-full rounded-[22px] border border-white/16 bg-[#101010] px-8 py-7 text-lg text-white outline-none transition focus:border-[#E5D5B8]"
            />
          </label>
        </div>

        <PermissionMatrixTable
          rows={rows}
          onChange={setRows}
          showSelectionColumn
          className="mt-6"
        />

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
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
