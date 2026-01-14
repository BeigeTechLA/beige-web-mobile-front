import React from 'react';
import Sidebar from "@/components/admin/Sidebar";
import Topbar from '@/components/admin/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Topbar */}
      <Topbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar  */}
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:px-10 lg:py-9 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}