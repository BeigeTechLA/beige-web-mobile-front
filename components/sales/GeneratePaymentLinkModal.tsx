"use client";

import { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useGeneratePaymentLinkMutation } from '@/lib/redux/features/sales/salesApi';
import { CreatePaymentLinkRequest } from '@/types/sales';
import { copyToClipboard } from '@/lib/utils/discountHelpers';
import { toast } from 'sonner';

interface GeneratePaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: number;
  bookingId: number;
  availableDiscountCodes?: Array<{ discount_code_id: number; code: string; discount_type: string; discount_value: number }>;
}

export default function GeneratePaymentLinkModal({
  isOpen,
  onClose,
  leadId,
  bookingId,
  availableDiscountCodes = [],
}: GeneratePaymentLinkModalProps) {
  const [generateLink, { isLoading }] = useGeneratePaymentLinkMutation();
  
  const [linkDiscountCode, setLinkDiscountCode] = useState<boolean>(false);
  const [selectedDiscountCodeId, setSelectedDiscountCodeId] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<string>('72');
  
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && availableDiscountCodes.length > 0) {
      setLinkDiscountCode(true);
      setSelectedDiscountCodeId(availableDiscountCodes[0].discount_code_id.toString());
    }
  }, [isOpen, availableDiscountCodes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (linkDiscountCode && !selectedDiscountCodeId) {
      toast.error('Please select a discount code');
      return;
    }

    if (!expiryHours || parseInt(expiryHours) <= 0) {
      toast.error('Please enter valid expiry hours');
      return;
    }

    try {
      const request: CreatePaymentLinkRequest = {
        lead_id: leadId,
        booking_id: bookingId,
        discount_code_id: linkDiscountCode ? parseInt(selectedDiscountCodeId) : undefined,
        expiry_hours: parseInt(expiryHours),
      };

      const response = await generateLink(request).unwrap();
      
      if (response.success && response.data) {
        setGeneratedLink(response.data.url || '');
        setLinkExpiry(response.data.expires_at);
        toast.success('Payment link generated successfully!');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to generate payment link');
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await copyToClipboard(generatedLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setLinkDiscountCode(false);
    setSelectedDiscountCodeId('');
    setExpiryHours('72');
    setGeneratedLink(null);
    setLinkExpiry(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {generatedLink ? 'Payment Link Generated' : 'Generate Payment Link'}
        </h2>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="bg-[#272626] rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <LinkIcon className="w-6 h-6 text-[#E8D1AB] flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-sm mb-2">Payment Link</p>
                  <p className="text-white text-sm break-all font-mono bg-black/30 p-3 rounded-lg">
                    {generatedLink}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>

              {linkExpiry && (
                <p className="text-white/60 text-sm text-center mt-4">
                  Expires: {new Date(linkExpiry).toLocaleString()}
                </p>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-[#272626] text-white/80 hover:text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Link Discount Code */}
            {availableDiscountCodes.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-white/80 text-sm mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkDiscountCode}
                    onChange={(e) => setLinkDiscountCode(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-[#272626] text-[#E8D1AB] focus:ring-[#E8D1AB]"
                  />
                  Include discount code with link
                </label>

                {linkDiscountCode && (
                  <select
                    value={selectedDiscountCodeId}
                    onChange={(e) => setSelectedDiscountCodeId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
                    required
                  >
                    <option value="">Select discount code</option>
                    {availableDiscountCodes.map((code) => (
                      <option key={code.discount_code_id} value={code.discount_code_id}>
                        {code.code} - {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`} off
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {availableDiscountCodes.length === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-500 text-sm">
                  No discount codes available. Generate a discount code first if needed.
                </p>
              </div>
            )}

            {/* Expiry Hours */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Link Expiration (hours)
              </label>
              <input
                type="number"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                placeholder="72"
                min="1"
                max="720"
                className="w-full px-4 py-3 bg-[#272626] text-white rounded-lg border border-white/10 focus:border-[#E8D1AB] outline-none transition-colors"
                required
              />
              <p className="text-white/50 text-xs mt-2">
                Default: 72 hours (3 days). Max: 720 hours (30 days)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                The payment link will allow the client to complete their booking and payment. 
                {linkDiscountCode && ' The discount will be automatically applied.'}
              </p>
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
                {isLoading ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
