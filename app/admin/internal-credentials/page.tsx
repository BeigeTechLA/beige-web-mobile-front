"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";
import { calculatePasswordStrength, generateStrongPassword } from "@/lib/utils/password";
import { cn } from "@/lib/utils";

type RoleOption = {
  label: string;
  value: number;
};

type RoleApiRecord = {
  user_role?: string;
  name?: string;
  user_type_id?: string | number;
  role_id?: string | number;
};

const SUPER_ADMIN_ROLE_ID = 8;

const formatRoleLabel = (role: RoleApiRecord) => {
  const rawId = Number(role?.user_type_id ?? role?.role_id);
  if (rawId === SUPER_ADMIN_ROLE_ID) return "Super Admin";
  return role?.user_role ?? role?.name ?? `Role ${rawId || ""}`.trim();
};

type InternalCredentialForm = {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  user_type: string;
};

const DEFAULT_FORM: InternalCredentialForm = {
  name: "",
  email: "",
  password: "",
  phone_number: "",
  user_type: "",
};

const STRENGTH_STYLES: Record<ReturnType<typeof calculatePasswordStrength>, string> = {
  Weak: "text-[#D97757]",
  Medium: "text-[#D4A75D]",
  Strong: "text-[#9AAE78]",
};

export default function InternalCredentialsPage() {
  const { allowed, isLoading } = useRequireModulePermission(
    "users",
    "create",
    "/admin/roles-permissions",
  );

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white/60">
        {!isLoading && !allowed ? "No Permission" : null}
      </div>
    );
  }

  return <InternalCredentialsPageContent />;
}

