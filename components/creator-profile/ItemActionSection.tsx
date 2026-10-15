"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ActionMenu from "./AgreementActionMenu"; // Adjust path as needed

// Parent component snippet
export function ItemActionSection({ item, isDark }: { item: any; isDark: boolean }) {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Modals / Actions states (replace with your existing handler functions)
  const [acceptShootEvent, setAcceptShootEvent] = useState<any>(null);
  const [declineShootEvent, setDeclineShootEvent] = useState<any>(null);

  const handleOpenActionMenu = (e: React.MouseEvent<HTMLButtonElement>, currentItem: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Position menu slightly below and aligned to the left of the button
    setActionMenuAnchor({
      x: rect.left - 130, // Adjust positioning offset as necessary
      y: rect.bottom + 8,
    });
    setSelectedItem(currentItem);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedItem(null);
  };

  return (
    <div className="flex items-center justify-end gap-6">
      {/* Trigger Button */}
      <button
        onClick={(e) => handleOpenActionMenu(e, item)}
        className={`p-1.5 rounded-lg transition-colors ${
          isDark
            ? "text-white/40 hover:text-white hover:bg-white/10"
            : "text-black/40 hover:text-black hover:bg-black/5"
        }`}
        aria-label="Open actions menu"
      >
        <ChevronRight size={20} />
      </button>

      {/* Action Menu Popover */}
      {actionMenuAnchor && selectedItem && (
        <ActionMenu
          isOpen={Boolean(actionMenuAnchor)}
          anchor={actionMenuAnchor}
          onClose={handleCloseActionMenu}
          leadId={selectedItem.project_id || selectedItem.id}
          onViewDetails={() => {
            // Navigate to review agreement or project details
            window.location.href = "/creator/dashboard/request/review-agreement";
          }}
          onApprove={() => setAcceptShootEvent(selectedItem)}
          onDecline={() => setDeclineShootEvent(selectedItem)}
          onEdit={() => {
            // Handle edit action
            console.log("Edit requested for:", selectedItem);
          }}
          onArchive={() => {
            // Handle archive/delete action
            console.log("Archive requested for:", selectedItem);
          }}
        />
      )}
    </div>
  );
}