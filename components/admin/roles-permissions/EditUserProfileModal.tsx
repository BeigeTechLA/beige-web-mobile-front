"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export type EditedUserProfile = {
  name: string;
  email: string;
  phone_number: string;
};

type EditUserProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string | number;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  onSaved: (profile: EditedUserProfile) => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EditUserProfileModal = ({
  isOpen,
  onClose,
  userId,
  initialName,
  initialEmail,
  initialPhone,
  onSaved,
}: EditUserProfileModalProps) => {
  const { isDark } = useResolvedTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName || "");
    setEmail(initialEmail || "");
    setPhone((initialPhone || "").replace(/\D/g, "").slice(0, 10));
    setTouched({ name: false, email: false, phone: false });
    setServerError("");
  }, [isOpen, initialName, initialEmail, initialPhone]);

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  const nameError =
    trimmedName.length === 0
      ? "Name is required."
      : trimmedName.length < 2 || trimmedName.length > 100
        ? "Name must be between 2 and 100 characters."
        : "";
  const emailError =
    trimmedEmail.length === 0
      ? "Email is required."
      : !EMAIL_REGEX.test(trimmedEmail)
        ? "Enter a valid email address."
        : "";
  const phoneError = trimmedPhone && !/^\d{10}$/.test(trimmedPhone)
    ? "Phone number must be exactly 10 digits."
    : "";
  const emailConflict = /email/i.test(serverError);
  const phoneConflict = /phone|number/i.test(serverError);

  const isFormValid = !nameError && !emailError && !phoneError;
  const hasChanges =
    trimmedName !== (initialName || "").trim() ||
    trimmedEmail !== (initialEmail || "").trim().toLowerCase() ||
    trimmedPhone !== (initialPhone || "").replace(/\D/g, "");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ name: true, email: true, phone: true });
    setServerError("");

    if (!isFormValid || !hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      const response = await adminApi.updateInternalUserProfile(userId, {
        name: trimmedName,
        email: trimmedEmail,
        phone_number: trimmedPhone,
      });

      if (!response?.success) {
        const message =
          response?.error || response?.message || "Failed to update user profile";
        setServerError(message);
        toast.error(message);
        return;
      }

      onSaved({
        name: response.data?.name || trimmedName,
        email: response.data?.email || trimmedEmail,
        phone_number: response.data?.phone_number || trimmedPhone,
      });
    } catch {
      setServerError("Failed to update user profile");
      toast.error("Failed to update user profile");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = `h-[72px] w-full rounded-xl border px-6 text-lg outline-none ${isDark
    ? "border-white/10 bg-transparent text-white placeholder:text-white/50 focus:border-[#E5D5B8]/50"
    : "border-[#E3E3E3] bg-white text-[#101010] placeholder:text-[#32323280] focus:border-[#C9A96E]/50"
    }`;
  const labelClassName = `absolute -top-2.5 left-4 z-10 px-2 text-sm font-medium ${isDark
    ? "bg-[#171717] text-white/40"
    : "bg-white text-[#32323299]"
    }`;
  const errorClassName = "mt-1 text-xs text-[#F04438]";
  const invalidInputClassName = "!border-[#F04438] focus:!border-[#F04438] focus-visible:!border-[#F04438] focus-visible:!ring-0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border p-5 shadow-xl md:p-7 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-[#101010]"}`}>Edit Profile</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close"
            className={`transition-colors disabled:opacity-40 ${isDark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-1 gap-2 md:gap-3">
          <div className="relative">
            <Label htmlFor="edit-user-name" className={labelClassName}>
              Full Name
            </Label>
            <Input
              id="edit-user-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setServerError("");
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="Full name"
              className={`${inputClassName} ${touched.name && nameError ? invalidInputClassName : ""}`}
              disabled={isSaving}
              autoComplete="name"
            />
            <div className="min-h-4">
              {touched.name && nameError && <p className={errorClassName}>{nameError}</p>}
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="edit-user-email" className={labelClassName}>
              Email
            </Label>
            <Input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setServerError("");
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="Email"
              className={`${inputClassName} ${((touched.email && emailError) || emailConflict) ? invalidInputClassName : ""}`}
              disabled={isSaving}
              autoComplete="email"
            />
            <div className="min-h-4">
              {touched.email && emailError && <p className={errorClassName}>{emailError}</p>}
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="edit-user-phone" className={labelClassName}>
              Phone Number
            </Label>
            <Input
              id="edit-user-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                setServerError("");
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              placeholder="Phone number (optional)"
              className={`${inputClassName} ${((touched.phone && phoneError) || phoneConflict) ? invalidInputClassName : ""}`}
              maxLength={10}
              disabled={isSaving}
              autoComplete="tel"
            />
            <div className="min-h-4">
              {touched.phone && phoneError && <p className={errorClassName}>{phoneError}</p>}
            </div>
          </div>
          </div>

          {serverError && (
            <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {serverError}
            </p>
          )}

          <div className={`flex items-center justify-end gap-3 border-t pt-3 ${isDark ? "border-white/5" : "border-black/10"}`}>
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className={`h-11 rounded-lg border px-6 ${isDark ? "border-white/10 bg-transparent text-white hover:bg-white/5" : "border-[#D6D6D6] bg-white text-[#101010] hover:bg-black/5"}`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !isFormValid || !hasChanges}
              className="h-11 min-w-[140px] rounded-lg bg-[#E8D1AB] px-6 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
