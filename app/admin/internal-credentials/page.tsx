"use client";

import React, { useState } from "react";
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

const ROLE_OPTIONS = [
  { label: "Admin", value: 1 },
  { label: "Sales Rep", value: 5 },
  { label: "Production Manager", value: 6 },
  { label: "Sales Admin", value: 7 },
];

export default function InternalCredentialsPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    user_type: 5,
  });

  const updateField = (field: "name" | "email" | "password" | "phone_number", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

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

    const phone = form.phone_number.trim();
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      nextErrors.phone_number = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await adminApi.createInternalCredential(form);

    if (result?.success) {
      setMessage("Credential created successfully.");
      setForm({
        name: "",
        email: "",
        password: "",
        phone_number: "",
        user_type: 5,
      });
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
            Allowed roles: Admin, Sales Rep, Production Manager, Sales Admin
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

            <Select
              value={String(form.user_type)}
              onValueChange={(value) => setForm((prev) => ({ ...prev, user_type: Number(value) }))}
            >
              <SelectTrigger className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-white outline-none focus:ring-[#E5D5B8]/40">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="border border-white/20 bg-[#111] text-white">
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={String(role.value)}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" disabled={loading} className="bg-[#E5D5B8] text-black hover:bg-[#d8c6a7]">
              {loading ? "Creating..." : "Create Credential"}
            </Button>
          </form>

          {message ? <p className="mt-4 text-sm text-white/80">{message}</p> : null}
        </div>
      </div>
    </>
  );
}
