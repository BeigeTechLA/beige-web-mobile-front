import { DealCard } from "./DealCard";

export type DealItem = {
  id: string;
  initials: string;
  name: string;
  quoteId: string;
  email: string;
  status: "Accepted" | "Pending" | "Rejected";
  project: string;
  bookingStatus: string;
  amount: string;
  paid: string;
  pending: string;
  validity: string;
};

export type DealColumnData = {
  title: string;
  count: number;
  deals: DealItem[];
};

type DealColumnProps = {
  data: DealColumnData;
  isDark?: boolean;
};

// Component 2: DealColumn
export const DealColumn = ({ data, isDark = true }: DealColumnProps) => {
  return (
    <div
      className={`flex flex-col h-full w-full rounded-xl border ${isDark ? "border-white/20 bg-[#0A0A0A]" : "border-gray-200 bg-gray-50"}`}
    >
      {/* Column Header */}
      <div
        className={`flex items-center justify-between rounded-xl p-5 border-b text-xs lg:text-sm font-medium ${isDark
            ? "bg-[#202020] border-white/20 text-white"
            : "bg-gray-100 border-gray-200 text-black"
          }`}
      >
        <span className="text-[#E8D1AB]">{data.title}</span>
        <span>{data.count}</span>
      </div>

      {/* Scrollable Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-5 space-y-3 no-scrollbar">
        {data.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};