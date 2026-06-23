"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoleOption = {
  value: string;
  label: string;
};

interface UpdateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (payload: { roleId?: string; roleName: string; description: string }) => void;
  currentRole: string;
  roleName?: string;
  description?: string;
  mode?: "assign" | "role";
  roles?: RoleOption[];
  title?: string;
}

export function UpdateRoleModal({
  isOpen,
  onClose,
  onUpdate,
  currentRole,
  roleName = "",
  description = "",
  mode = "assign",
  roles = [],
  title = "Update Role",
}: UpdateRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [editedRoleName, setEditedRoleName] = useState(roleName);
  const [editedDescription, setEditedDescription] = useState(description);

  useEffect(() => {
    setSelectedRole(currentRole);
    setEditedRoleName(roleName);
    setEditedDescription(description);
  }, [currentRole, description, isOpen, roleName]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] border-white/10 bg-[#0A0A0A] p-0 text-white overflow-hidden [&>button]:hidden rounded-[32px]">
        <DialogHeader className="px-10 pt-10 pb-6 text-left relative">
           <DialogTitle className="text-[32px] font-bold text-white">
            {title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-8 top-10 rounded-full bg-white/5 p-3 text-white/60 transition-colors hover:text-white"
          >
            <X size={24} />
          </button>
          <div className="mt-6 h-px w-full bg-white/10" />
        </DialogHeader>

        <div className="px-10 pb-10">
          <div className="space-y-10">
            {mode === "assign" ? (
              <div className="relative">
                <label className="absolute -top-2.5 left-4 z-10 bg-[#0A0A0A] px-2 text-[13px] font-medium text-white/40">
                  Select Roles
                </label>
                <Select value={selectedRole || undefined} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-[72px] rounded-[20px] border-white/10 bg-transparent px-6 text-[18px] focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111111] text-white">
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="relative">
                  <label className="absolute -top-2.5 left-4 z-10 bg-[#0A0A0A] px-2 text-[13px] font-medium text-white/40">
                    Role Name
                  </label>
                  <input
                    value={editedRoleName}
                    onChange={(event) => setEditedRoleName(event.target.value)}
                    className="h-[72px] w-full rounded-[20px] border border-white/10 bg-transparent px-6 text-[18px] text-white outline-none focus:border-[#E5D5B8]/50"
                    placeholder="Enter role name"
                  />
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-4 z-10 bg-[#0A0A0A] px-2 text-[13px] font-medium text-white/40">
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(event) => setEditedDescription(event.target.value)}
                    className="min-h-[150px] w-full rounded-[20px] border border-white/10 bg-transparent px-6 py-5 text-[16px] text-white outline-none focus:border-[#E5D5B8]/50"
                    placeholder="Describe this role"
                  />
                </div>
              </>
            )}

            <button
              onClick={() =>
                onUpdate({
                  roleId: mode === "assign" ? selectedRole : undefined,
                  roleName:
                    mode === "assign"
                      ? roles.find((role) => role.value === selectedRole)?.label || currentRole
                      : editedRoleName,
                  description: mode === "assign" ? "" : editedDescription,
                })
              }
              className="h-[72px] w-full rounded-[20px] bg-[#E5D5B8] text-[20px] font-bold text-black transition-all hover:bg-[#d6c29b] active:scale-[0.98]"
            >
              Save & Update
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
