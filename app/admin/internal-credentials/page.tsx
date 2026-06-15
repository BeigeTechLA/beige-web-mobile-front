"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

type RoleOption = {
  label: string;
  value: number;
};

const DEFAULT_FORM = {
  name: "",
  email: "",
  password: "",
  phone_number: "",
  user_type: "",
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
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let mounted = true;

    const fetchRoles = async () => {
      setLoadingRoles(true);
      const response = await adminApi.getRoles();

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        const options = response.data
          .map((role: any) => ({
            label: role?.user_role ?? role?.name ?? `Role ${role?.user_type_id}`,
            value: Number(role?.user_type_id ?? role?.role_id),
          }))
          .filter((role: RoleOption) => Number.isFinite(role.value));

        setRoles(options);
        setForm((prev) => prev.user_type ? prev : { ...prev, user_type: options[0]?.value ? String(options[0].value) : "" });
      } else {
        setMessage(response?.error || "Failed to load roles.");
      }

      setLoadingRoles(false);
    };

    fetchRoles();

    return () => {
      mounted = false;
    };
  }, []);

  const roleOptions = useMemo(() => roles, [roles]);

  const updateField = (field: keyof typeof DEFAULT_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
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

    if (!validateForm()) {
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await adminApi.createInternalCredential({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone_number: form.phone_number.trim() || undefined,
      user_type: Number(form.user_type),
    });

    if (result?.success) {
      setMessage("Credential created successfully.");
      setForm(DEFAULT_FORM);
      if (roles[0]) {
        setForm((prev) => ({ ...prev, user_type: String(roles[0].value) }));
      }
    } else {
      setMessage(result?.error || "Failed to create credential.");
    }

    setLoading(false);
  };

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="p-4 lg:p-8">
        <div className="max-w-2xl rounded-xl border border-white/10 bg-[#151515] p-6">
          <h1 className="text-xl font-semibold text-white">Create Internal Credential</h1>
          <p className="mt-1 text-sm text-white/70">
            Select a role from the live API and create the internal user credential.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="off" noValidate>
            <div className="space-y-1.5">
              <Input
                autoComplete="off"
                className={`w-full rounded-md border bg-transparent px-3 py-2 text-white outline-none ${errors.name ? "border-[#F04438]" : "border-white/20"}`}
                placeholder="Full name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              {errors.name ? <p className="text-xs text-[#F04438]">{errors.name}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Input
                type="email"
                autoComplete="off"
                name="internal-email"
                className={`w-full rounded-md border bg-transparent px-3 py-2 text-white outline-none ${errors.email ? "border-[#F04438]" : "border-white/20"}`}
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
              {errors.email ? <p className="text-xs text-[#F04438]">{errors.email}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Input
                type="password"
                autoComplete="new-password"
                name="internal-password"
                className={`w-full rounded-md border bg-transparent px-3 py-2 text-white outline-none ${errors.password ? "border-[#F04438]" : "border-white/20"}`}
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
              {errors.password ? <p className="text-xs text-[#F04438]">{errors.password}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Input
                autoComplete="off"
                className={`w-full rounded-md border bg-transparent px-3 py-2 text-white outline-none ${errors.phone_number ? "border-[#F04438]" : "border-white/20"}`}
                placeholder="Phone number (optional)"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
              />
              {errors.phone_number ? <p className="text-xs text-[#F04438]">{errors.phone_number}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Select
                value={form.user_type}
                onValueChange={(value) => updateField("user_type", value)}
                disabled={loadingRoles}
              >
                <SelectTrigger className={`w-full rounded-md border bg-transparent px-3 py-2 text-white outline-none focus:ring-[#E5D5B8]/40 ${errors.user_type ? "border-[#F04438]" : "border-white/20"}`}>
                  <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select role"} />
                </SelectTrigger>
                <SelectContent className="border border-white/20 bg-[#111] text-white">
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={String(role.value)}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_type ? <p className="text-xs text-[#F04438]">{errors.user_type}</p> : null}
            </div>

            <Button type="submit" disabled={loading || loadingRoles} className="bg-[#E5D5B8] text-black hover:bg-[#d8c6a7]">
              {loading ? "Creating..." : "Create Credential"}
            </Button>
          </form>

          {message ? <p className="mt-4 text-sm text-white/80">{message}</p> : null}
        </div>
      </div>
    </>
  );
}
