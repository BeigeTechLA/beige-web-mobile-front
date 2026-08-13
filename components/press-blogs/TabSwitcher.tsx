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
      {/* Tab Navigation Buttons */}
      <div className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-all duration-300 bg-[#171717] border-[#333]`}>
        {tabs.map((tab) => {
          const isActive = tab.index === activeTab;
          return (
            <button
              key={`tab-btn-${tab.index}`}
              onClick={() => setActiveTab(tab.index)}
              className={`flex-1 px-4 lg:px-6 py-2 rounded-lg text-sm lg:text-xl font-medium w-fit whitespace-nowrap text-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${isActive
                ? ("bg-[#E5D5B8] text-black shadow-lg")
                : ("text-white/80 hover:text-white")
                }`}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Tab Active Content Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tab-panel-${currentTab.index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-full text-white/80 font-['Yrsa'] text-base lg:text-xl space-y-4"
        >
          {currentTab.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TabSwitcher;