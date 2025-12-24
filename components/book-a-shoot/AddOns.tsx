"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { QuantityControl } from "./QuantityControl";

type Addon = {
  id: string;
  label: string;
  price: number;
  isFlatRate?: boolean;
};


interface Props {
  title?: string;
  items: Addon[];
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}

export const AddOns = ({
  title = "",
  items,
  value,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const toggleItem = (id: string) => {
    const updated = { ...value };
    if (updated[id]) {
      delete updated[id];
    } else {
      updated[id] = 1;
    }
    onChange(updated);
  };

  const updateQty = (id: string, delta: number) => {
    const qty = (value[id] || 0) + delta;
    if (qty <= 0) {
      const updated = { ...value };
      delete updated[id];
      onChange(updated);
    } else {
      onChange({ ...value, [id]: qty });
    }
  };

  return (
    <div className="bg-[#171717] rounded-lg lg:rounded-[22px] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-4 lg:px-[30px] ${open ? "lg:py-[30px]" : "lg:py-10"} text-white font-medium text-base lg:text-xl`}
      >
        {title}
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>


      {open && (
        <>
          <hr className="border-white/10 my-4" />

          <div className="bg-[#101010] m-4 lg:m-[30px] p-4 lg:p-[30px] rounded-lg lg:rounded-[22px] space-y-6">
            {items.map((item) => {
              const qty = value[item.id] || 0;
              const selected = qty > 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-white/5 pb-5"
                >
                  {/* Left */}
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1 w-4 h-4 rounded border-white/30 bg-transparent"
                    />

                    <div>
                      <p className="text-white font-medium lg:text-[21px]">{item.label}</p>
                      <p className="text-[#E8D1AB] font-light text-sm lg:text-xl">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </label>

                  {/* Right */}
                  <QuantityControl
                    value={qty}
                    onIncrease={() => updateQty(item.id, 1)}
                    onDecrease={() => updateQty(item.id, -1)}
                  />
                </div>
              );
            })}
          </div>
        </>

      )}
    </div>
  );
};
