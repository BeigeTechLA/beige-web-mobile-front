"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

import { useChangePasswordMutation, useChangePasswordClientMutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const AffiliateProfileSettings = ({ isDark = true }: { isDark?: boolean }) => {
  const [changePasswordClient, { isLoading }] = useChangePasswordClientMutation();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const userData = localStorage.getItem("revure_user");
      const parsedUser = userData ? JSON.parse(userData) : null;
      const userId = parsedUser?.id;

      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const response = await changePasswordClient({
        currentPassword: currentPassword,
        newPassword: newPassword,
        user_id: userId
      }).unwrap();

      toast.success(response.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Personal Info Card */}
      <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}>
        <h2 className={`lg:text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
          isDark ? "text-white" : "text-[#171717]"
        }`}>
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 lg:gap-y-10 gap-x-16">
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>Full Name</p>
            <p className={`font-medium lg:text-xl border-b pb-2 transition-colors ${
              isDark ? "text-white/90 border-white/10" : "text-zinc-800 border-zinc-100"
            }`}>{user?.name || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>Email Address</p>
            <p className={`font-medium lg:text-xl border-b pb-2 transition-colors ${
              isDark ? "text-white/90 border-white/10" : "text-zinc-800 border-zinc-100"
            }`}>{user?.email || "Not set"}</p>
          </div>
          {/* <div className="space-y-2">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Role</p>
            <div>
              <span className="inline-flex items-center px-4 py-2 bg-[#E8D1AB]/10 text-[#E8D1AB] rounded-full text-sm font-bold uppercase tracking-wider border border-[#E8D1AB]/20">
                Partner
              </span>
            </div>
          </div> */}
          <div className="space-y-2">
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${
              isDark ? "text-white/40" : "text-zinc-400"
            }`}>User ID</p>
            <p className={`font-mono lg:text-lg tracking-wider transition-colors ${
              isDark ? "text-white/50" : "text-zinc-500"
            }`}>#{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}>
        <h2 className={`text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
          isDark ? "text-white" : "text-[#171717]"
        }`}>
          Security Settings
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-8 max-w-2xl">
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-3">
              <Label className={`text-sm font-medium transition-colors ${
                isDark ? "text-white/60" : "text-zinc-500"
              }`}>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                    isDark 
                      ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                      : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                  }`}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                  }`}
                >
                  {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={`text-sm font-medium transition-colors ${
                isDark ? "text-white/60" : "text-zinc-500"
              }`}>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                    isDark 
                      ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                      : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                  }`}
                >
                  {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className={`text-sm font-medium transition-colors ${
                isDark ? "text-white/60" : "text-zinc-500"
              }`}>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
                    isDark 
                      ? "bg-[#1A1A1A] border-white/10 text-white focus:border-[#E8D1AB]/50" 
                      : "bg-[#F9F9F9] border-zinc-200 text-black focus:border-[#E8D1AB]"
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-black"
                  }`}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className={`pt-4 border-t transition-colors ${
            isDark ? "border-white/5" : "border-zinc-100"
          }`}>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 lg:h-[72px] bg-[#E8D1AB] text-black font-medium text-lg rounded-xl flex-1 min-w-[140px] lg:min-w-[240px]"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};