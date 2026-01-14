import { Sun, Moon } from 'lucide-react';
import Image from 'next/image';

export default function Topbar() {
  return (
    <header className="flex items-center justify-between p-4 lg:px-9 lg:py-6 border-b border-zinc-800 bg-[#0f0f0f]">
      {/* Left: Logo & Breadcrumbs */}
      <div className="flex items-center gap-6">
        <a href="https://book.beige.app" target="_blank" rel="noopener noreferrer" className="flex items-center shrink-0">
          <Image
            src="/images/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={158}
            height={32}
            className="w-[120px] h-[24px] md:w-[158px] md:h-[32px] object-contain"
            priority
          />
        </a>
        <nav className="flex items-center gap-4 text-sm text-white/40">
          <span>Dashboards</span>/
          <span className="text-white font-bold">Overview</span>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800">
          <button className="p-1.5 rounded-full bg-[#E5D5B8] text-black">
            <Moon size={18} />
          </button>
          <button className="p-1.5 text-zinc-500">
            <Sun size={18} />
          </button>
        </div>

        {/* User Profile */}
        <div className="relative shrink-0 w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-zinc-800 overflow-hidden cursor-pointer border border-zinc-700">
          <Image
            width={48}
            height={48}
            className="object-contain"
            src={"/images/avatar.png"}
            alt={"User"}
          />
        </div>

        {/* Action Button */}
        <button className="bg-[#E5D5B8] text-black px-5 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
          Book a Shoot
        </button>
      </div>
    </header>
  );
}