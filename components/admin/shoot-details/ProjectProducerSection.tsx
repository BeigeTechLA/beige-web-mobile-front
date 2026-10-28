"use client";

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from "next-themes";
import ProducerSelectionModal, { Producer, initials } from './ProducerSelectionModal';
import ProducerAssignmentConfirmationModal, { DUMMY_SHOOT, type ShootSummary } from './ProducerAssignmentConfirmationModal';
import ProducerSuccessModal from './ProducerSuccessModal';
import ProducerRemovalConfirmationModal from './ProducerRemovalConfirmationModal';

// select -> confirm -> success
type ModalStep = 'select' | 'confirm' | 'success' | 'remove' | null;

// Dummy API call so the flow works out of the box
const fakeAssign = () => new Promise<void>((r) => setTimeout(r, 700));
const fakeRemove = () => new Promise<void>((r) => setTimeout(r, 600));

interface ProjectProducerSectionProps {
  /**
   * Controlled mode: pass the assigned producer (or null) + onChange.
   * Leave both out to let the component manage it (starts unassigned).
   */
  producer?: Producer | null;
  onChange?: (producer: Producer | null) => void;
  /** Producers listed in the modal; falls back to dummy data */
  producers?: Producer[];
  /** Shoot shown in the confirmation + success modals; falls back to dummy data */
  shoot?: ShootSummary;
  /**
   * API call made on "Assign Producer" in the confirmation modal.
   * Throw to show an error and keep the modal open. Defaults to a fake 700ms request.
   */
  onAssign?: (producer: Producer, shoot: ShootSummary) => void | Promise<void>;
  /**
   * API call made on "Remove" in the removal confirmation modal.
   * Throw to show an error and keep the modal open. Defaults to a fake 600ms request.
   */
  onRemove?: (producer: Producer, shoot: ShootSummary) => void | Promise<void>;
  /** Optional extra action on "View Shoot" in the success modal (it always closes) */
  onViewShoot?: () => void;
  title?: string;
  roleLabel?: string;
  canManage?: boolean;
}

/* Component */
export default function ProjectProducerSection({
  producer: producerProp,
  onChange,
  producers,
  shoot = DUMMY_SHOOT,
  onAssign = fakeAssign,
  onRemove = fakeRemove,
  onViewShoot,
  title = 'Project Producer',
  roleLabel = 'Production Owner',
  canManage = true,
}: ProjectProducerSectionProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [internalProducer, setInternalProducer] = useState<Producer | null>(null);
  const [step, setStep] = useState<ModalStep>(null);
  const [pending, setPending] = useState<Producer | null>(null); // chosen in step 1, used by steps 2 + 3

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const isControlled = producerProp !== undefined;
  const producer = isControlled ? producerProp : internalProducer;

  const assign = (p: Producer | null) => {
    if (!isControlled) setInternalProducer(p);
    onChange?.(p);
  };

  const closeAll = () => {
    setStep(null);
    setPending(null);
  };

  // Step 1 -> 2: "Continue" in the selection modal
  const handleContinue = (p: Producer) => {
    setPending(p);
    setStep('confirm');
  };

  // Step 2 -> 3: "Assign Producer" in the confirmation modal
  const handleConfirm = async (p: Producer, s: ShootSummary) => {
    await onAssign(p, s);   // throws -> error shown in the confirmation modal
    assign(p);
    setStep('success');
  };

  // "Remove" on the card -> confirmation -> unassign
  const handleRemove = async (p: Producer, s: ShootSummary) => {
    await onRemove(p, s);   // throws -> error shown in the removal modal
    assign(null);
    closeAll();
  };

  // Colours
  const card = isDark ? 'bg-[#111111] text-white border border-[#222222]' : 'bg-[#F4F5F7] text-black';
  const muted = isDark ? 'text-[#737370]' : 'text-zinc-500';
  const isAssigned = !!producer;

  return (
    <>
      <section className={`transition-colors duration-300 rounded-2xl w-full overflow-hidden ${card}`}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 p-4 lg:p-9 border-b ${isDark ? "border-b-[#333333]" : "border-b-[#E5E5E5]"}`}>
          <h3 className="text-base lg:text-lg font-medium">{title}</h3>
          <span
            className={`rounded-full px-4.5 py-2 text-xs lg:text-sm font-semibold ${isAssigned
              ? (isDark ? 'bg-[#16A34A] text-black' : 'bg-[#E8F8EE] text-[#167A3E]')
              : (isDark ? 'bg-[#1A1A19] text-[#A8A8A6]' : 'bg-[#F0F0F0] text-zinc-500')}`}
          >
            {isAssigned ? 'Assigned' : 'Unassigned'}
          </span>
        </div>

        {/* Body */}
        {isAssigned && producer ? (
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 p-5 lg:p-9">
            {/* Photo */}
            <div
              className="w-full lg:w-[46%] shrink-0 aspect-[330/204] lg:max-h-[227px] rounded-2xl overflow-hidden flex items-center justify-center text-[#171717] text-5xl font-medium"
              style={{ backgroundColor: producer.avatarBg ?? '#EAFCDB' }}
            >
              {producer.avatarUrl
                ? <img src={producer.avatarUrl} alt={producer.name} className="w-full h-full object-cover" />
                : initials(producer.name)}
            </div>

            {/* Details + actions */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-6">
              <div>
                <p className="text-lg lg:text-2xl font-semibold truncate">{producer.name}</p>
                <p className={`text-base lg:text-xl mt-1 lg:mt-2 ${muted}`}>{roleLabel}</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setStep('select')}
                  className="w-full h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-black text-sm font-semibold transition-colors"
                >
                  Change Producer
                </button>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setStep('remove')}
                  className={`w-full h-12 rounded-lg text-sm font-semibold transition-colors ${isDark ? 'bg-[#EF4444]/10 hover:bg-[#341C1C] text-[#FD6D6D]' : 'bg-[#FDECEA] hover:bg-[#FBE0DC] text-[#C8392B]'}`}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-12 lg:py-14">
            <button
              type="button"
              disabled={!canManage}
              onClick={() => setStep('select')}
              className={`w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-[#E8D1AB] shadow-[#E8D1AB]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"}`}
            >
              <Plus className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
            </button>

            <h4 className={`text-lg lg:text-2xl font-semibold leading-none ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              Assign Producer to Shoot
            </h4>
            <span className={`mt-1.5 text-base lg:text-xl ${muted}`}>{roleLabel}</span>
          </div>
        )}
      </section>

      {/* Step 1: pick a producer (pre-selects the current / pending one) */}
      <ProducerSelectionModal
        open={step === 'select'}
        onClose={closeAll}
        onContinue={handleContinue}
        producers={producers}
        initialSelectedId={pending?.id ?? producer?.id ?? null}
      />

      {/* Step 2: confirm */}
      <ProducerAssignmentConfirmationModal
        open={step === 'confirm'}
        producer={pending}
        shoot={shoot}
        onClose={closeAll}
        onConfirm={handleConfirm}
      />

      {/* Remove producer: confirmation */}
      <ProducerRemovalConfirmationModal
        open={step === 'remove'}
        producer={producer ?? null}
        shoot={shoot}
        onClose={closeAll}
        onConfirm={handleRemove}
      />

      {/* Step 3: success ("View Shoot" just closes) */}
      <ProducerSuccessModal
        open={step === 'success'}
        producer={pending}
        shoot={shoot}
        onClose={closeAll}
        onViewShoot={onViewShoot}
      />
    </>
  );
}
