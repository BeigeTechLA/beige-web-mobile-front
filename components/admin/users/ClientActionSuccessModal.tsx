"use client";

import ActionSuccessModal from "@/components/admin/ActionSuccessModal";

type ClientActionSuccessModalProps = {
  open: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
};

export default function ClientActionSuccessModal({
  open,
  title,
  description,
  buttonLabel = "Done",
  onClose,
}: ClientActionSuccessModalProps) {
  return (
    <ActionSuccessModal
      isOpen={open}
      onSubmit={onClose}
      title={title}
      subtext={description}
      buttonText={buttonLabel}
    />
  );
}
