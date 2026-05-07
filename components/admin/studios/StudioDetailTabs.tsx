"use client";

const tabs = ["Overview", "Availability", "Gallery"];

export default function StudioDetailTabs({
    activeTab,
    setActiveTab,
    isDark,
}: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isDark: boolean;
}) {
    return (
        <div className={`flex gap-1 border-b mb-6 ${isDark ? "border-white/10" : "border-black/10"}`}>
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                        activeTab === tab
                            ? "border-[#E5D5B8] text-[#E5D5B8]"
                            : isDark
                            ? "border-transparent text-white/40 hover:text-white"
                            : "border-transparent text-black/40 hover:text-black"
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}