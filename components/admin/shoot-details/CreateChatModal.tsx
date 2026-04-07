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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-3xl border border-[#222222] bg-[#080808] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#222222] px-6 py-5 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Create Project Chat</h2>
            <p className="mt-1 text-sm text-white/55">{projectName || "Project chat setup"}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#161616] text-white transition-colors hover:bg-[#222222]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6 lg:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#222222] bg-[#101010] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5D5B8] text-black">
                <MessageCircleMore size={18} />
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Admin</p>
              <p className="mt-2 text-sm text-white">The admin creating this room is added automatically.</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#101010] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D6F5E4] text-black">
                <UserCheck size={18} />
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Sales Rep</p>
              <p className="mt-2 text-sm text-white">{salesRepName || "No assigned sales rep found for this project."}</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#101010] p-4">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#CDE7FF] text-black">
                <UsersRound size={18} />
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Client</p>
              <p className="mt-2 text-sm text-white">{clientName || "Client will be included when available in the linked order."}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#222222] bg-[#0F0F0F] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium text-white">Select Assigned CPs</h3>
                <p className="mt-1 text-sm text-white/50">Choose which CPs should join this project chat.</p>
              </div>
              <div className="text-sm text-[#E5D5B8]">{selectedCpIds.length} selected</div>
            </div>

            {normalizedCrew.length > 0 ? (
              <div className="space-y-3">
                {normalizedCrew.map((member) => {
                  const cpId = getCrewId(member);
                  const selected = selectedCpIds.includes(cpId);
                  return (
                    <label
                      key={cpId}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                        selected ? "border-[#E5D5B8] bg-[#16130D]" : "border-[#242424] bg-[#121212] hover:border-[#353535]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCp(cpId)}
                        className="mt-1 h-4 w-4 accent-[#E5D5B8]"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{getCrewName(member)}</p>
                        <p className="mt-1 text-xs text-white/50">{getCrewRole(member)}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2A2A2A] px-4 py-8 text-center text-sm text-white/50">
                No assigned CPs found for this project. You can still create the room with admin, sales rep, and client.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2C2C2C] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#161616]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateChat}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E5D5B8] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#d9c7a5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : null}
              {creating ? "Creating..." : "Create Chat Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
