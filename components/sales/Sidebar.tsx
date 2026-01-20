"use client";

import { LayoutDashboard, Users, Tag, Link as LinkIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, link: '/sales/dashboard' },
  { name: 'Leads', icon: Users, link: '/sales/leads' },
  { name: 'Discount Codes', icon: Tag, link: '/sales/discount-codes' },
  { name: 'Payment Links', icon: LinkIcon, link: '/sales/payment-links' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col justify-between py-9 px-5">
      <div>
        {/* Logo/Branding */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Sales Portal</h2>
          <p className="text-sm text-white/60 mt-1">Manage leads & deals</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-3.5">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.link ||
              (item.link !== '/sales/dashboard' && pathname?.startsWith(item.link));
            return (
              <Link
                key={item.name}
                href={item.link}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
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
