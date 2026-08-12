"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type AccordionItemData = {
  id: string;
  title: React.ReactNode; // Updated to accept string or React elements from parser
  content: React.ReactNode;
};

interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
}

// Helper to recursively extract plain text from React Nodes & strip non-alphanumeric/punctuation symbols
const extractCleanText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  let text = "";

  if (typeof node === "string" || typeof node === "number") {
    text = String(node);
  } else if (Array.isArray(node)) {
    text = node.map(extractCleanText).join("");
  } else if (React.isValidElement(node)) {
    // If it's an SVG or media element, skip it entirely
    if (typeof node.type === "string" && ["svg", "img", "path"].includes(node.type)) {
      return "";
    }
    // Recursively extract text from children
    const children = (node.props as { children?: React.ReactNode }).children;
    text = extractCleanText(children);
  }

  // Remove any remaining unwanted non-standard symbols or icons, preserving letters, numbers, spaces, and standard punctuation
  return text.replace(/[^\w\s\?\!\.\-\,\'\"]/g, "").trim();
};

export default function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="w-full mx-auto space-y-4">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const cleanTitle = extractCleanText(item.title);

        return (
          <div
            key={item.id}
            className="border-b border-b-[#E8D1AB]/30 overflow-hidden transition-colors duration-300"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between py-5 text-left text-[#E8D1AB]"
              aria-expanded={isOpen}
            >
              <span className="lg:text-2xl font-medium tracking-wide">
                {cleanTitle}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="text-[#E8D1AB] flex-shrink-0 ml-4"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="pb-5 pt-1 text-white text-sm lg:text-xl leading-relaxed">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}