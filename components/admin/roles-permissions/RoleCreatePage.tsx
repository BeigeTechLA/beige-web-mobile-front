"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";

export function RoleCreatePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    tone: "default" | "danger" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
    tone: "default",
  });

  const openModal = (title: string, description: string, tone: "default" | "danger" | "success" = "default") => {
    setModalState({
      isOpen: true,
      title,
      description,
      tone,
    });
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      openModal("Role Name Required", "Please enter a role name before saving.", "default");
      return;
    }

    setIsSaving(true);

    const payload = {
      name: roleName,
      description: description,
    };

    try {
      const response = await adminApi.createRole(payload);
      if (response.success !== false) {
        router.push("/admin/roles-permissions");
      } else {
        openModal("Failed To Create Role", response.error || "Failed to create role.", "danger");
      }
    } catch (error) {
      console.error(error);
      openModal(
        "Create Role Error",
        "An error occurred while creating the role.",
        "danger",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overflow-hidden px-4 pb-16 pt-5 lg:px-10 lg:pb-24 lg:pt-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 bg-transparent p-0 text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={20} />
          <span className="text-[15px] font-medium">Back</span>
        </button>

        <h1 className="text-[32px] font-bold text-white lg:text-[36px]">Add Roles</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/50 max-w-[700px]">
          Create roles to manage permissions and control what users can access on
          the platform.
        </p>

        <div className="mt-10 space-y-8">
          <div className="flex flex-col gap-3">
            <span className="text-[16px] font-semibold text-white/70">Enter Role Name</span>
            <input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="e.g. Content Manager"
              className="h-20 w-full rounded-[24px] border border-white/10 bg-[#111111] px-8 text-xl text-white outline-none transition focus:border-[#E5D5B8]/50 focus:bg-[#171717] placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[16px] font-semibold text-white/70">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the role's responsibilities..."
              className="min-h-[200px] w-full rounded-[24px] border border-white/10 bg-[#111111] px-8 py-7 text-lg text-white outline-none transition focus:border-[#E5D5B8]/50 focus:bg-[#171717] placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[72px] w-full rounded-[24px] border border-white/10 bg-transparent text-[20px] font-bold text-white transition-all hover:bg-white/5 sm:max-w-[240px]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-[72px] w-full rounded-[24px] bg-[#E5D5B8] text-[20px] font-bold text-black transition-all hover:bg-[#d6c29b] hover:scale-[1.02] active:scale-[0.98] sm:max-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <ActionModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState((current) => ({
            ...current,
            isOpen: false,
          }))
        }
        title={modalState.title}
        description={modalState.description}
        tone={modalState.tone}
        confirmLabel="Close"
        hideCancel
      />
    </div>
  );
}
