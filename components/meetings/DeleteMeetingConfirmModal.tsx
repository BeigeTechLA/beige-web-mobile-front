"use client";

import React from "react";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

interface DeleteMeetingConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  meetingTitle?: string;
  isDeleting?: boolean;
}

export default function DeleteMeetingConfirmModal({
  open,
  onClose,
  onConfirm,
  meetingTitle,
  isDeleting = false,
}: DeleteMeetingConfirmModalProps) {
  return (
    <DeleteConfirmationModal
      isOpen={open}
      onClose={onClose}
      onConfirm={() => {
        void onConfirm();
      }}
      isLoading={isDeleting}
      title="Delete Meeting"
      description={`Are you sure you want to delete ${meetingTitle ? `"${meetingTitle}"` : "this meeting"}? This action cannot be undone.`}
    />
  );
}
