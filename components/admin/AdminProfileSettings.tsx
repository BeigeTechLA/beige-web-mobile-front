"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

type AdminProfileSettingsProps = {
  isDark?: boolean;
};

type AdminProfileResponse = {
  success?: boolean;
  message?: string;
  status?: number;
  error?: string;
  data?: {
    id?: string | number;
    name?: string;
    number?: string;
    phone_number?: string;
  } | null;
};

export const AdminProfileSettings = ({
  isDark = true,
}: AdminProfileSettingsProps) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [initialName, setInitialName] = useState("");
  const [initialMobileNumber, setInitialMobileNumber] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  const authUser = user as
    | {
        id?: string | number;
        user_id?: string | number;
      }
    | null
    | undefined;

  const authAdminId = authUser?.id ?? authUser?.user_id ?? null;

  const getStoredUser = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const storedUser = localStorage.getItem("revure_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }, []);

  const getAdminId = useCallback(() => {
    if (authAdminId) return authAdminId;

    const storedUser = getStoredUser();
    return storedUser?.id ?? storedUser?.user_id ?? null;
  }, [authAdminId, getStoredUser]);

  const handleUnauthorized = useCallback(() => {
    toast.error("Your session has expired. Please log in again.");
    logout();
    router.push("/");
  }, [logout, router]);

  useEffect(() => {
    let isActive = true;

    const loadAdminProfile = async () => {
      const token = Cookies.get("revure_token");
      const adminId = getAdminId();

      if (!token) {
        if (isActive) {
          setIsProfileLoading(false);
          handleUnauthorized();
        }
        return;
      }

      if (!adminId) {
        if (isActive) {
          setIsProfileLoading(false);
        }
        return;
      }

      setIsProfileLoading(true);

      try {
        const response = (await adminApi.getAdminProfile(
          adminId,
          token,
        )) as AdminProfileResponse;

        if (!isActive) return;

        if (response?.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response?.success || !response?.data) {
          toast.error(
            response?.error ||
              response?.message ||
              "Failed to fetch admin profile",
          );
          return;
        }

        const loadedName = response.data.name || "";
        const loadedMobileNumber =
          response.data.number || response.data.phone_number || "";

        setName(loadedName);
        setMobileNumber(loadedMobileNumber);
        setInitialName(loadedName);
        setInitialMobileNumber(loadedMobileNumber);
      } catch {
        if (isActive) {
          toast.error("Failed to fetch admin profile");
        }
      } finally {
        if (isActive) {
          setIsProfileLoading(false);
        }
      }
    };

    loadAdminProfile();

    return () => {
      isActive = false;
    };
  }, [getAdminId, handleUnauthorized]);

  const trimmedName = name.trim();
  const trimmedMobileNumber = mobileNumber.trim();

  const hasProfileChanges =
    trimmedName !== initialName.trim() ||
    trimmedMobileNumber !== initialMobileNumber.trim();

  const isNameValid = trimmedName.length > 0;
  const isMobileNumberValid = /^\d{10}$/.test(trimmedMobileNumber);
  const isProfileFormValid = isNameValid && isMobileNumberValid;

  const isNewPasswordSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;

  const isConfirmPasswordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const isConfirmPasswordMatch =
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === confirmPassword;

  const isPasswordFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !isNewPasswordSameAsCurrent &&
    isConfirmPasswordMatch;

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!hasProfileChanges || isProfileSaving || isProfileLoading) {
      return;
    }

    if (!isNameValid) {
      toast.error("Name is required");
      return;
    }

    if (!isMobileNumberValid) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    const token = Cookies.get("revure_token");
    const adminId = getAdminId();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!adminId) {
      toast.error("Admin ID not found");
      return;
    }

    setIsProfileSaving(true);

    try {
      const response = (await adminApi.updateAdminProfile(
        adminId,
        {
          name: trimmedName,
          phone_number: trimmedMobileNumber,
        },
        token,
      )) as AdminProfileResponse;

      if (response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response?.success) {
        toast.error(
          response?.error ||
            response?.message ||
            "Failed to update admin profile",
        );
        return;
      }

      const updatedName = response.data?.name || trimmedName;
      const updatedMobileNumber =
        response.data?.number ||
        response.data?.phone_number ||
        trimmedMobileNumber;

      setName(updatedName);
      setMobileNumber(updatedMobileNumber);
      setInitialName(updatedName);
      setInitialMobileNumber(updatedMobileNumber);

      try {
        const storedUser = getStoredUser();

        if (storedUser) {
          localStorage.setItem(
            "revure_user",
            JSON.stringify({
              ...storedUser,
              name: updatedName,
              number: updatedMobileNumber,
              phone_number: updatedMobileNumber,
            }),
          );
        }
      } catch {
        // Profile update already succeeded; local cache sync is optional.
      }

      toast.success(
        response?.message || "Admin profile updated successfully",
      );
    } catch {
      toast.error("Failed to update admin profile");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isPasswordFormValid || isPasswordUpdating) {
      return;
    }

    const token = Cookies.get("revure_token");

    if (!token) {
      handleUnauthorized();
      return;
    }

    setIsPasswordUpdating(true);

    try {
      const response = (await adminApi.changeAdminPassword(
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        token,
      )) as AdminProfileResponse;

      if (response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response?.success) {
        toast.error(
          response?.error ||
            response?.message ||
            "Failed to change admin password",
        );
        return;
      }

      toast.success(response?.message || "Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch {
      toast.error("Failed to change admin password");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleMobileNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
  };

  const inputClassName = `h-10 lg:h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
    isDark
      ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/30 focus:border-[#E8D1AB]/50"
      : "bg-[#F9F9F9] border-zinc-200 text-black placeholder:text-zinc-400 focus:border-[#E8D1AB]"
  }`;

  const labelClassName = `text-sm font-medium transition-colors ${
    isDark ? "text-white/60" : "text-zinc-500"
  }`;

  const passwordToggleClassName = `absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
    isDark
      ? "text-white/40 hover:text-white"
      : "text-zinc-400 hover:text-black"
  }`;

  const errorTextClassName = `text-xs ${
    isDark ? "text-red-400" : "text-red-500"
  }`;

  const successTextClassName = `text-xs ${
    isDark ? "text-emerald-400" : "text-emerald-600"
  }`;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div
        className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
          isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
        }`}
      >
        <h2
          className={`lg:text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
            isDark ? "text-white" : "text-[#171717]"
          }`}
        >
          Personal Information
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-3">
              <Label htmlFor="admin-profile-name" className={labelClassName}>
                Name
              </Label>

              <Input
                id="admin-profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  isProfileLoading ? "Loading..." : "Enter your name"
                }
                className={inputClassName}
                disabled={isProfileLoading || isProfileSaving}
                autoComplete="name"
              />

              {!isProfileLoading && name.length > 0 && !isNameValid && (
                <p className={errorTextClassName}>Name is required.</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="admin-profile-mobile" className={labelClassName}>
                Mobile Number
              </Label>

              <Input
                id="admin-profile-mobile"
                type="tel"
                inputMode="numeric"
                value={mobileNumber}
                onChange={handleMobileNumberChange}
                placeholder={
                  isProfileLoading
                    ? "Loading..."
                    : "Enter your mobile number"
                }
                className={inputClassName}
                disabled={isProfileLoading || isProfileSaving}
                maxLength={10}
                autoComplete="tel"
              />

              {!isProfileLoading &&
                mobileNumber.length > 0 &&
                !isMobileNumberValid && (
                  <p className={errorTextClassName}>
                    Mobile number must be exactly 10 digits.
                  </p>
                )}
            </div>
          </div>

          {hasProfileChanges && (
            <div
              className={`pt-4 border-t transition-colors ${
                isDark ? "border-white/5" : "border-zinc-100"
              }`}
            >
              <Button
                type="submit"
                disabled={
                  isProfileLoading ||
                  isProfileSaving ||
                  !isProfileFormValid
                }
                className="h-10 lg:h-14 bg-[#E8D1AB] text-black font-medium lg:text-lg rounded-lg lg:rounded-xl min-w-[140px] lg:min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProfileSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </div>

      <div
        className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
          isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
        }`}
      >
        <h2
          className={`lg:text-xl font-bold tracking-tight mb-4 lg:mb-8 transition-colors ${
            isDark ? "text-white" : "text-[#171717]"
          }`}
        >
          Change Password
        </h2>

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4 lg:space-y-8 max-w-2xl"
        >
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="admin-current-password"
                className={labelClassName}
              >
                Current Password
              </Label>

              <div className="relative">
                <Input
                  id="admin-current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter current password"
                  className={`${inputClassName} pr-12`}
                  autoComplete="current-password"
                  disabled={isPasswordUpdating}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword((currentValue) => !currentValue)
                  }
                  className={passwordToggleClassName}
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                  disabled={isPasswordUpdating}
                >
                  {showCurrentPassword ? (
                    <Eye size={20} />
                  ) : (
                    <EyeOff size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="admin-new-password" className={labelClassName}>
                New Password
              </Label>

              <div className="relative">
                <Input
                  id="admin-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  className={`${inputClassName} pr-12`}
                  autoComplete="new-password"
                  disabled={isPasswordUpdating}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword((currentValue) => !currentValue)
                  }
                  className={passwordToggleClassName}
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                  disabled={isPasswordUpdating}
                >
                  {showNewPassword ? (
                    <Eye size={20} />
                  ) : (
                    <EyeOff size={20} />
                  )}
                </button>
              </div>

              {isNewPasswordSameAsCurrent && (
                <p className={errorTextClassName}>
                  New password must be different from the current password.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="admin-confirm-password"
                className={labelClassName}
              >
                Confirm Password
              </Label>

              <div className="relative">
                <Input
                  id="admin-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className={`${inputClassName} pr-12`}
                  autoComplete="new-password"
                  disabled={isPasswordUpdating}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((currentValue) => !currentValue)
                  }
                  className={passwordToggleClassName}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={isPasswordUpdating}
                >
                  {showConfirmPassword ? (
                    <Eye size={20} />
                  ) : (
                    <EyeOff size={20} />
                  )}
                </button>
              </div>

              {isConfirmPasswordMismatch && (
                <p className={errorTextClassName}>
                  Confirm password does not match the new password.
                </p>
              )}

              {isConfirmPasswordMatch && (
                <p className={successTextClassName}>Passwords match.</p>
              )}
            </div>
          </div>

          <div
            className={`pt-4 border-t transition-colors ${
              isDark ? "border-white/5" : "border-zinc-100"
            }`}
          >
            <Button
              type="submit"
              disabled={!isPasswordFormValid || isPasswordUpdating}
              className="h-10 lg:h-14 bg-[#E8D1AB] text-black font-medium lg:text-lg rounded-lg lg:rounded-xl min-w-[160px] lg:min-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasswordUpdating
                ? "Updating Password..."
                : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};