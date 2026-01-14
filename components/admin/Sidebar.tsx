import { Grid2x2X, Camera, LogOut, CopyPlus, FolderOpen, CalendarClock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const menuItems = [
	{ name: 'Dashboard', icon: Grid2x2X, active: true },
	{ name: 'Shoots', icon: Camera },
	{ name: 'Add ons', icon: CopyPlus },
	{ name: 'File Manager', icon: FolderOpen },
	{ name: 'Availability', icon: CalendarClock },
	{ name: 'Messages', icon: MessageCircle },
];

export default function Sidebar() {
	return (
		<aside className="w-64 border-r border-zinc-800 flex flex-col justify-between p-5">
			<div>
				{/* Navigation Items */}
				<nav className="space-y-2 mt-8">
					{menuItems.map((item) => (
						<Link
							key={item.name}
							href="#"
							className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active ? 'bg-[#E5D5B8] text-black' : 'text-zinc-500 hover:text-white'
								}`}
						>
							<item.icon size={20} />
							<span className="font-medium">{item.name}</span>
						</Link>
					))}
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