function InternalCredentialsPageContent() {
  const pathname = usePathname();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordWasGenerated, setPasswordWasGenerated] = useState(false);
  const [form, setForm] = useState<InternalCredentialForm>(DEFAULT_FORM);

  useEffect(() => {
    let mounted = true;

    const fetchRoles = async () => {
      setLoadingRoles(true);
      const response = await adminApi.getRoles();

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        const options = response.data
          .map((role: RoleApiRecord) => ({
            label: formatRoleLabel(role),
            value: Number(role?.user_type_id ?? role?.role_id),
          }))
          .filter((role: RoleOption) => Number.isFinite(role.value));

        setRoles(options);
        setForm((prev) =>
          prev.user_type
            ? prev
            : { ...prev, user_type: options[0]?.value ? String(options[0].value) : "" },
        );
      } else {
        toast.error(response?.error || "Failed to load roles.");
      }

      setLoadingRoles(false);
    };

    fetchRoles();

    return () => {
      mounted = false;
    };
  }, []);

  const roleOptions = useMemo(() => roles, [roles]);
  const hasPasswordInput = form.password.trim().length > 0;
  const passwordStrength = hasPasswordInput ? calculatePasswordStrength(form.password) : null;
  const selectedRoleLabel =
    roles.find((role) => String(role.value) === form.user_type)?.label || "No role selected";
  const maskedPassword = form.password ? "••••••••••••" : "Not set";
  const credentialsPreviewText = `Email: ${form.email.trim() || "Not set"}\nRole: ${selectedRoleLabel}\nPassword: ${form.password || "Not set"}`;

  const updateField = (field: keyof InternalCredentialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleGeneratePassword = () => {
    const nextPassword = generateStrongPassword();
    setForm((prev) => ({ ...prev, password: nextPassword }));
    setPasswordWasGenerated(true);
    setPasswordVisible(false);
    setErrors((prev) => ({ ...prev, password: "" }));
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password);
      toast.success("Password copied successfully");
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const handleCopyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(credentialsPreviewText);
      toast.success("Credentials copied successfully");
    } catch {
      toast.error("Failed to copy credentials");
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = "Full name is required.";

    const email = form.email.trim();
    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (form.password.trim().length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.user_type) {
      nextErrors.user_type = "Please select a role.";
    }

    const phone = form.phone_number.trim();
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      nextErrors.phone_number = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await adminApi.createInternalCredential({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone_number: form.phone_number.trim() || undefined,
      user_type: Number(form.user_type),
    });

    if (result?.success) {
      toast.success("Internal credential created successfully");
      const firstRole = roles[0]?.value ? String(roles[0].value) : "";
      setForm({ ...DEFAULT_FORM, user_type: firstRole });
      setPasswordVisible(false);
      setPasswordWasGenerated(false);
    } else {
      toast.error(result?.error || result?.message || "Failed to create credential");
    }

    setLoading(false);
  };

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(229,213,184,0.12),_transparent_28%),linear-gradient(180deg,_rgba(17,17,17,0.92),_rgba(12,12,12,1))] px-4 py-4 lg:px-6 lg:py-4">
        <div className="mx-auto max-w-4xl">
          <Card className="border-white/10 bg-[#151515]/95 shadow-[0_10px_40px_rgba(0,0,0,0.24)] backdrop-blur">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="space-y-5">
                <section className="space-y-4">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-white">User Information</h2>
                    <p className="text-xs text-white/45">Enter the contact details and assign the role.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                        Full Name
                      </label>
                      <Input
                        autoComplete="off"
                        className={cn(
                          "border-white/15 bg-[#111111] transition-all placeholder:text-white/35 focus-visible:border-[#E5D5B8] focus-visible:ring-[#E5D5B8]/30",
                          errors.name && "border-[#F04438]",
                        )}
                        placeholder="Full name"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                      />
                      {errors.name ? <p className="text-xs text-[#F04438]">{errors.name}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                        Email
                      </label>
                      <Input
                        type="email"
                        autoComplete="off"
                        name="internal-email"
                        className={cn(
                          "border-white/15 bg-[#111111] transition-all placeholder:text-white/35 focus-visible:border-[#E5D5B8] focus-visible:ring-[#E5D5B8]/30",
                          errors.email && "border-[#F04438]",
                        )}
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                      />
                      {errors.email ? <p className="text-xs text-[#F04438]">{errors.email}</p> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                        Phone Number
                      </label>
                      <Input
                        autoComplete="off"
                        className={cn(
                          "border-white/15 bg-[#111111] transition-all placeholder:text-white/35 focus-visible:border-[#E5D5B8] focus-visible:ring-[#E5D5B8]/30",
                          errors.phone_number && "border-[#F04438]",
                        )}
                        placeholder="Phone number (optional)"
                        value={form.phone_number}
                        onChange={(e) => updateField("phone_number", e.target.value)}
                      />
                      {errors.phone_number ? (
                        <p className="text-xs text-[#F04438]">{errors.phone_number}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                        Role
                      </label>
                      <Select
                        value={form.user_type}
                        onValueChange={(value) => updateField("user_type", value)}
                        disabled={loadingRoles}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-12 w-full border-white/15 bg-[#111111] text-white transition-all focus:ring-[#E5D5B8]/30",
                            errors.user_type && "border-[#F04438]",
                          )}
                        >
                          <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role"} />
                        </SelectTrigger>
                        <SelectContent className="border border-white/15 bg-[#111111] text-white">
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={String(role.value)}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.user_type ? <p className="text-xs text-[#F04438]">{errors.user_type}</p> : null}
                    </div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-white/10 pt-4">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-semibold text-white">Security</h2>
                    <p className="text-xs text-white/45">
                      Control password visibility, generation, and strength.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            type={passwordVisible ? "text" : "password"}
                            autoComplete="new-password"
                            name="internal-password"
                            className={cn(
                              "pr-28 border-white/15 bg-[#111111] transition-all placeholder:text-white/35 focus-visible:border-[#E5D5B8] focus-visible:ring-[#E5D5B8]/30",
                              errors.password && "border-[#F04438]",
                            )}
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => {
                              updateField("password", e.target.value);
                              setPasswordWasGenerated(false);
                            }}
                          />
                          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                            {form.password ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleCopyPassword}
                                className="h-8 w-8 rounded-md text-white/60 hover:bg-white/5 hover:text-white"
                                aria-label="Copy password"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPasswordVisible((prev) => !prev)}
                              className="h-8 w-8 rounded-md text-white/60 hover:bg-white/5 hover:text-white"
                              aria-label={passwordVisible ? "Hide password" : "Show password"}
                            >
                              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Password Strength</span>
                          <span className={cn("font-medium", passwordStrength ? STRENGTH_STYLES[passwordStrength] : "text-transparent")}>
                            {passwordStrength || "\u00A0"}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              !passwordStrength && "w-0 bg-transparent",
                              passwordStrength === "Weak" && "w-1/3 bg-[#D97757]",
                              passwordStrength === "Medium" && "w-2/3 bg-[#D4A75D]",
                              passwordStrength === "Strong" && "w-full bg-[#9AAE78]",
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGeneratePassword}
                          className="h-10 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate Password
                        </Button>
                        <p className="text-xs leading-5 text-white/45">
                          Strong passwords are 12 characters with mixed character types.
                        </p>
                        {errors.password ? <p className="text-xs text-[#F04438]">{errors.password}</p> : null}
                        {passwordWasGenerated ? (
                          <p className="text-xs text-white/45">Password generated and ready to copy.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="space-y-0.5">
                        <h2 className="text-sm font-semibold text-white">Credential Preview</h2>
                        <p className="text-xs text-white/45">Live read-only summary before you submit.</p>
                      </div>

                      <div className="grid gap-3 text-sm">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Email</p>
                          <p className="mt-1 break-all text-white">{form.email.trim() || "Not set"}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Selected Role</p>
                          <p className="mt-1 text-white">{selectedRoleLabel}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Password</p>
                          <p className="mt-1 text-white">{maskedPassword}</p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyCredentials}
                        className="h-10 w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Credentials
                      </Button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex flex-col items-left gap-2">
                  {/* <div className="text-center text-sm leading-6 text-white/55">
                    The create button is locked while the request is in flight.
                  </div> */}
                  <Button
                    type="submit"
                    onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
                    isLoading={loading}
                    disabled={loading || loadingRoles}
                    className="h-11 min-w-[220px] bg-[#E5D5B8] px-6 text-sm font-semibold text-black hover:bg-[#d8c6a7]"
                  >
                    {loading ? "Creating..." : "Create Credential"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
