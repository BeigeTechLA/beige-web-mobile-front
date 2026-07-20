"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
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
  const { isDark } = useResolvedTheme();
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
      {/* 
        Fixed layout positioning breakdown:
        Explicitly forced layout defaults to override centering primitives on mobile viewports.
      */}
      <DialogContent className={`fixed flex flex-col md:grid !gap-0 top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 max-w-full md:max-w-xl overflow-hidden rounded-t-4xl rounded-b-0 md:rounded-4xl p-0 [&>button]:hidden md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 ${isDark
          ? "border-t border-x border-white/40 md:border bg-black text-white"
          : "border-t border-x border-[#E3E3E3] md:border bg-white text-[#101010]"
        }`}>

        {/* Mobile Top Drag Indicator Handle Bar */}
        <div className="flex w-full justify-center pt-1 md:hidden">
          <div className={`h-1.5 w-16 rounded-full ${isDark ? "bg-white/25" : "bg-black/15"}`} />
        </div>

        <DialogHeader className="flex !flex-row items-center justify-between px-4 py-7 md:p-7 text-left relative">
          <DialogTitle className={`text-xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-[#101010]"}`}>
            {title}
          </DialogTitle>
          <button
            onClick={onClose}
            className={`rounded-full p-3 transition-colors ${isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-black/5 text-[#32323299] hover:text-[#101010]"}`}
          >
            <X size={24} />
          </button>
        </DialogHeader>

        <div className={`px-4 py-10 lg:p-8 lg:pt-9 border-t ${isDark ? "border-[#CACACA]" : "border-[#E3E3E3]"}`}>
          <div className="space-y-5 lg:space-y-8">
            {mode === "assign" ? (
              <div className="relative">
                <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
                  Select Roles
                </label>
                <Select value={selectedRole || undefined} onValueChange={setSelectedRole}>
                  <SelectTrigger className={`h-[82px] rounded-xl text-left ${isDark ? "text-white border-white/50 bg-black" : "text-black border-black/20 bg-[#fff]"}`}>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "border-white/10 bg-[#111111] text-white" : "border-[#E3E3E3] bg-white text-[#101010]"}>
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
                  <label className={`absolute -top-2.5 left-4 z-10 px-2 text-[13px] font-medium ${isDark ? "bg-[#0A0A0A] text-white/40" : "bg-white text-[#32323299]"}`}>
                    Role Name
                  </label>
                  <input
                    value={editedRoleName}
                    onChange={(event) => setEditedRoleName(event.target.value)}
                    className={`h-[72px] w-full rounded-xl border px-6 text-lg outline-none ${isDark ? "border-white/10 bg-transparent text-white focus:border-[#E5D5B8]/50" : "border-[#E3E3E3] bg-white text-[#101010] focus:border-[#C9A96E]/50"}`}
                    placeholder="Enter role name"
                  />
                </div>

                <div className="relative">
                  <label className={`absolute -top-2.5 left-4 z-10 px-2 text-[13px] font-medium ${isDark ? "bg-[#0A0A0A] text-white/40" : "bg-white text-[#32323299]"}`}>
                    Description
                  </label>
                  <textarea
                    value={editedDescription}
                    onChange={(event) => setEditedDescription(event.target.value)}
                    className={`min-h-[150px] w-full rounded-xl border px-6 py-5 text-base outline-none ${isDark ? "border-white/10 bg-transparent text-white focus:border-[#E5D5B8]/50" : "border-[#E3E3E3] bg-white text-[#101010] focus:border-[#C9A96E]/50"}`}
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
              className={`h-12 px-7 w-full lg:w-fit rounded-lg text-sm font-semibold transition-all ${isDark
                  ? "bg-[#E5D5B8] text-black hover:bg-[#d6c29b]"
                  : "bg-[#E5D5B8] text-[#101010] hover:bg-[#d6c29b]"
                }`}
            >
              Save & Update
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}