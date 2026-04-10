type Status =
  | "Booked"
  | "Cancelled"
  | "In-Progress"
  | "Initiated"
  | "PreProduction"
  | "Shoot Day"
  | "PostProduction"
  | "Revision"
  | "Completed"
  | "Assets Delivered"
  | "Paid"
  | "Pending"
  | "Unknown";

export const StatusBadge = ({ status, mobile }: { status: Status; mobile?: boolean }) => {
  const styles = {
    "Initiated": "bg-[#FFF5CC] text-[#A86500] border-[#E9CE7A]",
    "PreProduction": "bg-[#F6EEFF] text-[#A334D5] border-[#E4CCFF]",
    "Shoot Day": "bg-[#FFECCF] text-[#C26A00] border-[#F4C987]",
    "PostProduction": "bg-[#F1F1F1] text-[#666666] border-[#D7D7D7]",
    "Revision": "bg-[#E9EEFF] text-[#3258D8] border-[#C8D5FF]",
    "Completed": "bg-[#DCF7E8] text-[#1F8A53] border-[#B9E7CD]",
    "Assets Delivered": "bg-[#D7F3E4] text-[#1D7A4F] border-[#A7DEBF]",
    "Cancelled": "bg-[#FFE8E8] text-[#D03434] border-[#F4C0C0]",
    "Booked": "bg-[#DCF7E8] text-[#1F8A53] border-[#B9E7CD]",
    "Paid": "bg-[#DCF7E8] text-[#1F8A53] border-[#B9E7CD]",
    "Pending": "bg-[#FFF1D8] text-[#B26A10] border-[#F2CEA0]",
    "In-Progress": "bg-[#EEF2FF] text-[#4A5FD3] border-[#CFD8FF]",
    "Unknown": "bg-[#ECECEC] text-[#6D6D6D] border-[#D5D5D5]",
  };

  const padding = mobile ? "px-4 py-1 text-xs" : "px-5 py-1.5 text-sm";

  return (
    <span
      className={`${padding} inline-flex items-center rounded-full font-semibold border whitespace-nowrap ${styles[status]}`}
    >
      {status}
    </span>
  );
};
