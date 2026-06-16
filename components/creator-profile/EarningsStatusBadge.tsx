type Status =
  | "Partially Paid"
  | "Awaiting Response"
  | "Accepted"
  | "Unknown";

export const EarningsStatusBadge = ({ status, mobile }: { status: Status; mobile?: boolean }) => {
  const styles = {
    "Partially Paid": "bg-[#E0E7FF] text-[#372AAC] border-[#C6D2FF]",
    "Awaiting Response": "bg-[#FEF9C2] text-[#894B00] border-[#FFF085]",
    "Accepted": "bg-[#D4FFE4] text-[#0F845D] border-[#0F845D]",
    "Unknown": "bg-[#ECECEC] text-[#6D6D6D] border-[#D5D5D5]",
  };

  return (
    <span
      className={`px-4 py-1 text-xs inline-flex items-center rounded-full font-semibold border whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
};
