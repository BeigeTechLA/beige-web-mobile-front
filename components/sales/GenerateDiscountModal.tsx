"use client";

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useGenerateDiscountCodeMutation } from '@/lib/redux/features/sales/salesApi';
import { CreateDiscountCodeRequest, DiscountType, UsageType } from '@/types/sales';
import { copyToClipboard, getDiscountDescription } from '@/lib/utils/discountHelpers';
import { toast } from 'sonner';

interface GenerateDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: number;
  bookingId?: number;
}

export default function GenerateDiscountModal({
  isOpen,
  onClose,
  leadId,
  bookingId,
}: GenerateDiscountModalProps) {
  const [generateDiscount, { isLoading }] = useGenerateDiscountCodeMutation();
  
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [usageType, setUsageType] = useState<UsageType>('one_time');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (usageType === 'multi_use' && (!maxUses || parseInt(maxUses) <= 0)) {
      toast.error('Please enter max uses for multi-use codes');
      return;
    }

    try {
      const request: CreateDiscountCodeRequest = {
        lead_id: leadId,
        booking_id: bookingId,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        usage_type: usageType,
        max_uses: usageType === 'multi_use' ? parseInt(maxUses) : undefined,
        expires_at: expiresAt || undefined,
      };

      const response = await generateDiscount(request).unwrap();
      
      if (response.success && response.data) {
        setGeneratedCode(response.data.code);
        toast.success('Discount code generated successfully!');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate discount code');
    }
  };

  const handleCopyCode = async () => {
    if (generatedCode) {
      await copyToClipboard(generatedCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setDiscountType('percentage');
    setDiscountValue('');
    setUsageType('one_time');
    setMaxUses('');
    setExpiresAt('');
    setGeneratedCode(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {generatedCode ? 'Discount Code Generated' : 'Generate Discount Code'}
        </h2>

        {generatedCode ? (
          <div className="space-y-4">
            <div className="bg-[#272626] rounded-xl p-6 text-center">
              <p className="text-white/60 text-sm mb-2">Discount Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold text-[#E8D1AB] tracking-wider">
                  {generatedCode}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-white/60" />
                  )}
                </button>
              </div>
              <p className="text-white/80 mt-4">
                {getDiscountDescription({ discount_type: discountType, discount_value: parseFloat(discountValue) })}
              </p>
              {usageType === 'multi_use' && (
                <p className="text-white/60 text-sm mt-2">
                  Max uses: {maxUses}
                </p>
              )}
              {expiresAt && (
                <p className="text-white/60 text-sm mt-1">
                  Expires: {new Date(expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Discount Type */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Discount Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-[#E8D1AB] text-black'
                      : 'bg-[#272626] text-white/60 hover:text-white'
                  }`}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed_amount')}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    discountType === 'fixed_amount'
                      ? 'bg-[#E8D1AB] text-black'
                      : 'bg-[#272626] text-white/60 hover:text-white'
                  }`}
                >
                  Fixed Amount
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '10' : '50.00'}
                step={discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                className="w-full px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
                required
              />
            </div>

            {/* Usage Type */}
            <div>
              <label className="block text-white/80 text-sm mb-2">Usage Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUsageType('one_time')}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    usageType === 'one_time'
                      ? 'bg-[#E8D1AB] text-black'
                      : 'bg-[#272626] text-white/60 hover:text-white'
                  }`}
                >
                  One-Time Use
                </button>
                <button
                  type="button"
                  onClick={() => setUsageType('multi_use')}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    usageType === 'multi_use'
                      ? 'bg-[#E8D1AB] text-black'
                      : 'bg-[#272626] text-white/60 hover:text-white'
                  }`}
                >
                  Multi-Use
                </button>
              </div>
            </div>

            {/* Max Uses (for multi-use) */}
            {usageType === 'multi_use' && (
              <div>
                <label className="block text-white/80 text-sm mb-2">Max Uses</label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="10"
                  min="1"
                  className="w-full px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
                  required
                />
              </div>
            )}

            {/* Expiration Date (Optional) */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 bg-[#272626] text-white/80 hover:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
