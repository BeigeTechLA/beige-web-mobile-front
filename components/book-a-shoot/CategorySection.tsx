'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Check } from 'lucide-react';
import type { PricingCategory, PricingItem } from '@/lib/api/pricing';
import { formatCurrency, getRateTypeDisplay } from '@/lib/api/pricing';

interface CategorySectionProps {
  category: PricingCategory;
  selectedItems: Map<number, number>; // item_id -> quantity
  shootHours: number;
  onToggleItem: (itemId: number) => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  defaultExpanded?: boolean;
}

export function CategorySection({
  category,
  selectedItems,
  shootHours,
  onToggleItem,
  onUpdateQuantity,
  defaultExpanded = false,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Count selected items in this category
  const selectedCount = category.items.filter(item => 
    selectedItems.has(item.item_id) && (selectedItems.get(item.item_id) || 0) > 0
  ).length;

  return (
    <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#212122]">{category.name}</span>
          {selectedCount > 0 && (
            <span className="bg-[#C9A227] text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#626467]">
          <span className="text-sm">{category.items.length} items</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Items List */}
      {isExpanded && (
        <div className="border-t border-[#E5E5E5]">
          {category.items.map((item, index) => (
            <ItemRow
              key={item.item_id}
              item={item}
              isSelected={selectedItems.has(item.item_id) && (selectedItems.get(item.item_id) || 0) > 0}
              quantity={selectedItems.get(item.item_id) || 0}
              shootHours={shootHours}
              onToggle={() => onToggleItem(item.item_id)}
              onUpdateQuantity={(qty) => onUpdateQuantity(item.item_id, qty)}
              isLast={index === category.items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: PricingItem;
  isSelected: boolean;
  quantity: number;
  shootHours: number;
  onToggle: () => void;
  onUpdateQuantity: (quantity: number) => void;
  isLast: boolean;
}

function ItemRow({
  item,
  isSelected,
  quantity,
  shootHours,
  onToggle,
  onUpdateQuantity,
  isLast,
}: ItemRowProps) {
  const rate = parseFloat(String(item.rate));
  const rateDisplay = getRateTypeDisplay(item.rate_type, item.rate_unit);
  
  // Calculate estimated cost for this item
  const estimatedCost = React.useMemo(() => {
    if (!isSelected || quantity === 0) return 0;
    
    switch (item.rate_type) {
      case 'per_hour':
        return rate * shootHours * quantity;
      case 'per_day':
      case 'per_unit':
      case 'flat':
      default:
        return rate * quantity;
    }
  }, [isSelected, quantity, rate, item.rate_type, shootHours]);

  // Show quantity controls for items that can have multiple
  const showQuantityControls = item.rate_type === 'per_unit' || 
    (item.max_quantity === null || item.max_quantity > 1);

  return (
    <div
      className={`
        flex items-center justify-between p-4 
        ${!isLast ? 'border-b border-[#E5E5E5]' : ''}
        ${isSelected ? 'bg-[#FDF8E7]' : 'hover:bg-gray-50'}
        transition-colors
      `}
    >
      {/* Left side: Checkbox and item info */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggle}
          className={`
            w-6 h-6 rounded border-2 flex items-center justify-center transition-all
            ${isSelected 
              ? 'bg-[#C9A227] border-[#C9A227] text-white' 
              : 'border-[#D1D5DB] hover:border-[#C9A227]'
            }
          `}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </button>
        
        <div className="flex-1">
          <p className="font-medium text-[#212122]">{item.name}</p>
          <p className="text-sm text-[#626467]">
            {formatCurrency(rate)}
            {rateDisplay && ` ${rateDisplay}`}
          </p>
        </div>
      </div>

      {/* Right side: Quantity and estimated cost */}
      <div className="flex items-center gap-4">
        {isSelected && showQuantityControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(Math.max(0, quantity - 1))}
              className="w-8 h-8 rounded-full border border-[#D1D5DB] flex items-center justify-center hover:bg-gray-100 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4 text-[#626467]" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => onUpdateQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border border-[#D1D5DB] flex items-center justify-center hover:bg-gray-100 transition-colors"
              disabled={item.max_quantity !== null && quantity >= item.max_quantity}
            >
              <Plus className="w-4 h-4 text-[#626467]" />
            </button>
          </div>
        )}

        {isSelected && estimatedCost > 0 && (
          <div className="text-right min-w-[100px]">
            <p className="font-semibold text-[#212122]">
              {formatCurrency(estimatedCost)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategorySection;

