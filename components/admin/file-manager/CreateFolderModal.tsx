"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "@/components/ui/Datepicker";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; visibleUntil?: string | null }) => void | Promise<void>;
  title?: string;
  description?: string;
  initialName?: string;
  initialVisibleUntil?: string | null;
  showVisibilityUntil?: boolean;
  allowPastVisibleUntil?: boolean;
  nameDisabled?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  isDark?: boolean;
}

export const CreateFolderModal = ({
  isOpen,
  onClose,
  onCreate,
  title = "Create Folder",
  description = "Create a new folder in this location",
  initialName = "",
  initialVisibleUntil = null,
  showVisibilityUntil = false,
  allowPastVisibleUntil = false,
  nameDisabled = false,
  submitLabel = "Create Folder",
  submittingLabel = "Creating...",
  isDark = true,
}: CreateFolderModalProps) => {
  const [folderName, setFolderName] = useState("");
  const [visibleUntil, setVisibleUntil] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseDateValue = (value?: string | null) => {
    if (!value) return null;
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateValue = (value: Date | null) => {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setFolderName(initialName);
    setVisibleUntil(parseDateValue(initialVisibleUntil));
  }, [initialName, initialVisibleUntil, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate({ name: folderName, visibleUntil: formatDateValue(visibleUntil) });
      setFolderName("");
      setVisibleUntil(null);
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
            className={`relative w-full max-w-[500px] border rounded-[24px] overflow-hidden shadow-2xl transition-colors duration-200 ${isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-[#D7D7D7]"
              }`}
          >
            {/* Header */}
            <div className={`p-5 flex justify-between items-start border-b transition-colors duration-200 ${isDark ? "border-white/5" : "border-[#D7D7D7]"
              }`}>
              <div>
                <h2 className={`text-xl lg:text-2xl font-bold mb-1 transition-colors ${isDark ? "text-white" : "text-black"
                  }`}>
                  {title}
                </h2>
                <p className={`text-sm transition-colors ${isDark ? "text-white/40" : "text-[#727272]"}`}>
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"
                  }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Folder Name Input */}
              <div className="relative group">
                <label className={`absolute -top-2 left-4 px-2 text-xs font-medium transition-colors ${isDark
                    ? "bg-[#0A0A0A] text-white/40 group-focus-within:text-[#E5D5B8]"
                    : "bg-white text-[#000000]/40 group-focus-within:text-[#000000]/40"
                  }`}>
                  Folder Name
                </label>
                <textarea
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  disabled={nameDisabled}
                  className={`w-full bg-transparent border rounded-xl px-4 py-4 outline-none h-15 transition-all resize-none ${isDark
                      ? "border-white/10 text-white focus:border-[#E5D5B8]/50"
                      : "border-[#D7D7D7] text-black focus:border-[#000000]/40"
                    } ${nameDisabled ? "cursor-not-allowed opacity-70" : ""}`}
                  placeholder="Enter folder name..."
                  required
                />
              </div>

              {showVisibilityUntil ? (
                <fieldset className={`rounded-xl border px-4 pb-3 pt-1.5 transition-colors ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
                  <legend className={`px-1 text-xs font-medium leading-none ${isDark ? "text-white/40" : "text-black/40"}`}>
                    Visible Until
                  </legend>
                  <div className="pt-1">
                    <DatePicker
                      label=""
                      value={visibleUntil}
                      onChange={setVisibleUntil}
                      minDate={allowPastVisibleUntil ? undefined : new Date()}
                      format="MMM d, yyyy"
                      placeholder="MM DD YYYY"
                      isDark={isDark}
                      colors={{
                        inputBackground: "transparent",
                        inputBorder: "transparent",
                        inputBorderHover: "transparent",
                        inputBorderFocus: "transparent",
                        iconColor: isDark ? "#E8D1AB" : "#323232",
                      }}
                      sx={{
                        height: "42px",
                        borderRadius: "0px",
                        "& fieldset": {
                          border: "0 !important",
                        },
                        "& .MuiInputBase-input": {
                          padding: "8px 0",
                        },
                      }}
                    />
                    {visibleUntil ? (
                      <button
                        type="button"
                        onClick={() => setVisibleUntil(null)}
                        className={`mt-2 text-xs font-semibold transition-colors ${isDark ? "text-[#E8D1AB] hover:text-white" : "text-black/60 hover:text-black"}`}
                      >
                        Clear date
                      </button>
                    ) : null}
                  </div>
                </fieldset>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 ">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`flex-1 h-12 rounded-xl font-bold transition-colors ${isDark
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-[1.5] h-12 rounded-xl font-bold transition-colors bg-[#E5D5B8] text-black hover:bg-[#dcb98a]`}
                >
                  {isSubmitting ? submittingLabel : submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
