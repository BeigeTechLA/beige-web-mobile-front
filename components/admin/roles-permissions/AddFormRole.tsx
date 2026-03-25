"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// Using your existing UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCheckbox } from "@/app/admin/roles-permissions/page";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

interface PermissionRow {
  id: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const initialPermissions: PermissionRow[] = [
  { id: "dashboard", label: "Dashboard", view: false, create: false, edit: false, delete: false },
  { id: "shoots", label: "Shoots", view: false, create: false, edit: false, delete: false },
  { id: "file_manager", label: "File Manager", view: false, create: false, edit: false, delete: false },
  { id: "messages", label: "Messages", view: false, create: false, edit: false, delete: false },
  { id: "availability", label: "Availability", view: false, create: false, edit: false, delete: false },
  { id: "meetings", label: "Meetings", view: false, create: false, edit: false, delete: false },
  { id: "studios", label: "Studios", view: false, create: false, edit: false, delete: false },
  { id: "sales_rep", label: "Sales Representative", view: false, create: false, edit: false, delete: false },
  { id: "users", label: "Users", view: false, create: false, edit: false, delete: false },
];

export default function AddRoleForm() {
      const router = useRouter();
    
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  // --- LOGIC ---
  const togglePermission = (rowId: string, field: keyof Omit<PermissionRow, "id" | "label">) => {
    setPermissions((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: !row[field] } : row))
    );
  };

  const toggleRowSelect = (rowId: string) => {
    setPermissions((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const isFull = row.view && row.create && row.edit && row.delete;
          return { ...row, view: !isFull, create: !isFull, edit: !isFull, delete: !isFull };
        }
        return row;
      })
    );
  };

  const toggleSelectAll = () => {
    const isAllChecked = permissions.every(p => p.view && p.create && p.edit && p.delete);
    setPermissions(prev => prev.map(row => ({
      ...row, view: !isAllChecked, create: !isAllChecked, edit: !isAllChecked, delete: !isAllChecked
    })));
  };

  const allSelected = permissions.every(p => p.view && p.create && p.edit && p.delete);

  return (
    <div className="space-y-10">
      {/* --- ROLE INFO SECTION --- */}
      <div className="space-y-8 px-2">
        <div className="relative">
          <Label className={`absolute -top-3 left-4 px-2 text-sm z-10 ${isDark ? "bg-[#000] text-white/60" : "bg-[#F4F5F7]"}`}>
            Enter Role Name
          </Label>
{/* 1. ROLE NAME INPUT */}
<div className="relative group">
  <Label 
    className="absolute -top-3 left-4 px-2 text-sm z-10 transition-colors duration-200 
    bg-[#000] text-white/40 group-focus-within:text-white"
  >
    Enter Role Name
  </Label>
  <input
            className="w-full rounded-[12px] border border-white/30 p-4 pt-6 text-white outline-none focus:border-white/60 transition-all resize-none bg-[#000] text-sm lg:text-base"
          />
</div>

{/* 2. DESCRIPTION TEXTAREA */}
<div className="relative group mt-8">
  <Label 
    className="absolute -top-3 left-4 px-2 text-sm z-10 transition-colors duration-200 
    bg-[#000] text-white/40 group-focus-within:text-white"
  >
    Description
  </Label>
  <textarea
           
            className="bg-[#000] w-full h-[120px] lg:h-[160px] xl:h-[300px] rounded-[12px] border border-white/30 p-4 pt-6 text-white outline-none focus:border-white/60 transition-all resize-none  text-sm lg:text-base"
          />
</div>
        </div>
      </div>

      {/* --- PERMISSIONS TABLE SECTION --- */}
      <div className={`w-full rounded-2xl border overflow-hidden flex flex-col ${isDark ? "bg-[#141414] border-white/5" : "bg-white"}`}>
        
        {/* HEADER TOOLBAR (Matches All Users header) */}
        <div className={`p-6 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6]"}`}>
          <div className="flex items-center gap-3">
            <div className="w-[4px] h-6 bg-[#E5D5B8] rounded-full" />
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Feature Permissions</h3>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#101010]">
            <tr className="text-sm font-medium text-[#E8D1AB]">
            <th className="py-5 px-6 w-12">
                  <CustomCheckbox checked={allSelected} onClick={toggleSelectAll} />
                </th>
                <th className="py-5 px-4  tracking-wider text-xs">Access To</th>
                <th className="py-5 px-4 text-center  ">View Access</th>
                <th className="py-5 px-4 text-center ">Create Access</th>
                <th className="py-5 px-4 text-center">Edit Access</th>
                <th className="py-5 px-4 text-center ">Delete Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {permissions.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 px-6">
                    <CustomCheckbox 
                      checked={row.view && row.create && row.edit && row.delete} 
                      onClick={() => toggleRowSelect(row.id)} 
                    />
                  </td>
                  <td className="py-5 px-4">
                    <p className="text-sm font-semibold text-white">{row.label}</p>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center">
                      <CustomCheckbox checked={row.view} onClick={() => togglePermission(row.id, "view")} />
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center">
                      <CustomCheckbox checked={row.create} onClick={() => togglePermission(row.id, "create")} />
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center">
                      <CustomCheckbox checked={row.edit} onClick={() => togglePermission(row.id, "edit")} />
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex justify-center">
                      <CustomCheckbox checked={row.delete} onClick={() => togglePermission(row.id, "delete")} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex gap-4 pt-4 pb-20">
        <Button 
           onClick={() => router.back()}

        className={`h-14 lg:h-[72px] border border-[#8E8E8E] bg-transparent text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] hover:bg-white/5`}>
          Back
        </Button>
        <Button className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]">
          Save
        </Button>
      </div>
    </div>
  );
}