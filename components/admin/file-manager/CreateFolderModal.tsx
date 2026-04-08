"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string }) => void | Promise<void>;
  title?: string;
  description?: string;
}

export const CreateFolderModal = ({
  isOpen,
  onClose,
  onCreate,
  title = "Create Folder",
  description = "Create a new folder in this location",
}: CreateFolderModalProps) => {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({ name: folderName });
      setFolderName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-[500px] bg-[#0A0A0A] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 flex justify-between items-start border-b border-white/5">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
                  {title}
                </h2>
                <p className="text-sm text-white/40">
                  {description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Folder Name Input */}
              <div className="relative group">
                <label className="absolute -top-2 left-4 bg-[#0A0A0A] px-2 text-xs font-medium text-white/40 group-focus-within:text-[#E5D5B8] transition-colors">
                  Folder Name
                </label>
                <textarea
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-[#E5D5B8]/50 h-15 transition-all resize-none"
                  placeholder="Enter folder name..."
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 ">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[1.5] h-12 rounded-xl bg-[#E5D5B8] text-black font-bold hover:bg-[#dcb98a] transition-colors"
                >
                  {isSubmitting ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
