"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useChangePasswordCrewMutation } from "@/lib/redux/features/auth/authApi";
import { useAuth } from "@/lib/hooks/useAuth";

interface SecurityFormProps {
  onSuccess: () => void;
  isDark?: boolean;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { message?: unknown } }).data?.message === "string"
  ) {
    return (error as { data: { message: string } }).data.message;
  }

  return fallback;
};

const getStoredHasPassword = () => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("revure_user");
    const parsedUser = userData ? JSON.parse(userData) : null;
    return typeof parsedUser?.has_password === "boolean" ? parsedUser.has_password : null;
  } catch {
    return null;
  }
};

const SecurityForm = ({ onSuccess, isDark = true }: SecurityFormProps) => {
  const { user } = useAuth();
  const [changePasswordCrew, { isLoading }] = useChangePasswordCrewMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(() => getStoredHasPassword() ?? (user?.has_password !== false));

  useEffect(() => {
    setHasPassword(getStoredHasPassword() ?? (user?.has_password !== false));
  }, [user?.has_password]);

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

      const payload = {
        newPassword: newPassword,
        user_id: Number(userId),
        ...(hasPassword ? { currentPassword } : {}),
      };

      const response = await changePasswordCrew(payload).unwrap();

      if (typeof window !== "undefined") {
        localStorage.setItem("revure_user", JSON.stringify({
          ...parsedUser,
          has_password: true,
        }));
      }
      setHasPassword(true);

      toast.success(response.message || (hasPassword ? "Password changed successfully" : "Password set successfully"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, hasPassword ? "Failed to change password" : "Failed to set password"));
    }
  };

  const labelClasses = `text-sm font-medium transition-colors ${isDark ? "text-white/60" : "text-black/60"
    }`;

  const inputClasses = `h-12 w-full border rounded-xl transition-all pr-10 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base ${isDark
      ? "bg-black border-white/10 text-white focus:border-[#E8D1AB]/50"
      : "bg-neutral-50 border-black/10 text-black focus:border-[#cbb38b]/50"
    }`;

  const toggleButtonClasses = `absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-4">

        {hasPassword && (
          <div className="space-y-2">
            <Label className={labelClasses}>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClasses}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={toggleButtonClasses}
              >
                {showCurrentPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* NEW PASSWORD */}
        <div className="space-y-2">
          <Label className={labelClasses}>New Password</Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClasses}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className={toggleButtonClasses}
            >
              {showNewPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        {/* CONFIRM NEW PASSWORD */}
        <div className="space-y-2">
          <Label className={labelClasses}>Confirm New Password</Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClasses}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={toggleButtonClasses}
            >
              {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ACTION TRIGGERS */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`font-bold px-10 py-3 rounded-xl transition-colors disabled:opacity-50 ${isDark
              ? "bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
              : "bg-[#cbb38b] hover:bg-[#bfa57c] text-white"
            }`}
        >
          {isLoading ? (hasPassword ? "Updating..." : "Setting...") : (hasPassword ? "Update Password" : "Set Password")}
        </button>
      </div>
    </form>
  );
};

export default SecurityForm;
