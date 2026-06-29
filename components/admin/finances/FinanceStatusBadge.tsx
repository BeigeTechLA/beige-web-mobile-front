type Status =
  | "Pending"
  | "Partially Paid"
  | "Finance Approval"
  | "Approved"
  | "Fully Paid"

export const FinanceStatusBadge = ({ status, mobile }: { status: Status; mobile?: boolean }) => {
  const styles = {
    "Pending": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
    "Fully Paid": "bg-[#E2DAFF] text-[#3516A3] border-[#E2DAFF]",
    "Approved": "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
    "Partially Paid": "bg-[#BEDAFF] text-[#1653A3] border-[#BEDAFF]",
    "Finance Approval": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
  };

  const padding = mobile ? "px-4 py-1 text-xs" : "px-5 py-1.5 text-sm";

  return (
    <span
      className={`${padding} inline-flex items-center rounded-full font-medium border whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
};
