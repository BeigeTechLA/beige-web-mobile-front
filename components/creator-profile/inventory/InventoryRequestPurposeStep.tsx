import React from 'react';
import { Calendar, Check, Package } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RequestType,
  ShootOption,
  formatInventoryDate,
} from '@/components/common/inventory/inventory';
import { useInventoryStyle } from '@/components/common/inventory/InventoryUI';

type Props = {
  type: RequestType;
  onTypeChange: (type: RequestType) => void;
  shootId: string;
  onShootChange: (id: string) => void;
  shoots: ShootOption[];
};

const requestOptions = [
  {
    id: 'personal',
    label: 'Personal Use',
    description: 'For personal projects or skill practice',
    icon: Package,
  },
  {
    id: 'shoot',
    label: 'Assigned Shoot',
    description: 'For an officially assigned BEIGE shoot',
    icon: Calendar,
  },
] as const;

export default function InventoryRequestPurposeStep({
  type,
  onTypeChange,
  shootId,
  onShootChange,
  shoots,
}: Props) {
  const s = useInventoryStyle();

  return (
    <div className="space-y-6 py-2">
      <div>
        <h3 className="text-base font-bold">
          What is this equipment request for?
        </h3>
        <p className={`text-sm ${s.muted}`}>
          Select whether this request is for personal creative use or an upcoming
          shoot assignment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {requestOptions.map(option => {
          const Icon = option.icon;
          const selected = type === option.id;
          const optionClass = selected
            ? `border-[#E8D1AB] ring-2 ring-[#E8D1AB]/50 ${
                s.isDark ? 'bg-zinc-900' : 'bg-[#FFFCF6]'
              }`
            : s.isDark
              ? 'border-[#262626] bg-[#161616] hover:border-zinc-700'
              : 'border-[#EAEAEA] bg-white hover:border-zinc-300';
          const iconClass = selected
            ? 'bg-[#E8D1AB] text-black'
            : s.isDark
              ? 'bg-zinc-800 text-zinc-300'
              : 'bg-zinc-100 text-zinc-700';

          return (
            <button
              key={option.id}
              type="button"
              className={`group relative rounded-2xl border p-5 text-left transition-all ${optionClass}`}
              onClick={() => onTypeChange(option.id)}
            >
              <div className="flex items-start justify-between">
                <div className={`mb-3 rounded-xl p-3 ${iconClass}`}>
                  <Icon size={22} />
                </div>
                {selected && <Check size={20} className="text-[#E8D1AB]" />}
              </div>
              <h4 className="text-base font-bold">{option.label}</h4>
              <p className={`mt-1 text-xs leading-relaxed ${s.muted}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {type === 'shoot' && (
        <div
          className={`space-y-2.5 rounded-xl border p-4 ${
            s.isDark
              ? 'border-[#262626] bg-[#161616]'
              : 'border-[#EAEAEA] bg-[#FAFAFA]'
          }`}
        >
          <label htmlFor="assigned-shoot" className="block text-sm font-semibold">
            Select Assigned Shoot
          </label>
          <Select value={shootId} onValueChange={onShootChange}>
            <SelectTrigger
              id="assigned-shoot"
              className={`h-11 w-full rounded-xl ${s.field}`}
            >
              <SelectValue placeholder="Select from your assigned shoots list" />
            </SelectTrigger>
            <SelectContent>
              {shoots.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-500">
                  No assigned shoots found.
                </div>
              ) : (
                shoots.map(shoot => (
                  <SelectItem key={shoot.id} value={shoot.id}>
                    {shoot.name} ({shoot.id}){' '}
                    {shoot.date ? `· ${formatInventoryDate(shoot.date)}` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
