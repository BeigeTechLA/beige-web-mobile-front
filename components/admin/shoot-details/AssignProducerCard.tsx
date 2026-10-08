"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/usePermissions";
import AssignProducerModal, { Producer } from "./AssignProducerModal";

interface AssignProducerCardProps {
  isDark: boolean;
  projectId: number | string;
}

const MOCK_PRODUCERS: Producer[] = [
  { id: 1, name: "Nafisa Khan", activeShoots: 4, status: "available" },
  { id: 2, name: "Sam Rivera", activeShoots: 2, status: "available_today" },
  { id: 3, name: "Alif Rahman", activeShoots: 6, status: "limited" },
];

export default function AssignProducerCard({ isDark, projectId }: AssignProducerCardProps) {
  const { canCreate } = usePermissions("shoots");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignedProducer, setAssignedProducer] = useState<Producer | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [producers] = useState<Producer[]>(MOCK_PRODUCERS);
  const [loadingProducers] = useState(false);

  return (
    <div
      className={cn(
        "w-full rounded-2xl min-h-[280px] flex flex-col relative overflow-hidden transition-all duration-300",
        isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"
      )}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <h3
          className={cn(
            "text-lg font-medium transition-colors duration-300",
            isDark ? "text-white" : "text-black"
          )}
        >
          Project Producer
        </h3>
        <span
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-300",
            isDark
              ? "bg-[#1c1c1c] border-[#2a2a2a] text-zinc-400"
              : "bg-zinc-100 border-zinc-200 text-zinc-500"
          )}
        >
          {assignedProducer ? "Assigned" : "Unassigned"}
        </span>
      </div>

      <div
        className={cn(
          "w-full h-px border-t transition-colors duration-300",
          isDark ? "border-[#333333]" : "border-[#E5E5E5]"
        )}
      />

      {assignedProducer ? (
        <div className="grid flex-1 grid-cols-1 gap-6 p-6 sm:grid-cols-[minmax(220px,380px)_1fr] sm:items-center">
          <div className="relative h-[230px] overflow-hidden rounded-2xl bg-[#E1FBD8] sm:h-[236px]">
            <Image
              src={assignedProducer.avatarUrl || "/images/avatar.png"}
              alt={assignedProducer.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 380px"
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <div>
              <h4 className={cn("text-2xl font-semibold", isDark ? "text-white" : "text-black")}>
                {assignedProducer.name}
              </h4>
              <p className="mt-1 text-xl text-zinc-500">Production Owner</p>
            </div>
            <button
              type="button"
              disabled={!canCreate}
              onClick={() => setIsModalOpen(true)}
              className="h-12 w-full rounded-lg bg-[#E8D1AB] font-semibold text-black disabled:opacity-50"
            >
              Change Producer
            </button>
            <button
              type="button"
              disabled={!canCreate}
              onClick={() => setIsRemoveModalOpen(true)}
              className="h-12 w-full rounded-lg bg-[#291616] font-semibold text-[#FF5C5C] disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
      /* Big plus */
      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <button
          onClick={() => canCreate && setIsModalOpen(true)}
          disabled={!canCreate}
          className={cn(
            "w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40",
            isDark ? "bg-[#E8D1AB] shadow-[#E8D1AB]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"
          )}
          title={canCreate ? "Assign Producer to Shoot" : "Create permission not allowed"}
        >
          <Plus className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
        </button>
        <h4
          className={cn(
            "text-lg font-semibold leading-none",
            isDark ? "text-[#E8D1AB]" : "text-[#000]"
          )}
        >
          {canCreate ? "Assign Producer to Shoot" : "Create permission not allowed"}
        </h4>
        {canCreate && (
          <p className="mt-2 text-base text-zinc-500">Production Owner</p>
        )}
      </div>
      )}

        <AssignProducerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDark={isDark}
        producers={producers}
        loading={loadingProducers}
        onAssign={(producer) => {
          setAssignedProducer(producer);
          setIsSuccessModalOpen(true);
          setIsModalOpen(false);
        }}
      />
      <ProducerAssignedSuccessModal
        isOpen={isSuccessModalOpen}
        producerName={assignedProducer?.name ?? ""}
        onClose={() => setIsSuccessModalOpen(false)}
      />
      <RemoveProducerModal
        isOpen={isRemoveModalOpen}
        producerName={assignedProducer?.name ?? ""}
        onCancel={() => setIsRemoveModalOpen(false)}
        onConfirm={() => {
          setAssignedProducer(null);
          setIsRemoveModalOpen(false);
        }}
      />
    </div>
  );
}

function RemoveProducerModal({
  isOpen,
  producerName,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  producerName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-producer-title"
        className="w-full max-w-[448px] rounded-2xl border border-[#333] bg-black p-6 text-white shadow-2xl"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#351d1d] text-[#ff6b6b]">
            <AlertCircle size={20} />
          </span>
          <h2 id="remove-producer-title" className="text-xl font-medium">Remove Producer?</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#A0A0A0]">
          Remove <span className="font-medium text-[#E8D1AB]">{producerName}</span> as Producer from this shoot? The shoot will be removed from their assigned list but remain available under All Shoots. No assignment notification will be sent.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-[50px] rounded-lg bg-[#222] text-sm font-semibold text-white transition hover:bg-[#2c2c2c]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[50px] rounded-lg bg-[#E8D1AB] text-sm font-semibold text-black transition hover:bg-[#dec49a]"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function ProducerAssignedSuccessModal({
  isOpen,
  producerName,
  onClose,
}: {
  isOpen: boolean;
  producerName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(onClose, 100000);
    return () => window.clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="producer-assigned-title"
        className="w-full max-w-[420px] rounded-2xl border border-[#333] bg-black px-4 py-5 text-white shadow-2xl sm:px-6 sm:py-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="relative mx-auto mb-3 h-[124px] w-[124px] sm:mb-4 sm:h-[132px] sm:w-[132px]">
          <Image src="/images/misc/PaymentSuccess.gif" alt="Success" fill className="object-contain" unoptimized />
        </div>
        <h2 id="producer-assigned-title" className="text-center text-xl font-medium sm:text-2xl">
          Producer Assigned Successfully
        </h2>
        <p className="mx-auto mt-3 max-w-[360px] text-center text-sm leading-6 text-[#A0A0A0]">
          {producerName} is now assigned as Producer for this shoot. {producerName} has been notified and the shoot is now available in their Producer dashboard.
        </p>
        <div className="mt-6 flex min-h-[88px] items-start gap-3 rounded-xl border border-[#29251e] bg-[#191713] p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2b261d] text-[#E8D1AB]">
            <Bell size={16} />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] text-[#E8D1AB]">EMAIL NOTIFICATION SENT</p>
            <p className="mt-0.5 text-xs font-medium">You&apos;ve been assigned as Producer</p>
            <p className="mt-1 text-[10px] text-zinc-500">{producerName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-[38px] w-full rounded-lg bg-[#E8D1AB] text-sm font-semibold text-black transition hover:bg-[#dec49a] sm:h-12"
        >
          View Shoot
        </button>
      </div>
    </div>
  );
}
