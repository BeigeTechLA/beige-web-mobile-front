"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { isSuperAdminUser } from "@/lib/permissions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface ClientProfileEditProps {
  id: string;
}

type ClientForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type ClientFormErrors = Partial<Record<keyof ClientForm, string>>;

type ClientSummary = {
  id: string;
  type: "registered" | "guest";
  isActive: boolean;
  referralCode: string | null;
};

const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const getFullName = (values: ClientForm) =>
  [values.firstName.trim(), values.lastName.trim()].filter(Boolean).join(" ");

const getErrorMessage = (error: any, fallback: string) =>
  error?.error && typeof error.error === "string"
    ? error.error
    : error?.response?.data?.message || error?.message || fallback;

export function ClientProfileEdit({ id }: ClientProfileEditProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const requestIdRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});
  const [data, setData] = useState<ClientForm | null>(null);
  const [initialData, setInitialData] = useState<ClientForm | null>(null);
  const [summary, setSummary] = useState<ClientSummary | null>(null);

  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/admin/")
    ? rawReturnTo
    : "/admin/users/clients";
  const detailUrl = `/admin/users/clients/${encodeURIComponent(id)}?returnTo=${encodeURIComponent(returnTo)}`;

  const loadProfile = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setInitialLoading(true);
    setLoadError("");

    try {
      const result = await adminApi.getClientById(id);
      if (requestId !== requestIdRef.current) return;

      if (
        !result ||
        result.error === true ||
        result.success === false ||
        !result.data?.client
      ) {
        throw new Error(
          getErrorMessage(result, "Unable to load client profile"),
        );
      }

      const client = result.data.client;
      const name = splitFullName(String(client.name || ""));
      const values: ClientForm = {
        ...name,
        email: String(client.email || ""),
        phoneNumber: String(client.phone_number || ""),
      };

      setData(values);
      setInitialData(values);
      setSummary({
        id: String(client.client_id ?? id),
        type: client.client_type === "registered" ? "registered" : "guest",
        isActive: Number(client.is_active) === 1,
        referralCode: result.data.affiliate?.referral_code || null,
      });
      setFormErrors({});
      setSaveError("");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(getErrorMessage(error, "Failed to load client profile"));
    } finally {
      if (requestId === requestIdRef.current) setInitialLoading(false);
    }
  }, [id]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (isSuperAdmin) {
      void loadProfile();
    } else {
      setInitialLoading(false);
    }
    return () => {
      requestIdRef.current += 1;
    };
  }, [mounted, isSuperAdmin, loadProfile]);

  const hasChanges = useMemo(() => {
    if (!data || !initialData) return false;
    return (
      getFullName(data) !== getFullName(initialData) ||
      data.email.trim().toLowerCase() !==
        initialData.email.trim().toLowerCase() ||
      data.phoneNumber.trim() !== initialData.phoneNumber.trim()
    );
  }, [data, initialData]);

  const updateField = (field: keyof ClientForm, value: string) => {
    setData((previous) =>
      previous ? { ...previous, [field]: value } : previous,
    );
    setFormErrors((previous) => ({ ...previous, [field]: undefined }));
    setSaveError("");
  };

  const handleLeaveEdit = () => router.replace(detailUrl);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !data ||
      !initialData ||
      !isSuperAdmin ||
      !summary?.isActive ||
      isSaving
    )
      return;

    const errors: ClientFormErrors = {};
    const fullName = getFullName(data);
    const email = data.email.trim().toLowerCase();
    const phoneNumber = data.phoneNumber.trim();
    const phoneDigits = phoneNumber.replace(/\D/g, "");

    if (!data.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (fullName.length > 200) {
      errors.firstName = "Full name cannot exceed 200 characters";
    }

    if (!email) {
      errors.email = "Email address is required";
    } else if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email = "Enter a valid email address";
    }

    if (
      phoneNumber &&
      (phoneNumber.length > 20 ||
        phoneDigits.length < 7 ||
        phoneDigits.length > 15 ||
        /[^\d+().\s-]/.test(phoneNumber))
    ) {
      errors.phoneNumber = "Enter a valid phone number (7 to 15 digits)";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    const payload: {
      name?: string;
      email?: string;
      phone_number?: string | null;
    } = {};
    if (fullName !== getFullName(initialData)) payload.name = fullName;
    if (email !== initialData.email.trim().toLowerCase()) payload.email = email;
    if (phoneNumber !== initialData.phoneNumber.trim())
      payload.phone_number = phoneNumber || null;

    if (!Object.keys(payload).length) {
      toast.info("No profile changes to save");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      const result = await adminApi.updateClientProfile(id, payload);
      if (!result || result.error === true || result.success === false) {
        throw new Error(
          getErrorMessage(result, "Failed to update client profile"),
        );
      }
      toast.success(result.message || "Client profile updated successfully");
      router.replace(detailUrl);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update client profile");
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const background = isDark
    ? "bg-[#101010] text-white"
    : "bg-[#F4F5F7] text-black";
  const mutedText = isDark ? "text-white/50" : "text-black/50";
  const fieldStyles = isDark
    ? "border-white/15 bg-[#1A1A1A] text-white placeholder:text-white/30 focus-visible:ring-[#E8D1AB]/50"
    : "border-black/10 bg-white text-black placeholder:text-black/30 focus-visible:ring-[#B08A3C]/50";

  if (!mounted || (isSuperAdmin && initialLoading)) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${background}`}
      >
        <div
          className={`flex flex-col items-center gap-4 rounded-2xl border px-8 py-10 shadow-2xl ${isDark ? "border-white/10 bg-[#111111]" : "border-black/10 bg-white"}`}
        >
          <Loader2 className="h-10 w-10 animate-spin text-[#E8D1AB]" />
          <p className="text-base font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin || loadError || !summary || !summary.isActive || !data) {
    const message = !isSuperAdmin
      ? "Only a Super Admin can edit client profiles."
      : loadError ||
        (summary && !summary.isActive
          ? "Archived client profiles cannot be edited."
          : "Client profile is unavailable.");

    return (
      <div
        className={`flex min-h-screen items-center justify-center p-4 ${background}`}
      >
        <div
          className={`w-full max-w-md rounded-2xl border p-8 text-center ${isDark ? "border-white/10 bg-[#101010]" : "border-black/10 bg-white"}`}
        >
          <AlertCircle className="mx-auto mb-4 h-9 w-9 text-[#E8D1AB]" />
          <p className="text-lg font-semibold">Unable to edit client profile</p>
          <p className={`mt-2 text-sm ${mutedText}`}>{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleLeaveEdit}
              className={`rounded-xl ${isDark ? "border-white/15 text-white hover:bg-white/10" : "border-black/10 text-black"}`}
            >
              Back to Profile
            </Button>
            {isSuperAdmin && loadError && (
              <Button
                type="button"
                onClick={() => void loadProfile()}
                className="rounded-xl bg-[#E8D1AB] text-black hover:bg-[#d9c39d]"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const labelStyles = isDark ? "text-white/60" : "text-black/60";
  const readOnlyStyles = isDark
    ? "border-white/10 bg-white/[0.04] text-white"
    : "border-black/10 bg-[#F4F5F7] text-black";

  const field = (
    name: keyof ClientForm,
    label: string,
    type: string,
    required = false,
    placeholder = "",
  ) => (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={`client-edit-${name}`} className={labelStyles}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={`client-edit-${name}`}
        type={type}
        value={data[name]}
        onChange={(event) => updateField(name, event.target.value)}
        aria-invalid={Boolean(formErrors[name])}
        autoComplete={
          name === "firstName"
            ? "given-name"
            : name === "lastName"
              ? "family-name"
              : name === "email"
                ? "email"
                : "tel"
        }
        maxLength={name === "email" ? 255 : name === "phoneNumber" ? 20 : 200}
        placeholder={placeholder}
        className={`${fieldStyles} mt-2 h-14 rounded-[12px] px-4 ${formErrors[name] ? "border-red-500 focus-visible:ring-red-500/40" : ""}`}
      />
      {formErrors[name] && (
        <p className="text-xs text-red-500" role="alert">
          {formErrors[name]}
        </p>
      )}
    </div>
  );

  const summaryField = (label: string, value: string) => (
    <div className="min-w-0 space-y-2">
      <Label className={labelStyles}>{label}</Label>
      <div
        className={`flex min-h-14 items-center overflow-hidden rounded-[12px] border px-4 py-3 text-sm ${readOnlyStyles}`}
      >
        <span className="truncate">{value}</span>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen ${background}`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div className="mx-auto flex h-screen w-full max-w-7xl flex-col overflow-hidden px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${isDark ? "border-white/10 bg-black/10" : "border-black/10 bg-white"}`}
        >
          <form
            onSubmit={handleSaveProfile}
            noValidate
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div
              className={`flex shrink-0 flex-col gap-6 border-b px-4 py-5 md:px-8 md:py-6 lg:px-10 ${isDark ? "border-white/10 bg-[#101010]" : "border-black/10 bg-white"}`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={handleLeaveEdit}
                    disabled={isSaving}
                    className="group mb-6 flex items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft
                      className={`mr-2 h-4 w-4 ${isDark ? "text-white/60 group-hover:text-white" : "text-black/55 group-hover:text-black"}`}
                    />
                    <span
                      className={`text-sm transition-colors ${isDark ? "text-white/60 group-hover:text-white" : "text-black/55 group-hover:text-black"}`}
                    >
                      Back
                    </span>
                  </button>
                  <h1 className="text-xl font-semibold leading-tight lg:text-3xl">
                    Edit Client Profile
                  </h1>
                  <p
                    className={`mt-4 text-sm leading-relaxed md:text-lg ${mutedText}`}
                  >
                    Update client information and contact details in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:pb-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLeaveEdit}
                    disabled={isSaving}
                    className={`h-12 w-full rounded-[12px] border px-5 text-sm font-semibold sm:w-36 ${isDark ? "border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white" : "border-black/10 bg-white text-black hover:bg-[#F4F5F7] hover:text-black"}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || !hasChanges}
                    className="h-12 w-full rounded-[12px] bg-[#E8D1AB] px-5 text-sm font-semibold text-black hover:bg-[#d9c39d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-40"
                  >
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-10">
              <div className="w-full space-y-14 pb-8 md:space-y-16">
                <section className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold lg:text-2xl">
                      Basic Information
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Review the client basics before making edits.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {field(
                      "firstName",
                      "First Name",
                      "text",
                      true,
                      "Enter first name",
                    )}
                    {field(
                      "lastName",
                      "Last Name",
                      "text",
                      false,
                      "Enter last name",
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {field(
                      "email",
                      "Email Address",
                      "email",
                      true,
                      "Enter email address",
                    )}
                    {field(
                      "phoneNumber",
                      "Phone Number",
                      "tel",
                      false,
                      "Enter phone number",
                    )}
                  </div>
                  {summary.type === "guest" && (
                    <p className={`text-xs ${mutedText}`}>
                      Guest bookings and financial history are linked by email.
                      Email changes are restricted when matching guest records
                      already exist.
                    </p>
                  )}
                </section>

                <section className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold lg:text-2xl">
                      Account Information
                    </h2>
                    <p className={`text-sm ${mutedText}`}>
                      Account identifiers and status are managed separately and
                      cannot be changed here.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {summaryField("Client ID", `#${summary.id}`)}
                    {summaryField(
                      "Client Type",
                      summary.type === "registered" ? "Registered" : "Guest",
                    )}
                    {summaryField(
                      "Status",
                      summary.isActive ? "Active" : "Archived",
                    )}
                    {summary.referralCode &&
                      summaryField("Referral Code", summary.referralCode)}
                  </div>
                </section>

                {saveError && (
                  <div
                    role="alert"
                    className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${isDark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{saveError}</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
