"use client";

import React, { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import CreateChatModal from "@/components/admin/shoot-details/CreateChatModal";

interface MessagesTabProps {
  bookingId?: string | number | null;
  role?: "admin" | "sales" | "client" | "cp" | "pm";
  assignedCrew?: any[];
  projectName?: string;
  salesRepName?: string | null;
  clientName?: string | null;
}

export default function MessagesTab({
  bookingId,
  role = "admin",
  assignedCrew = [],
  projectName,
  salesRepName,
  clientName,
}: MessagesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      {role === "admin" ? (
        <div className="mb-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E5D5B8] px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#d9c7a5] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!bookingId}
          >
            <MessageSquarePlus size={16} />
            Create Chat Room
          </button>
        </div>
      ) : null}

      <ExternalChatView
        key={`${bookingId || "all"}-${refreshKey}`}
        role={role}
        bookingId={bookingId}
        heading="Project Chat"
        description={
          role === "admin"
            ? "Create one chat room for this project with admin, assigned sales rep, selected CPs, and client when available."
            : role === "client"
              ? "View and reply to the project conversation for this booking from the client workspace."
              : role === "cp"
                ? "View and reply to project conversations only when you are assigned to this booking."
                : role === "pm"
                  ? "View and reply to project conversations when this booking is assigned to you for post production."
                  : "This project chat becomes available after an admin creates the room."
        }
      />

      <CreateChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        bookingId={bookingId}
        projectName={projectName}
        salesRepName={salesRepName}
        clientName={clientName}
        assignedCrew={assignedCrew}
        onCreated={() => setRefreshKey((value) => value + 1)}
      />
    </>
  );
}
