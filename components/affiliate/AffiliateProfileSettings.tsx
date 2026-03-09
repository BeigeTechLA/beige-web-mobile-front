"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

import { useChangePasswordMutation, useChangePasswordClientMutation } from "@/lib/redux/features/auth/authApi";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const AffiliateProfileSettings = () => {
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
      {/* Header */}
      <div>
        <h1 className="text-lg lg:text-3xl font-bold text-white lg:mb-2">Profile Settings</h1>
        <p className="text-sm text-white/60 lg:text-lg">Manage your personal information and account security.</p>
      </div>

      {/* Personal Info Card */}
      <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 md:p-10">
        <h2 className="lg:text-xl font-bold text-white tracking-tight mb-4 lg:mb-8">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 lg:gap-y-10 gap-x-16">
          <div className="space-y-2">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Full Name</p>
            <p className="text-white/90 font-medium lg:text-xl border-b border-white/10 pb-2">{user?.name || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Email Address</p>
            <p className="text-white/90 font-medium lg:text-xl border-b border-white/10 pb-2">{user?.email || "Not set"}</p>
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
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">User ID</p>
            <p className="text-white/50 font-mono lg:text-lg tracking-wider">#{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-[#111] border border-white/5 rounded-lg lg:rounded-2xl p-4 md:p-10">
        <h2 className="text-xl font-bold text-white tracking-tight mb-4 lg:mb-8">Security Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-8 max-w-2xl">
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/60">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-white/10 text-white pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl focus:border-[#E8D1AB]/50 transition-colors"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/60">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-white/10 text-white pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl focus:border-[#E8D1AB]/50 transition-colors"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/60">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1A1A1A] border-white/10 text-white pr-12 h-14 lg:text-lg rounded-lg lg:rounded-xl focus:border-[#E8D1AB]/50 transition-colors"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#E8D1AB] text-black hover:bg-[#d4be98] px-10 h-12 lg:text-lg rounded-lg lg:rounded-xl font-bold w-full sm:w-auto transition-all active:scale-95"
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};