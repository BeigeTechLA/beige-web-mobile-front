"use client";

import React from 'react';
import Image from 'next/image';
import type { Equipment } from '@/types/payment';

interface EquipmentSelectorProps {
  equipment: Equipment[];
  selectedIds: string[];
  onToggle: (equipmentId: string) => void;
}

export function EquipmentSelector({ equipment, selectedIds, onToggle }: EquipmentSelectorProps) {
  if (equipment.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-6 text-base lg:text-2xl">Additional Equipment</h3>
      <div className="space-y-3">
        {equipment.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#E8D1AB]/10 border-[#E8D1AB]'
                  : 'bg-[#272626] border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(item.id)}
                className="w-5 h-5 rounded border-white/30 text-[#E8D1AB] focus:ring-[#E8D1AB] focus:ring-offset-0 bg-transparent"
              />
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm lg:text-base">{item.name}</h4>
                {item.description && (
                  <p className="text-white/60 text-xs lg:text-sm">{item.description}</p>
                )}
                {item.location && (
                  <p className="text-white/40 text-xs mt-1">
                    {typeof item.location === 'string'
                      ? item.location
                      : item.location?.address || ''}
                  </p>
                )}
              </div>
              <span className="font-medium text-sm lg:text-base">${item.price}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
