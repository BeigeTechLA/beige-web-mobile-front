"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  fileManagerApi,
  type ShootWithoutFileManager,
} from "@/lib/fileManagerApi";

interface CreateShootFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { bookingId: number; folderName: string }) => void | Promise<void>;
  isCreating?: boolean;
  isDark?: boolean;
}

const SHOOTS_PAGE_SIZE = 24;

const formatEventDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const CreateShootFolderModal = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
  isDark = true,
}: CreateShootFolderModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [shoots, setShoots] = useState<ShootWithoutFileManager[]>([]);
  const [selectedShoot, setSelectedShoot] = useState<ShootWithoutFileManager | null>(null);
  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setDebouncedSearchTerm("");
      setShoots([]);
      setSelectedShoot(null);
      setFolderName("");
      setError(null);
      return;
    }

    const requestId = ++requestRef.current;

    const loadShoots = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fileManagerApi.listShootsWithoutFileManager({
          page: 1,
          limit: SHOOTS_PAGE_SIZE,
          search: debouncedSearchTerm,
        });

        if (requestId !== requestRef.current) return;
        setShoots(response.shoots);
      } catch (err: unknown) {
        if (requestId !== requestRef.current) return;
        setShoots([]);
        setError(err instanceof Error ? err.message : "Failed to load shoots");
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadShoots();
  }, [debouncedSearchTerm, isOpen]);

  const handleSelectShoot = (shoot: ShootWithoutFileManager) => {
    setSelectedShoot(shoot);
    setFolderName(shoot.folderName || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFolderName = folderName.trim();
    if (!selectedShoot || !trimmedFolderName) return;

    await onCreate({
      bookingId: selectedShoot.bookingId,
      folderName: trimmedFolderName,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isCreating ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative w-full max-w-[620px] border rounded-[24px] overflow-hidden shadow-2xl transition-colors duration-200 ${
              isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-[#D7D7D7]"
            }`}
          >
            <div className={`p-5 flex justify-between items-start border-b transition-colors duration-200 ${
              isDark ? "border-white/5" : "border-[#D7D7D7]"
            }`}>
              <div>
                <h2 className={`text-xl lg:text-2xl font-bold mb-1 transition-colors ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  Create Shoot Folder
                </h2>
                <p className={`text-sm transition-colors ${isDark ? "text-white/40" : "text-[#727272]"}`}>
                  Create a file manager folder for a paid shoot that is missing one
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  isDark ? "text-white/40" : "text-[#9F9FA9]"
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search shoots..."
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-all ${
                    isDark
                      ? "bg-transparent border-white/10 text-white placeholder:text-white/40 focus:border-[#E5D5B8]/50"
                      : "bg-white border-[#D7D7D7] text-black placeholder:text-[#9F9FA9] focus:border-[#000000]/40"
                  }`}
                />
              </div>

              <div className={`max-h-[260px] overflow-y-auto rounded-xl border transition-colors ${
                isDark ? "border-white/10" : "border-[#D7D7D7]"
              }`}>
                {isLoading ? (
                  <div className={`flex items-center justify-center gap-2 px-4 py-10 text-sm ${
                    isDark ? "text-white/60" : "text-[#727272]"
                  }`}>
                    <Loader2 className="h-4 w-4 animate-spin text-[#BFA780]" />
                    Loading shoots...
                  </div>
                ) : error ? (
                  <div className="px-4 py-10 text-center text-sm text-red-400">{error}</div>
                ) : shoots.length === 0 ? (
                  <div className={`px-4 py-10 text-center text-sm ${
                    isDark ? "text-white/50" : "text-[#727272]"
                  }`}>
                    No shoots are missing a file manager folder
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {shoots.map((shoot) => {
                      const isSelected = selectedShoot?.bookingId === shoot.bookingId;
                      const eventDate = formatEventDate(shoot.eventDate);
                      return (
                        <button
                          key={shoot.bookingId}
                          type="button"
                          onClick={() => handleSelectShoot(shoot)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[#E5D5B8] text-black"
                              : isDark
                                ? "text-white hover:bg-white/5"
                                : "text-black hover:bg-black/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {shoot.projectName || "Untitled project"}
                              </p>
                              <p className={`mt-1 truncate text-xs ${
                                isSelected ? "text-black/65" : isDark ? "text-white/45" : "text-[#727272]"
                              }`}>
                                {shoot.clientName || "No client name"} | Booking #{shoot.bookingId}
                              </p>
                            </div>
                            {eventDate ? (
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                isSelected
                                  ? "bg-black/10 text-black"
                                  : isDark
                                    ? "bg-white/5 text-white/60"
                                    : "bg-[#F4F5F7] text-[#727272]"
                              }`}>
                                {eventDate}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedShoot ? (
                <div className="relative group">
                  <label className={`absolute -top-2 left-4 px-2 text-xs font-medium transition-colors ${
                    isDark
                      ? "bg-[#0A0A0A] text-white/40 group-focus-within:text-[#E5D5B8]"
                      : "bg-white text-[#000000]/40 group-focus-within:text-[#000000]/40"
                  }`}>
                    Folder Name
                  </label>
                  <textarea
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={`w-full bg-transparent border rounded-xl px-4 py-4 outline-none h-15 transition-all resize-none ${
                      isDark
                        ? "border-white/10 text-white focus:border-[#E5D5B8]/50"
                        : "border-[#D7D7D7] text-black focus:border-[#000000]/40"
                    }`}
                    placeholder="Enter folder name..."
                    required
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className={`flex-1 h-12 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedShoot || !folderName.trim() || isCreating}
                  className="flex-[1.5] h-12 rounded-xl font-bold transition-colors bg-[#E5D5B8] text-black hover:bg-[#dcb98a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
