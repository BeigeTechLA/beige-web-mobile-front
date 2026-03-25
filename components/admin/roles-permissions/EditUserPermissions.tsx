"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

// Using your existing UI components
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/app/admin/roles-permissions/page";
import { USERS_DATA } from "@/app/admin/roles-permissions/page";

interface User {
  id: number;
  name: string;
  role: string;
  created: string;
  updated: string;
  status: string;
  type: string;
  avatar: string;
  color?: string;
}

interface PermissionRow {
  id: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

// All values set to false by default
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

export default function EditUserPermissionsPage() {
  const router = useRouter();
  const { id } = useParams();
  const isDark = true; 

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);

  useEffect(() => {
    const fetchUserDetails = () => {
      setLoading(true);
      const foundUser = USERS_DATA.find((u) => u.id === Number(id));
      if (foundUser) {
        setUser(foundUser);
      }
      setLoading(false);
    };

    if (id) fetchUserDetails();
  }, [id]);

  // --- PERMISSION LOGIC ---
  const togglePermission = (rowId: string, field: keyof Omit<PermissionRow, "id" | "label">) => {
    setPermissions((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: !row[field] } : row))
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#E8D1AB]" size={40} />
    </div>
  );

  if (!user) return <div className="p-10 text-white">User not found.</div>;

  return (
    <div className="space-y-10 min-h-screen bg-[#0A0A0A] p-4 lg:p-10">
      
     
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div 
            className="w-20 h-20 lg:w-[100px] lg:h-[100px] rounded-[20px] flex items-center justify-center text-black text-2xl lg:text-3xl font-bold overflow-hidden" 
            style={user.type === "initials" ? { backgroundColor: user.color } : {}}
          >
            {user.type === "initials" ? user.avatar : <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl lg:text-3xl font-bold text-white">
              {user.name} <span className="text-[#E8D1AB] font-bold">({user.role})</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs lg:text-sm text-white/50">
              <p>Created : <span className="text-white">{user.created}</span></p>
              <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
              <p>Updated : <span className="text-white">{user.updated}</span></p>
            </div>
          </div>
        </div>

        <div className={`px-6 py-2 rounded-full text-sm font-medium w-fit ${
          user.status === "Active" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"
        }`}>
          {user.status}
        </div>
      </div>

      {/* 3. PERMISSIONS TABLE SECTION */}
      <div className={`w-full rounded-2xl border overflow-hidden flex flex-col bg-[#141414] border-white/5`}>
        
        {/* TABLE CONTENT */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#101010]">
              <tr className="text-sm font-medium text-[#E8D1AB]">
                <th className="py-5 px-6 font-semibold">Access To</th>
                <th className="py-5 px-4 text-center font-semibold">View Access</th>
                <th className="py-5 px-4 text-center font-semibold">Create Access</th>
                <th className="py-5 px-4 text-center font-semibold">Edit Access</th>
                <th className="py-5 px-4 text-center font-semibold">Delete Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {permissions.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 px-6">
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

      {/* 4. FOOTER ACTIONS */}
      <div className="flex gap-4 pt-4 pb-20">
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] bg-transparent text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] hover:bg-white/5"
        >
          Back
        </Button>
        <Button 
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Update
        </Button>
      </div>
    </div>
  );
}