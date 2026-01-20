"use client";
import { Grid2x2X, Camera, LogOut, CopyPlus, FolderOpen, CalendarClock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { name: 'Dashboard', icon: Grid2x2X, active: true, link:"/admin/dashboard" },
  { name: 'Shoots', icon: Camera, link:"/" },
  { name: 'Add ons', icon: CopyPlus, link:"/" },
  { name: 'File Manager', icon: FolderOpen, link:"/admin/file-manager" },
  { name: 'Availability', icon: CalendarClock, link:"/" },
  { name: 'Messages', icon: MessageCircle, link:"/" },
];

export default function Sidebar({ pathname }: { pathname: string }) {

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col justify-between py-9 px-5">
      <div>
        {/* Navigation Items */}
        <nav className="space-y-3.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.link
            return (
            <Link
              key={item.name}
              href={item.link}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )})}
        </nav>
      </div>

      {/* Logout Button */}
      <button className="flex items-center gap-3 bg-white text-black px-4 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}