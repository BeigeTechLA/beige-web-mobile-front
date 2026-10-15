"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Bell,
  Check,
  Loader2,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AssignmentSuccessAnimation from "./AssignmentSuccessAnimation";
import {
  readProducerDemoAssignment,
  STATIC_PRODUCERS,
} from "./producerDemoStore";

export type ProducerAvailability =
  | "available"
  | "available_today"
  | "limited_capacity"
  | "unavailable";

export interface ProducerOption {
  id: string;
  name: string;
  role: "Producer";
  activeShoots: number;
  availability: ProducerAvailability;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface ProducerAssignmentResult {
  success: boolean;
  error?: string;
  notificationSent?: boolean;
}

export interface ProducerAssignmentApi {
  list: (projectId: string) => Promise<ProducerOption[]>;
  assign: (
    projectId: string,
    producerId: string,
  ) => Promise<ProducerAssignmentResult>;
  change: (
    projectId: string,
    producerId: string,
  ) => Promise<ProducerAssignmentResult>;
  remove: (projectId: string) => Promise<ProducerAssignmentResult>;
}

interface ProjectProducerProps {
  projectId: string;
  project?: Record<string, unknown> | null;
  isDark: boolean;
  canAssign?: boolean;
  canEdit?: boolean;
  api?: ProducerAssignmentApi;
  demoMode?: boolean;
  onAssignmentChanged?: () => void | Promise<void>;
  onRequestAssignment?: (continueAction: () => void) => void;
}

type ProducerModalStep =
  | "selection"
  | "confirmation"
  | "success"
  | "remove"
  | null;
type AssignmentAction = "assign" | "change";

const DEMO_PRODUCERS = STATIC_PRODUCERS;

const readObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";

const getAssignedProducer = (
  project?: Record<string, unknown> | null,
): ProducerOption | null => {
  if (!project) return null;
  const raw =
    project.project_producer ??
    project.assigned_producer ??
    project.producer ??
    project.production_owner ??
    project.producer_assignment;
  const assigned = readObject(raw);
  const profile =
    readObject(assigned?.producer) ||
    readObject(assigned?.user) ||
    readObject(assigned?.profile) ||
    assigned;
  const assignedId = readString(
    profile?.id ??
      profile?.user_id ??
      assigned?.producer_id ??
      project.assigned_producer_id ??
      project.project_producer_id ??
      project.producer_id ??
      raw,
  );
  if (!assignedId) return null;

  const name =
    readString(profile?.name ?? profile?.full_name) ||
    [readString(profile?.first_name), readString(profile?.last_name)]
      .filter(Boolean)
      .join(" ") ||
    `Producer #${assignedId}`;
  const photo = readString(
    profile?.avatar_url ??
      profile?.avatarUrl ??
      profile?.avatar ??
      profile?.profile_picture ??
      profile?.profile_image ??
      profile?.photo_url ??
      profile?.image_url,
  );

  return {
    id: assignedId,
    name,
    role: "Producer",
    activeShoots:
      Number(profile?.active_shoots ?? profile?.activeShoots ?? 0) || 0,
    availability: "available",
    avatarUrl: photo || null,
  };
};

const availabilityLabel: Record<ProducerAvailability, string> = {
  available: "Available",
  available_today: "Available today",
  limited_capacity: "Limited capacity",
  unavailable: "Unavailable",
};

function ProducerAvatar({
  producer,
  className = "h-14 w-14",
  rounded = "rounded-full",
}: {
  producer: ProducerOption;
  className?: string;
  rounded?: string;
}) {
  const initials = producer.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${rounded} ${className} bg-[#E8D1AB] text-[#171717]`}
    >
      {producer.avatarUrl ? (
        <Image
          src={producer.avatarUrl}
          alt={producer.name}
          width={500}
          height={500}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xl font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
}

export default function ProjectProducer({
  projectId,
  project,
  isDark,
  canAssign = false,
  canEdit = false,
  api,
  demoMode = true,
  onAssignmentChanged,
  onRequestAssignment,
}: ProjectProducerProps) {
  const isDemo = demoMode;
  const [localProducer, setLocalProducer] = useState<ProducerOption | null>(
    null,
  );
  const [hasLocalOverride, setHasLocalOverride] = useState(false);
  const [step, setStep] = useState<ProducerModalStep>(null);
  const [action, setAction] = useState<AssignmentAction>("assign");
  const [options, setOptions] = useState<ProducerOption[]>(
    isDemo ? DEMO_PRODUCERS : [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState("");
  const [notificationSent, setNotificationSent] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const saved = isDemo ? readProducerDemoAssignment(projectId) : undefined;
    setLocalProducer(
      saved?.producerId
        ? DEMO_PRODUCERS.find((producer) => producer.id === saved.producerId) ||
            null
        : null,
    );
    setHasLocalOverride(saved !== undefined);
    setSelectedId(null);
    setStep(null);
  }, [projectId, isDemo]);

  const liveProducer = getAssignedProducer(project);
  const assignedProducer = hasLocalOverride ? localProducer : liveProducer;
  // A pre-existing server assignment remains visible, but the static demo must not mask it.
  const isReadOnlyLiveAssignment =
    isDemo && !hasLocalOverride && Boolean(liveProducer);
  const selectedProducer =
    options.find((producer) => producer.id === selectedId) || null;
  const projectName = readString(project?.project_name) || "this shoot";
  const shootCode =
    readString(
      project?.shoot_number ?? project?.shoot_code ?? project?.shoot_id,
    ) || `#${projectId}`;
  const canManage = assignedProducer ? canEdit : canAssign || canEdit;

  useEffect(() => {
    if (step !== "selection" || !api) return;
    let cancelled = false;
    setLoadingOptions(true);
    setListError("");
    api
      .list(projectId)
      .then((response) => {
        if (cancelled) return;
        if (!Array.isArray(response))
          throw new Error("Invalid producer list response");
        setOptions(
          response.filter(
            (producer) =>
              producer?.role === "Producer" && producer.isActive !== false,
          ),
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setOptions([]);
        setListError(
          error instanceof Error ? error.message : "Unable to load producers",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, projectId, step, reloadKey]);

  const eligibleOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return options.filter((producer) => {
      if (producer.isActive === false || producer.role !== "Producer")
        return false;
      return !query || producer.name.toLowerCase().includes(query);
    });
  }, [options, searchQuery]);

  const openSelect = (nextAction: AssignmentAction) => {
    if (
      (nextAction === "assign" && !canManage) ||
      (nextAction === "change" && (!canEdit || isReadOnlyLiveAssignment))
    )
      return;
    const proceed = () => {
      setAction(nextAction);
      setSearchQuery("");
      setSelectedId(null);
      setListError("");
      setStep("selection");
    };
    if (nextAction === "assign" && onRequestAssignment) {
      onRequestAssignment(proceed);
      return;
    }
    proceed();
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setStep(null);
    setSelectedId(null);
    setSearchQuery("");
  };

  const commitAssignment = async () => {
    if (!selectedProducer || isSubmitting) return;
    if (action === "change" && assignedProducer?.id === selectedProducer.id)
      return;
    setIsSubmitting(true);
    try {
      let notified = false;
      if (api) {
        const result =
          action === "change"
            ? await api.change(projectId, selectedProducer.id)
            : await api.assign(projectId, selectedProducer.id);
        if (result?.success !== true)
          throw new Error(result?.error || "Unable to assign producer");
        notified = result.notificationSent === true;
      }
      setNotificationSent(notified);
      setLocalProducer(selectedProducer);
      setHasLocalOverride(true);
      setStep("success");
      if (!isDemo && api && onAssignmentChanged) {
        Promise.resolve(onAssignmentChanged()).catch((error) => {
          console.error(
            "Producer assignment saved, but shoot refresh failed:",
            error,
          );
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to assign producer",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeProducer = async () => {
    if (
      !assignedProducer ||
      !canEdit ||
      isReadOnlyLiveAssignment ||
      isSubmitting
    )
      return;
    setIsSubmitting(true);
    try {
      if (api) {
        const result = await api.remove(projectId);
        if (result?.success !== true)
          throw new Error(result?.error || "Unable to remove producer");
      }
      setHasLocalOverride(true);
      setLocalProducer(null);
      setStep(null);
      if (!isDemo && api) {
        if (onAssignmentChanged) {
          Promise.resolve(onAssignmentChanged()).catch((error) => {
            console.error("Producer removed, but shoot refresh failed:", error);
          });
        }
        toast.success("Producer removed successfully");
      } else {
        toast.info(
          "Preview only: producer removed locally. No backend changes were made.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove producer",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = isDark
    ? "border-[#333333] bg-[#202020] text-white placeholder:text-white/35"
    : "border-[#E5E5E5] bg-[#F4F5F7] text-[#171717] placeholder:text-[#777777]";
  const modalClass = isDark
    ? "border-[#3D3D3D] bg-black text-white"
    : "border-[#DADADA] bg-white text-[#171717]";
  const secondaryButton = isDark
    ? "bg-[#202020] text-white hover:bg-[#2C2C2C]"
    : "bg-[#F1F1F1] text-[#171717] hover:bg-[#E5E5E5]";
  const primaryButton =
    "bg-[#E8D1AB] text-black hover:bg-[#DCC69F] disabled:opacity-45";

  return (
    <>
      <div
        className={`w-full overflow-hidden rounded-xl border transition-colors lg:rounded-2xl ${isDark ? "border-[#252525] bg-[#101010]" : "border-[#E5E5E5] bg-[#F4F5F7]"}`}
      >
        <div
          className={`flex h-[65px] items-center justify-between border-b border-dashed px-5 lg:px-6 ${isDark ? "border-[#333333]" : "border-[#D7D7D7]"}`}
        >
          <h3
            className={`text-base font-medium ${isDark ? "text-white" : "text-[#171717]"}`}
          >
            Project Producer
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-xs ${assignedProducer ? (isDark ? "bg-[#25351E] text-[#A5E9A9]" : "bg-[#DCFCE7] text-[#166534]") : isDark ? "bg-[#1D1D1D] text-white/50" : "bg-[#E8E8E8] text-[#555555]"}`}
          >
            {assignedProducer ? "Assigned" : "Unassigned"}
          </span>
        </div>
        {assignedProducer ? (
          <div className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-6 lg:p-6">
            <ProducerAvatar
              producer={assignedProducer}
              className="h-[170px] w-full sm:h-[190px]"
              rounded="rounded-xl"
            />
            <div className="flex min-w-0 flex-col justify-center gap-4">
              <div>
                <h4
                  className={`truncate text-lg font-semibold lg:text-xl ${isDark ? "text-white" : "text-[#171717]"}`}
                >
                  {assignedProducer.name}
                </h4>
                <p
                  className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-[#676767]"}`}
                >
                  Production Owner
                </p>
                {isReadOnlyLiveAssignment && (
                  <p
                    className={`mt-2 text-xs ${isDark ? "text-[#CBA55D]" : "text-[#8A6835]"}`}
                  >
                    API assignment · read-only in static preview
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => openSelect("change")}
                  disabled={!canEdit || isReadOnlyLiveAssignment}
                  className={`h-11 w-full rounded-lg text-sm font-medium ${primaryButton}`}
                >
                  Change Producer
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("remove")}
                  disabled={!canEdit || isReadOnlyLiveAssignment}
                  className={`h-11 w-full rounded-lg text-sm font-medium ${isDark ? "bg-[#2A1417] text-[#F2AAAA] hover:bg-[#3A191F]" : "bg-[#FFF0F0] text-[#B42318] hover:bg-[#FFE2E2]"}`}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 py-8 text-center ${isDark ? "bg-[#0D0D0D]" : "bg-[#FAFAFA]"}`}
          >
            <button
              type="button"
              onClick={() => openSelect("assign")}
              disabled={!canManage}
              title={
                canManage
                  ? "Assign Producer to Shoot"
                  : "Edit permission not allowed"
              }
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8D1AB] text-black transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8D1AB] disabled:cursor-not-allowed disabled:opacity-40 lg:h-[74px] lg:w-[74px]"
            >
              <Plus className="h-9 w-9" strokeWidth={1.8} />
            </button>
            <h4
              className={`mt-1 text-base font-semibold lg:text-lg ${isDark ? "text-[#E8D1AB]" : "text-[#866841]"}`}
            >
              Assign Producer to Shoot
            </h4>
            <p
              className={`text-sm ${isDark ? "text-white/40" : "text-[#737373]"}`}
            >
              Production Owner
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={step === "selection"}
        onOpenChange={(open: boolean) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          className={`h-[min(720px,calc(100dvh_-_24px))] w-[calc(100%_-_24px)] max-w-[875px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border p-0 shadow-[0_20px_75px_rgba(0,0,0,0.65)] sm:h-[min(720px,calc(100dvh_-_48px))] [&>button:last-child]:hidden ${modalClass}`}
        >
          <div
            className={`flex shrink-0 items-center justify-between gap-4 border-b px-4 py-4 sm:px-7 sm:py-6 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}
          >
            <DialogTitle className="min-w-0 text-xl font-semibold sm:text-[28px]">
              {action === "change" ? "Change Producer" : "Assign Producer"}
            </DialogTitle>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              aria-label="Close"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12 ${isDark ? "bg-[#252121] hover:bg-[#343030]" : "bg-[#F4F5F7] hover:bg-[#E8E8E8]"}`}
            >
              <X size={23} />
            </button>
          </div>
          <DialogDescription className="sr-only">
            Search for an eligible producer and select one producer for this
            shoot.
          </DialogDescription>
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:gap-5 sm:px-7 sm:py-6">
            <div className="relative shrink-0">
              <Search
                className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? "text-white/35" : "text-[#888888]"}`}
              />
              <input
                value={searchQuery}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search Producer Name..."
                aria-label="Search producer name"
                className={`h-12 w-full rounded-xl border pl-11 pr-4 text-sm outline-none focus:border-[#E8D1AB] ${inputClass}`}
              />
            </div>
            <div className="space-y-2 pr-0.5">
              {loadingOptions ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={25} className="animate-spin text-[#E8D1AB]" />
                </div>
              ) : listError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-sm">
                  <AlertCircle className="text-red-400" />
                  <p>{listError}</p>
                  <Button
                    type="button"
                    onClick={() => setReloadKey((value) => value + 1)}
                    className={secondaryButton}
                  >
                    Try Again
                  </Button>
                </div>
              ) : eligibleOptions.length === 0 ? (
                <div
                  className={`py-12 text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}
                >
                  No matching producers found.
                </div>
              ) : (
                eligibleOptions.map((producer) => {
                  const selected = selectedId === producer.id;
                  const alreadyAssigned =
                    action === "change" && assignedProducer?.id === producer.id;
                  const unavailable = producer.availability === "unavailable";
                  return (
                    <button
                      key={producer.id}
                      type="button"
                      disabled={unavailable || alreadyAssigned}
                      onClick={() => setSelectedId(producer.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-4 text-left transition-colors sm:gap-4 sm:px-4 ${selected ? "border-[#B89A69] bg-[#E8D1AB]/10" : isDark ? "border-[#242424] bg-[#101010] hover:border-[#47403A]" : "border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#CDBB9C]"} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <ProducerAvatar
                        producer={producer}
                        className="h-12 w-12 sm:h-14 sm:w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`truncate text-sm font-semibold sm:text-base ${isDark ? "text-white" : "text-[#171717]"}`}
                          >
                            {producer.name}
                          </span>
                          {selected && (
                            <span className="rounded-full border border-[#167F35]/60 bg-[#0D2B17]/50 px-2 py-0.5 text-[10px] font-medium text-[#23C463]">
                              Selected
                            </span>
                          )}
                          {alreadyAssigned && (
                            <span
                              className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}
                            >
                              (Current producer)
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-0.5 text-xs sm:text-sm ${isDark ? "text-white/45" : "text-[#666666]"}`}
                        >
                          Producer{" "}
                          <span
                            className={`${isDark ? "text-[#E8D1AB]" : "text-[#93713D]"}`}
                          >
                            · {producer.activeShoots} active shoots
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div
                          className={`hidden items-center gap-2 text-xs sm:flex sm:text-sm ${isDark ? "text-white/55" : "text-[#555555]"}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${producer.availability === "limited_capacity" ? "bg-[#CBA55D]" : unavailable ? "bg-red-400" : "bg-[#53DCAA]"}`}
                          />
                          {availabilityLabel[producer.availability]}
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : isDark ? "border-[#4B4B4B]" : "border-[#BDBDBD]"}`}
                        >
                          {selected && <Check size={14} strokeWidth={2.5} />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <p
              className={`text-xs sm:text-sm ${isDark ? "text-white/35" : "text-[#777777]"}`}
            >
              CPs, sales-only users, inactive users, and clients are excluded
              from the producer list.
            </p>
            {isDemo && (
              <p
                className={`text-xs ${isDark ? "text-[#CBA55D]" : "text-[#8A6835]"}`}
              >
                Demo mode: sample producers only. Assignments are saved in this
                browser tab; no emails are sent.
              </p>
            )}
          </div>
          <div
            className={`shrink-0 border-t px-4 py-4 sm:px-7 sm:py-5 ${isDark ? "border-[#333333] bg-black" : "border-[#E5E5E5] bg-white"}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={closeModal}
                className={`h-11 w-full rounded-lg text-sm font-medium sm:h-12 ${secondaryButton}`}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedProducer || loadingOptions || !!listError}
                onClick={() => setStep("confirmation")}
                className={`h-11 w-full rounded-lg text-sm font-medium sm:h-12 ${primaryButton}`}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={step === "confirmation"}
        onOpenChange={(open: boolean) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          className={`max-h-[calc(100dvh_-_24px)] w-[calc(100%_-_32px)] max-w-[455px] gap-0 overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-2xl sm:max-h-[calc(100dvh_-_48px)] sm:p-6 [&>button:last-child]:hidden ${modalClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isDark ? "border-[#473B2B] bg-[#1D1A16] text-[#E8D1AB]" : "border-[#E6D4B7] bg-[#FFF8EC] text-[#9A7641]"}`}
            >
              <UsersRound size={19} />
            </span>
            <DialogTitle className="text-xl font-medium">
              {action === "change" ? "Change Producer?" : "Assign Producer?"}
            </DialogTitle>
          </div>
          <DialogDescription
            className={`mt-4 text-sm leading-6 ${isDark ? "text-white/60" : "text-[#616161]"}`}
          >
            {action === "change"
              ? "You are changing the Producer for "
              : "You are assigning "}
            {action === "change" ? (
              <>
                <strong
                  className={isDark ? "text-[#E8D1AB]" : "text-[#8A6835]"}
                >
                  {assignedProducer?.name}
                </strong>{" "}
                to{" "}
                <strong
                  className={isDark ? "text-[#E8D1AB]" : "text-[#8A6835]"}
                >
                  {selectedProducer?.name}
                </strong>{" "}
                for{" "}
                <strong className={isDark ? "text-white" : "text-black"}>
                  {projectName}
                </strong>{" "}
                · {shootCode}.
              </>
            ) : (
              <>
                <strong
                  className={isDark ? "text-[#E8D1AB]" : "text-[#8A6835]"}
                >
                  {selectedProducer?.name}
                </strong>{" "}
                as the Producer for{" "}
                <strong className={isDark ? "text-white" : "text-black"}>
                  {projectName}
                </strong>{" "}
                · {shootCode}.
              </>
            )}
          </DialogDescription>
          <div
            className={`my-5 flex gap-3 rounded-xl p-4 text-sm ${isDark ? "bg-[#202020] text-white/55" : "bg-[#F4F5F7] text-[#5D5D5D]"}`}
          >
            <Bell size={20} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
            <p>
              {isDemo
                ? "Demo mode: the assignment is stored only in this browser tab. No email is sent."
                : `${selectedProducer?.name || "The selected producer"} will be notified if the backend confirms notification delivery. The assignment takes effect after the server accepts it.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => setStep("selection")}
              disabled={isSubmitting}
              className={`h-12 rounded-lg ${secondaryButton}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={commitAssignment}
              disabled={isSubmitting || !selectedProducer}
              className={`h-12 rounded-lg ${primaryButton}`}
            >
              {isSubmitting && (
                <Loader2 size={17} className="mr-2 animate-spin" />
              )}
              {isSubmitting
                ? "Assigning..."
                : action === "change"
                  ? "Change Producer"
                  : "Assign Producer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={step === "success"}
        onOpenChange={(open: boolean) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          className={`max-h-[calc(100dvh_-_24px)] w-[calc(100%_-_32px)] max-w-[455px] gap-0 overflow-y-auto overscroll-contain rounded-2xl border px-5 py-6 text-center shadow-2xl sm:max-h-[calc(100dvh_-_48px)] sm:px-6 sm:py-7 [&>button:last-child]:hidden ${modalClass}`}
        >
          <AssignmentSuccessAnimation />
          <DialogTitle className="mt-7 text-xl font-medium sm:text-2xl">
            {isDemo
              ? "Producer Assigned Successfully"
              : action === "change"
                ? "Producer Changed Successfully"
                : "Producer Assigned Successfully"}
          </DialogTitle>
          <DialogDescription
            className={`mt-3 text-sm leading-6 ${isDark ? "text-white/55" : "text-[#555555]"}`}
          >
            {isDemo
              ? `${localProducer?.name} is now shown as Production Owner in this browser session. No backend assignment or email was sent.`
              : `${localProducer?.name} is now assigned as Producer for this shoot.${notificationSent ? " They have been notified and the shoot will appear in their dashboard." : " Notification delivery has not been confirmed."}`}
          </DialogDescription>
          <div
            className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-left ${isDark ? "border-[#2A261F] bg-[#1C1915]" : "border-[#E9D9BD] bg-[#FFF9EC]"}`}
          >
            <Bell size={20} className="mt-0.5 shrink-0 text-[#D7B781]" />
            <div className="min-w-0">
              <p
                className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-[#E8D1AB]" : "text-[#93713D]"}`}
              >
                {isDemo
                  ? "Demo notification only"
                  : notificationSent
                    ? "Notification sent"
                    : "Notification not confirmed"}
              </p>
              <p
                className={`mt-1 text-sm ${isDark ? "text-white" : "text-[#171717]"}`}
              >
                {isDemo
                  ? "No email was sent"
                  : notificationSent
                    ? "You've been assigned as Producer"
                    : "Assignment completed"}
              </p>
              <p
                className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-[#777777]"}`}
              >
                {projectName} · {shootCode}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={closeModal}
            className={`mt-6 h-12 w-full rounded-lg font-medium ${primaryButton}`}
          >
            View Shoot
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={step === "remove"}
        onOpenChange={(open: boolean) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent
          className={`max-h-[calc(100dvh_-_24px)] w-[calc(100%_-_32px)] max-w-[455px] gap-0 overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-2xl sm:max-h-[calc(100dvh_-_48px)] sm:p-6 [&>button:last-child]:hidden ${modalClass}`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#32191B] text-[#F16C76]">
              <AlertCircle size={20} />
            </span>
            <DialogTitle className="text-xl font-medium">
              Remove Producer?
            </DialogTitle>
          </div>
          <DialogDescription
            className={`mt-4 text-sm leading-6 ${isDark ? "text-white/55" : "text-[#555555]"}`}
          >
            Remove{" "}
            <strong className={isDark ? "text-[#E8D1AB]" : "text-[#8A6835]"}>
              {assignedProducer?.name}
            </strong>{" "}
            as Producer from this shoot?
            <span className="mt-2 block">
              The shoot will be removed from their assigned list but remain
              available under All Shoots. No assignment notification will be
              sent.
            </span>
            {isDemo && (
              <span className="mt-2 block text-[#B69460]">
                Preview only: no backend data will change.
              </span>
            )}
          </DialogDescription>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className={`h-12 rounded-lg ${secondaryButton}`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={removeProducer}
              disabled={isSubmitting || !assignedProducer}
              className={`h-12 rounded-lg ${primaryButton}`}
            >
              {isSubmitting && (
                <Loader2 size={17} className="mr-2 animate-spin" />
              )}
              {isSubmitting ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
