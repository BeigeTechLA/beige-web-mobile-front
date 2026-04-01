import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isDark?: boolean;
  className?: string;
  buttonClassName?: string;
  valueClassName?: string;
}

export const QuantityControl = ({
  value,
  onIncrease,
  onDecrease,
  isDark = true,
  className = "",
  buttonClassName = "",
  valueClassName = "",
}: QuantityControlProps) => {
  return (
    <div className={`flex items-center gap-4 bg-[#E8D1AB] px-2 py-1.5 lg:px-4 lg:py-2.5 rounded-lg lg:rounded-xl text-sm lg:text-xl text-black ${className}`}>
      <button onClick={onDecrease} className={`text-black ${buttonClassName}`}>
        <Minus className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={2.4} />
      </button>
      <span className={`min-w-[24px] text-center font-medium text-black ${valueClassName}`}>
        {String(value).padStart(2, "0")}
      </span>
      <button onClick={onIncrease} className={`text-black ${buttonClassName}`}>
        <Plus className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={2.4} />
      </button>
    </div>
  );
};
