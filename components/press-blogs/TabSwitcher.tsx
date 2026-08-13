"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TabData {
  index: string;
  title: string;
  content: React.ReactNode;
}

interface TabSwitcherProps {
  tabs: TabData[];
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState<string>(
    tabs[0]?.index || "1"
  );

  if (!tabs || tabs.length === 0) return null;

  const currentTab = tabs.find((t) => t.index === activeTab) || tabs[0];

  return (
    <div className="w-full my-10 space-y-8">
      {/* Scrollable Tab Navigation Bar */}
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 p-1.5 rounded-xl w-max border transition-all duration-300 bg-[#171717] border-white/10">
          {tabs.map((tab) => {
            const isActive = tab.index === activeTab;
            return (
              <button
                key={`tab-btn-${tab.index}`}
                onClick={() => setActiveTab(tab.index)}
                className={`px-4 lg:px-6 py-2.5 rounded-lg text-sm lg:text-base font-medium whitespace-nowrap text-center transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#E5D5B8] text-black shadow-md font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Panel Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tab-panel-${currentTab.index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full text-white/90 font-['Yrsa'] text-base lg:text-xl space-y-4"
        >
          {currentTab.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabSwitcher;