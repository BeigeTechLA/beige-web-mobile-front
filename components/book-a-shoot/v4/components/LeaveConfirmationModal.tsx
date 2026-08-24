const LeaveConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-semibold text-white mb-4">Abandon Booking?</h3>
        <p className="text-white/60 mb-8 leading-relaxed">
          You&apos;ve filled in details on this page. Moving back will lose all details. Do you wish to continue?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all font-medium"
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-medium"
          >
            Leave Page
          </button>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default LeaveConfirmationModal;