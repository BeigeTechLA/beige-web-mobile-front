"use client";

import React, { useState, useMemo } from "react";
import { usePathname,useRouter } from "next/navigation";
import { Search, ArrowUpToLine, ArrowUpRight, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import DottedDivider from "@/components/admin/DottedDivider";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// --- CONSTANTS MOVED OUTSIDE TO PREVENT RE-RENDERING BUGS ---
const ROLES_DATA = [
  { id: 1, total: 4, title: "Administrator", extra: 0, avatars: ["https://i.pravatar.cc/150?u=1", "https://i.pravatar.cc/150?u=2", "https://i.pravatar.cc/150?u=3", "https://i.pravatar.cc/150?u=4"], description: "Full access to all functionalities & settings." },
  { id: 2, total: 7, title: "Manager", extra: 4, avatars: ["https://i.pravatar.cc/150?u=5", "https://i.pravatar.cc/150?u=6", "https://i.pravatar.cc/150?u=7"], description: "Can manage users and view all reports." },
  { id: 3, total: 10, title: "Sales", extra: 7, avatars: ["https://i.pravatar.cc/150?u=8", "https://i.pravatar.cc/150?u=9", "https://i.pravatar.cc/150?u=10"], description: "Access to CRM, leads, and sales analytics." },
  { id: 4, total: 6, title: "Support", extra: 3, avatars: ["https://i.pravatar.cc/150?u=11", "https://i.pravatar.cc/150?u=12", "https://i.pravatar.cc/150?u=13"], description: "Can view and respond to customer tickets." },
  { id: 5, total: 8, title: "Restricted User", extra: 5, avatars: ["https://i.pravatar.cc/150?u=14", "https://i.pravatar.cc/150?u=15", "https://i.pravatar.cc/150?u=16"], description: "Limited access to basic dashboard features." },
];

export const USERS_DATA = [
  { id: 1, name: "Prince Carter", date: "Jan 13, 2026", role: "Admin", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "Active", type: "initials", avatar: "PC", color: "#FDE2F3" },
  { id: 2, name: "Ethan Carter", date: "Jan 13, 2026", role: "Sales", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "In-Active", type: "image", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100" },
  { id: 3, name: "Maya Ross", date: "Jan 13, 2026", role: "User", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "Active", type: "initials", avatar: "MR", color: "#D1FAE5" },
  { id: 4, name: "Daniel Roberts", date: "Jan 13, 2026", role: "Production", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "Active", type: "initials", avatar: "DR", color: "#FFFFFF" },
  { id: 5, name: "John Lee", date: "Jan 13, 2026", role: "Admin", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "In-Active", type: "image", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100" },
  { id: 6, name: "Jake Ross", date: "Jan 13, 2026", role: "User", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "In-Active", type: "image", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100" },
  { id: 7, name: "Sophia Johnson", date: "Jan 13, 2026", role: "Sales", created: "02/02/2026 - 2:30PM", updated: "06/03/2025 - 1:00PM", status: "Active", type: "image", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100" },
];

export const CustomCheckbox = ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-5 h-5 rounded-[4px] cursor-pointer flex items-center justify-center transition-all duration-200 ${
      checked ? "bg-[#E5D5B8]" : "bg-[#0A0A0A] border border-white/20"
    }`}
  >
    {checked && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </div>
);

export default function RolesPage() {
    const router = useRouter();
  
  const pathname = usePathname();
  const isDark = true;

  // States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("Status");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [allFilter, setAllFilter] = useState("All");

  // Logic to prevent "Double Selected" / Duplicate Roles in dropdown
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(USERS_DATA.map((u) => u.role)));
  }, []);

  const toggleAll = () => {
    setSelectedUsers(selectedUsers.length === USERS_DATA.length ? [] : USERS_DATA.map(u => u.id));
  };

  const toggleOne = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`}>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder="Search"
                className={`h-12 w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#1C1C1C] border-white/5 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-white border-black/10 text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                  }`}
              />
            </div>
            <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-800 h-12">
              <ArrowUpToLine size={18} className="mr-2" /> Export
            </Button>
            <Button onClick={() => router.push("/admin/roles-permissions/add-role")}
               className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-12">Add New Role</Button>
          </div>
        }
      />

      <div className="p-4 lg:px-10 lg:py-6">
        <div className="flex justify-between items-start mb-3">
          <div className="text-white">
            <h1 className="text-[32px] font-bold text-white mb-2">Roles & Permission</h1>
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
              A role provided access to predefined menus and features so that depending on assigned role an administrator can have access to what user needs.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      <div className="px-10 mb-4"><DottedDivider /></div>

      {/* --- ROLES GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-10 mb-12">
        {ROLES_DATA.map((role) => (
          <div key={role.id} className="bg-[#141414] border border-white/5 rounded-2xl p-8 flex flex-col justify-between min-h-[260px]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-500">Total {role.total} users</span>
              <div className="flex -space-x-3 items-center">
                {role.avatars.map((img, i) => (
                  <div key={i} className="relative group z-0 hover:z-50">
                    <img src={img} className="w-10 h-10 rounded-full object-cover transition-all duration-300 group-hover:scale-110" alt="avatar" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 text-xs rounded-md bg-[#2A2A2A] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">User {i + 1}</div>
                  </div>
                ))}
                {role.extra > 0 && <div className="w-10 h-10 rounded-full bg-[#E5D5BC] text-black text-xs font-bold flex items-center justify-center">+{role.extra}</div>}
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-[28px] font-bold text-white mb-2">{role.title}</h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-[90%]">{role.description}</p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <button className="text-sm text-[#E5D5BC] border-b border-[#E5D5BC]/20 hover:border-[#E5D5BC] hover:text-white transition-all duration-300 pb-0.5">Edit Role</button>
              <div className="bg-[#2A2A2A] p-3 rounded-full text-zinc-400 hover:text-white hover:bg-[#3A3A3A] transition-all duration-300 cursor-pointer"><ArrowUpRight size={18} /></div>
            </div>
          </div>
        ))}

        <div className="bg-[#EEDCBF] rounded-lg overflow-hidden flex min-h-[260px] relative shadow-2xl">
          <div className="w-1/2 relative h-full">
            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400" className="absolute bottom-0 left-0 h-[115%] object-cover grayscale brightness-90" alt="new role" />
          </div>
          <div className="w-1/2 flex flex-col justify-center items-start p-8 gap-3 z-10">
            <h2 className="text-[28px] font-bold text-zinc-900">New Role</h2>
            <button className="bg-[#1C1C1C] text-white rounded-xl px-6 py-3 text-sm font-bold">Add New Role</button>
          </div>
        </div>
      </div>

      {/* --- ALL USERS TABLE SECTION --- */}
      <div className="px-10 pb-20">
        <div className={`w-full rounded-2xl border overflow-hidden flex flex-col ${isDark ? "bg-[#141414] border-white/5" : "bg-white"}`}>
          <div className={`p-6 border-b transition-colors duration-300 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6]"}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-[4px] h-6 bg-[#E5D5B8] rounded-full" />
                <h3 className="text-lg text-white font-semibold">All Users</h3>
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <BasicDropdown label="Status" value={statusFilter} options={["All Status", "Active", "In-Active"]} onChange={setStatusFilter} />
                <BasicDropdown label="Month" value={monthFilter} options={["All Months", "Jan", "Feb", "Mar"]} onChange={setMonthFilter} />
                <BasicDropdown label="All" value={allFilter} options={["All", "Admin", "User", "Sales"]} onChange={setAllFilter} openAlign="right" />
              </div>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Search" className="w-full pl-12 pr-4 py-3 bg-[#1C1C1C] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E5D5B8]/30" />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#101010]">
                <tr className="text-sm font-medium text-[#E8D1AB]">
                  <th className="py-5 px-6 w-12"><CustomCheckbox checked={selectedUsers.length === USERS_DATA.length && USERS_DATA.length > 0} onClick={toggleAll} /></th>
                  <th className="py-5 px-4">Names</th>
                  <th className="py-5 px-4">Roles</th>
                  <th className="py-5 px-4">Created</th>
                  <th className="py-5 px-4">Updated</th>
                  <th className="py-5 px-4">Status</th>
                  <th className="py-5 px-4 text-right pr-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
  {USERS_DATA.map((user) => (
    <tr
      key={user.id}
      // 1. Add onClick to toggle selection
      onClick={() => toggleOne(user.id)}
      // 2. Add cursor-pointer to show it's clickable
      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
    >
      <td className="py-5 px-6">
        <CustomCheckbox
          checked={selectedUsers.includes(user.id)}
          // stopPropagation is usually inside CustomCheckbox, but keep it here for safety
          onClick={() => toggleOne(user.id)}
        />
      </td>
      <td className="py-5 px-4">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-black font-bold text-base overflow-hidden"
            style={user.type === "initials" ? { backgroundColor: user.color } : {}}
          >
            {user.type === "initials" ? user.avatar : <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-xl object-cover" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/60">{user.date}</p>
          </div>
        </div>
      </td>
      
      {/* 3. Stop propagation on the Select dropdown so clicking it doesn't toggle the row */}
      <td className="py-5 px-4" onClick={(e) => e.stopPropagation()}>
        <Select defaultValue={user.role}>
          <SelectTrigger className="w-fit bg-transparent border-none text-white/80 text-sm h-auto p-0 focus:ring-0 shadow-none gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      
      <td className="py-5 px-4 text-sm text-white/70">{user.created}</td>
      <td className="py-5 px-4 text-sm text-white/70">{user.updated}</td>
      <td className="py-5 px-4">
        <span className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-[14px] font-medium leading-none ${user.status === "Active" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>
          {user.status}
        </span>
      </td>
      
      <td className="py-5 px-4 text-right pr-10">
        <div className="flex items-center justify-end gap-4">
          {/* 4. Stop propagation on all action icons */}
          <Pencil
            onClick={(e) => {
              e.stopPropagation(); // Prevents row selection
              router.push(`/admin/roles-permissions/edit-role/${user.id}`);
            }}
            size={18}
            className="text-white/40 cursor-pointer hover:text-white"
          />
          <Trash2 
            size={18} 
            className="text-white/40 cursor-pointer hover:text-red-400" 
            onClick={(e) => e.stopPropagation()} // Prevents row selection
          />
          <ChevronRight 
            size={22} 
            className="text-white/40 cursor-pointer hover:text-white" 
            onClick={(e) => e.stopPropagation()} // Prevents row selection
          />
        </div>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}