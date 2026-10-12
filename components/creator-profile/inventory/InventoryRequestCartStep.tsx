import React from 'react';
import { Minus, Package, Plus, Trash2 } from 'lucide-react';
import { RequestLine, currency } from '@/components/common/inventory/inventory';
import { InventoryButton, InventoryImage, useInventoryStyle } from '@/components/common/inventory/InventoryUI';

const CART_GRID = 'grid grid-cols-[48px_minmax(0,1fr)_112px_88px_32px] items-center gap-3';

type Props = {
  items: RequestLine[];
  maxQuantity: (id: string) => number;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onBrowse: () => void;
};

export default function InventoryRequestCartStep({
  items,
  maxQuantity,
  onQuantityChange,
  onRemove,
  onBrowse,
}: Props) {
  const s = useInventoryStyle();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Selected Request Items</h3>
        <button
          type="button"
          onClick={onBrowse}
          className="text-xs font-semibold text-[#E8D1AB] hover:underline"
        >
          + Add More Items
        </button>
      </div>

      {items.length === 0 ? (
        <div
          className={`rounded-2xl border p-12 text-center ${
            s.isDark
              ? 'border-[#262626] bg-[#161616]'
              : 'border-[#EAEAEA] bg-[#FAFAFA]'
          }`}
        >
          <Package size={36} className={`mx-auto mb-3 ${s.muted}`} />
          <p className="font-semibold">No items added to request</p>
          <p className={`mt-1 text-xs ${s.muted}`}>
            Please browse inventory to select equipment items.
          </p>
          <InventoryButton
            variant="beige"
            className="mt-4"
            onClick={onBrowse}
          >
            Browse Inventory
          </InventoryButton>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <div
            className={`${CART_GRID} px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wide ${s.muted}`}
          >
            <span aria-hidden="true" />
            <span className="text-left">Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
            <span aria-hidden="true" />
          </div>

          <div className="space-y-3">
            {items.map(line => (
              <div
                key={line.inventory_item_id}
                className={`${CART_GRID} rounded-xl border p-3.5 ${
                  s.isDark
                    ? 'border-[#262626] bg-[#161616]'
                    : 'border-[#EAEAEA] bg-white'
                }`}
              >
                <InventoryImage
                  src={line.item_image_snapshot}
                  alt={line.item_name_snapshot}
                  className="h-12 w-12 shrink-0 rounded-lg"
                />

                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-bold">
                    {line.item_name_snapshot}
                  </p>
                  <p className={`text-xs ${s.muted}`}>
                    {line.billing_unit === 'hour' ? 'Hourly rental' : 'Daily rental'} · {line.expected_pickup_at && line.expected_return_at ? `${new Date(line.expected_pickup_at).toLocaleString()} – ${new Date(line.expected_return_at).toLocaleString()}` : 'Rental'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    aria-label={`Decrease quantity for ${line.item_name_snapshot}`}
                    disabled={line.quantity <= 1}
                    onClick={() =>
                      onQuantityChange(line.inventory_item_id, line.quantity - 1)
                    }
                    className={`flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-40 ${s.secondary}`}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    aria-label={`Quantity for ${line.item_name_snapshot}`}
                    type="number"
                    min={1}
                    max={maxQuantity(line.inventory_item_id)}
                    value={line.quantity}
                    className={`h-8 w-10 rounded-lg border p-1 text-center text-sm font-bold ${s.field}`}
                    onChange={event =>
                      onQuantityChange(
                        line.inventory_item_id,
                        Number(event.target.value),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Increase quantity for ${line.item_name_snapshot}`}
                    disabled={line.quantity >= maxQuantity(line.inventory_item_id)}
                    onClick={() =>
                      onQuantityChange(line.inventory_item_id, line.quantity + 1)
                    }
                    className={`flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-40 ${s.secondary}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <p className="whitespace-nowrap text-right text-sm font-bold tabular-nums">
                  {currency(line.base_rent || line.line_total)}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    aria-label={`Remove ${line.item_name_snapshot}`}
                    onClick={() => onRemove(line.inventory_item_id)}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
