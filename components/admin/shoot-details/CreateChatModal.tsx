"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircleMore, UserCheck, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { externalChatApi, type ExternalChatRoom } from "@/lib/externalChatApi";

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string | number | null;
  projectName?: string;
  salesRepName?: string | null;
  clientName?: string | null;
  assignedCrew?: any[];
  onCreated?: (room: ExternalChatRoom | null) => void;
  isDark?: boolean;
}

const getCrewId = (member: any) => String(member?.crew_member_id || member?.crew_member?.crew_member_id || member?.id || "");

const getCrewName = (member: any) => {
  const first = member?.crew_member?.first_name || member?.first_name || "";
  const last = member?.crew_member?.last_name || member?.last_name || "";
  return `${first} ${last}`.trim() || "Unnamed CP";
};

const getCrewRole = (member: any) =>
  member?.crew_member?.role_name || member?.role_name || member?.crew_member?.primary_role || "Creative Partner";

export default function CreateChatModal({
  isOpen,
  onClose,
  bookingId,
  projectName,
  salesRepName,
  clientName,
  assignedCrew = [],
  onCreated,
  isDark = true,
}: CreateChatModalProps) {
  const [selectedCpIds, setSelectedCpIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const normalizedCrew = useMemo(
    () => assignedCrew.filter((member) => getCrewId(member)),
    [assignedCrew]
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCpIds(normalizedCrew.map((member) => getCrewId(member)));
  }, [isOpen, normalizedCrew]);

  const toggleCp = (cpId: string) => {
    setSelectedCpIds((prev) =>
      prev.includes(cpId) ? prev.filter((id) => id !== cpId) : [...prev, cpId]
    );
  };

  const handleCreateChat = async () => {
    if (!bookingId) {
      toast.error("Booking details are missing for this project");
      return;
    }

    setCreating(true);
    try {
      const room = await externalChatApi.createRoom(bookingId, selectedCpIds);
      toast.success("Chat room is ready");
      onCreated?.(room);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create chat room");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Main Structural Frame Card Component */}
      <div className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh] transition-colors ${isDark ? "border-[#222222] bg-[#080808]" : "border-[#DFDDDD] bg-white"
        }`}>
        {/* Header Section */}
        <div className={`flex items-center justify-between border-b px-6 py-5 lg:px-8 transition-colors  shrink-0 ${isDark ? "border-[#222222]" : "border-[#DFDDDD]"
          }`}>
          <div>
            <h2 className={`text-xl lg:text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Create Project Chat</h2>
            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/55" : "text-black/60"}`}>{projectName || "Project chat setup"}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#161616] text-white hover:bg-[#222222]" : "bg-zinc-100 text-black hover:bg-zinc-200"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Context Box */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 no-scrollbar">
          {/* Roles Insight Dashboard Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 transition-colors ${isDark ? "border-[#222222] bg-[#101010]" : "border-[#E3E3E3] bg-[#F9F9F9]"
              }`}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5D5B8] text-black">
                <MessageCircleMore size={18} />
              </div>
              <p className={`text-xs uppercase tracking-[0.24em] ${isDark ? "text-white/40" : "text-black/40"}`}>Admin</p>
              <p className={`mt-2 text-sm ${isDark ? "text-white" : "text-black font-medium"}`}>The admin creating this room is added automatically.</p>
            </div>
            <div className={`rounded-2xl border p-4 transition-colors ${isDark ? "border-[#222222] bg-[#101010]" : "border-[#E3E3E3] bg-[#F9F9F9]"
              }`}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D6F5E4] text-black">
                <UserCheck size={18} />
              </div>
              <p className={`text-xs uppercase tracking-[0.24em] ${isDark ? "text-white/40" : "text-black/40"}`}>Sales Rep</p>
              <p className={`mt-2 text-sm ${isDark ? "text-white" : "text-black font-medium"}`}>{salesRepName || "No assigned sales rep found for this project."}</p>
            </div>
            <div className={`rounded-2xl border p-4 transition-colors ${isDark ? "border-[#222222] bg-[#101010]" : "border-[#E3E3E3] bg-[#F9F9F9]"
              }`}>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#CDE7FF] text-black">
                <UsersRound size={18} />
              </div>
              <p className={`text-xs uppercase tracking-[0.24em] ${isDark ? "text-white/40" : "text-black/40"}`}>Client</p>
              <p className={`mt-2 text-sm ${isDark ? "text-white" : "text-black font-medium"}`}>{clientName || "Client will be included when available in the linked order."}</p>
            </div>
          </div>

          {/* Crew / CP List Selection Block */}
          <div className={`rounded-3xl border p-5 transition-colors ${isDark ? "border-[#222222] bg-[#0F0F0F]" : "border-[#E3E3E3] bg-white shadow-sm"
            }`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>Select Assigned CPs</h3>
                <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>Choose which CPs should join this project chat.</p>
              </div>
              <div className={`text-sm ${isDark ? "text-[#E5D5B8]" : "text-zinc-600 font-semibold"}`}>{selectedCpIds.length} selected</div>
            </div>

            {normalizedCrew.length > 0 ? (
              <div className="space-y-3">
                {normalizedCrew.map((member) => {
                  const cpId = getCrewId(member);
                  const selected = selectedCpIds.includes(cpId);
                  return (
                    <label
                      key={cpId}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${selected
                          ? isDark ? "border-[#E5D5B8] bg-[#16130D]" : "border-black bg-zinc-50"
                          : isDark ? "border-[#242424] bg-[#121212] hover:border-[#353535]" : "border-[#E3E3E3] bg-white hover:border-[#B5B5B5]"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCp(cpId)}
                        className={`mt-1 h-4 w-4 transition-colors ${isDark ? "accent-[#E5D5B8]" : "accent-black"}`}
                      />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{getCrewName(member)}</p>
                        <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>{getCrewRole(member)}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${isDark ? "border-[#2A2A2A] text-white/50" : "border-[#DFDDDD] text-black/50"
                }`}>
                No assigned CPs found for this project. You can still create the room with admin, sales rep, and client.
              </div>
            )}
          </div>
        </div>

        {/* Action Control Trigger Set */}
        <div className="flex justify-end gap-3 p-5 lg:p-8 lg:pt-0">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${isDark ? "border-[#2C2C2C] text-white hover:bg-[#161616]" : "border-[#DFDDDD] text-black hover:bg-zinc-50"
              }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateChat}
            disabled={creating}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#d9c7a5]"
                : "bg-black text-white hover:bg-zinc-800"
              }`}
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : null}
            {creating ? "Creating..." : "Create Chat Room"}
          </button>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}