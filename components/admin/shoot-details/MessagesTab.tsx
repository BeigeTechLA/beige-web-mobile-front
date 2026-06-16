"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import ExternalChatView from "@/components/chat/ExternalChatView";
import CreateChatModal from "@/components/admin/shoot-details/CreateChatModal";

interface MessagesTabProps {
  bookingId?: string | number | null;
  role?: "admin" | "sales" | "client" | "cp" | "pm";
  assignedCrew?: unknown[];
  projectName?: string;
  salesRepName?: string | null;
  clientName?: string | null;
  isDark?: boolean;
}

export default function MessagesTab({
  bookingId,
  role = "admin",
  assignedCrew = [],
  projectName,
  salesRepName,
  clientName,
  isDark = true,
}: MessagesTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasChatRoom, setHasChatRoom] = useState<boolean | null>(null);
  const handleCreated = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <>
      <ExternalChatView
        key={`${bookingId || "all"}-${refreshKey}`}
        role={role}
        bookingId={bookingId}
        heading="Project Chat"
        isDark={isDark}
        directRoomMode
        onCreateRoom={() => setIsCreateModalOpen(true)}
        description={
          role === "admin"
            ? hasChatRoom === false
              ? "Create one chat room for this project with admin, assigned sales rep, selected CPs, and client when available."
              : "View and reply to the project conversation for this booking."
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
        isDark={isDark}
        onCreated={handleCreated}
      />
    </>
  );
}
