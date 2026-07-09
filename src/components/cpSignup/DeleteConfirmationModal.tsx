import React from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  isDark: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
  isDark
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
      <div className={`relative w-full max-w-md rounded-lg lg:rounded-[2.5rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors ${isDark ? "bg-[#111111] border-white/10" : "bg-white border-black/5"
        }`}>
        <div className="p-4 lg:p-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-8 right-8 transition-colors ${isDark ? "text-white/20 hover:text-white" : "text-black/20 hover:text-black"
              }`}
          >
            <X size={20} />
          </button>

          {/* Danger Icon */}
          <div className={`w-14 h-14 rounded-xl lg:rounded-2xl border flex items-center justify-center mb-3 lg:mb-6 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-500/5 border-red-500/10"
            }`}>
            <AlertTriangle className="text-red-500" size={24} />
          </div>

          {/* Text Content */}
          <h3 className={`text-lg lg:text-2xl font-bold mb-1 lg:mb-2 ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed mb-5 lg:mb-10 font-medium ${isDark ? "text-white/40" : "text-black/40"
            }`}>
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 p-3 lg:px-6 lg:py-4 text-sm lg:text-base font-bold rounded-lg lg:rounded-2xl transition-colors disabled:opacity-50 ${isDark
                  ? "bg-white/5 text-white hover:bg-white/10"
                  : "bg-black/5 text-black hover:bg-black/10"
                }`}
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