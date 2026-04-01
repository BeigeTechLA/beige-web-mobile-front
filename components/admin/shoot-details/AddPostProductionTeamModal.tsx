"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";

interface AddPostProductionTeamModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  isDark?: boolean; // Added isDark prop
}

interface PostProductionMember {
  id: number;
  name: string;
  role: string;
  email?: string;
}

const AddPostProductionTeamModal: React.FC<AddPostProductionTeamModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  isDark = true,
}) => {
  const [selectedMember, setSelectedMember] = useState<PostProductionMember | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [members, setMembers] = useState<PostProductionMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchMembers = async () => {
        try {
          setLoading(true);
          const response = await adminApi.getPostProductionMembers();
          // Some APIs return data directly, some under a 'data' field
          const membersList = response.data || response;

          if (Array.isArray(membersList)) {
            setMembers(membersList.map((m: any) => ({
              id: m.post_production_member_id,
              name: `${m.first_name} ${m.last_name}`.trim() || m.full_name || "Unknown",
              role: m.role || "Post Production",
              email: m.email
            })));
          } else if (membersList && Array.isArray(membersList.data)) {
            setMembers(membersList.data.map((m: any) => ({
              id: m.post_production_member_id,
              name: `${m.first_name} ${m.last_name}`.trim() || m.full_name || "Unknown",
              role: m.role || "Post Production",
              email: m.email
            })));
          }
        } catch (error) {
          console.error("Error fetching post production members:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!selectedMember) return;
    try {
      setSubmitting(true);
      const response = await adminApi.assignPostProductionMember({
        post_production_member_id: selectedMember.id,
        project_id: Number(projectId)
      });

      if (response.success || !response.error) {
        onSuccess();
      } else {
        console.error("Failed to assign member:", response.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error assigning member:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm transition-colors ${isDark ? "bg-black/60" : "bg-zinc-900/30"
      }`}>
      <div className={`w-full max-w-[500px] border rounded-[24px] p-8 shadow-2xl relative transition-all ${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-[#171717]"}`}>
            Add Post Production Team
          </h2>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#1a1a1a] text-zinc-400 hover:text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-500 hover:text-black hover:bg-zinc-200"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="relative">
            {/* Custom Select Input */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loading || submitting}
              className={`w-full h-14 px-4 bg-transparent border rounded-xl flex items-center justify-between group transition-all disabled:opacity-50 ${isDark ? "border-zinc-700 hover:border-zinc-500" : "border-zinc-300 hover:border-zinc-400"
                }`}
            >
              <span className={`text-sm transition-colors ${selectedMember
                  ? (isDark ? 'text-white' : 'text-[#171717]')
                  : (isDark ? 'text-zinc-500' : 'text-zinc-400')
                }`}>
                {loading ? "Loading members..." : (selectedMember?.name || "Select Post Production Team")}
              </span>
              <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Label */}
            <span className={`absolute -top-2.5 left-4 px-1 text-xs transition-colors ${isDark ? "bg-black text-zinc-500" : "bg-white text-zinc-400"
              }`}>
              Select Post Production Team
            </span>

            {/* Dropdown Options */}
            {isDropdownOpen && !loading && (
              <div className={`absolute top-full left-0 right-0 mt-2 border rounded-xl overflow-y-auto max-h-60 z-20 shadow-xl transition-colors ${isDark ? "bg-[#111] border-zinc-800" : "bg-white border-zinc-200"
                }`}>
                {members.length > 0 ? (
                  members.map((member, index) => (
                    <div
                      key={`${member.id}-${index}`}
                      onClick={() => {
                        setSelectedMember(member);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-4 py-3 cursor-pointer text-sm transition-colors ${isDark
                          ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{member.name}</span>
                        <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`px-4 py-3 text-sm ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    No members available
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            className={`w-fit px-8 h-12 rounded-lg font-medium text-base disabled:opacity-50 transition-colors ${isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#d4c4a7]"
                : "bg-[#E5D5B8] text-black hover:bg-[#d4c4a7]"
              }`}
            onClick={handleAdd}
            disabled={!selectedMember || submitting}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Adding...</span>
              </div>
            ) : "Add"}
          </Button>
        </div>
      </div>
    </div >
  );
};

export default AddPostProductionTeamModal;