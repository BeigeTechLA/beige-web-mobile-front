import React from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[#111] w-full max-w-md rounded-lg lg:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 lg:p-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Danger Icon */}
          <div className="w-14 h-14 rounded-xl lg:rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 lg:mb-6">
            <AlertTriangle className="text-red-500" size={24} />
          </div>

          {/* Text Content */}
          <h3 className="text-lg lg:text-2xl font-bold text-white mb-1 lg:mb-2">{title}</h3>
          <p className="text-white/40 text-sm leading-relaxed mb-5 lg:mb-10 font-medium">
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 p-3 lg:px-6 lg:py-4 bg-white/5 text-white text-sm lg:text-base font-bold rounded-lg lg:rounded-2xl hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 p-3 lg:px-6 lg:py-4 bg-red-500 text-white text-sm lg:text-base font-bold rounded-lg lg:rounded-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={18} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;