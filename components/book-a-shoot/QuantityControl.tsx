import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  isDark?: boolean;
}

export const QuantityControl = ({
  value,
  onIncrease,
  onDecrease,
  isDark = true
}: QuantityControlProps) => {
  return (
    <div className={`flex items-center gap-4 bg-[#E8D1AB] px-2 py-1.5 lg:px-4 lg:py-2.5 rounded-lg lg:rounded-xl text-sm lg:text-xl `}>
      <button onClick={onDecrease} className="font-bold">−</button>
      <span className="min-w-[24px] text-center font-medium">
        {String(value).padStart(2, "0")}
      </span>
      <button onClick={onIncrease} className="font-bold">+</button>
    </div>
  );
};
