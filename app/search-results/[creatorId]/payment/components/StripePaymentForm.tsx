"use client";

import React, { useState, useCallback } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { CreditCard, Tag, Check, X, Loader2 } from 'lucide-react';
import { affiliateApi } from '@/lib/api';
import { debounce } from '@/lib/utils';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  referralCode?: string;
  onReferralCodeChange?: (code: string, isValid: boolean | null, affiliateName: string) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#aaa',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

export function StripePaymentForm({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError,
  referralCode: initialReferralCode = '',
  onReferralCodeChange 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  
  // Referral code state
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [referralAffiliateName, setReferralAffiliateName] = useState('');
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Debounced referral code validation
  const validateReferralCode = useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 4) {
        setReferralCodeValid(null);
        setReferralAffiliateName('');
        onReferralCodeChange?.(code, null, '');
        return;
      }

      setIsValidatingReferral(true);
      try {
        const response = await affiliateApi.validateCode(code);
        setReferralCodeValid(response.valid);
        setReferralAffiliateName(response.affiliate_name || '');
        onReferralCodeChange?.(code, response.valid, response.affiliate_name || '');
      } catch (error) {
        console.error('Error validating referral code:', error);
        setReferralCodeValid(false);
        setReferralAffiliateName('');
        onReferralCodeChange?.(code, false, '');
      } finally {
        setIsValidatingReferral(false);
      }
    }, 500),
    [onReferralCodeChange]
  );

  const handleReferralCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setReferralCode(upperCode);
    validateReferralCode(upperCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not initialized');
      return;
    }

    if (!clientSecret) {
      onError('Payment not initialized. Please refresh the page.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card information not found');
      return;
    }

    setIsProcessing(true);

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (paymentError) {
        console.error('Payment error:', paymentError);
        onError(paymentError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      onError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-10">
      <h3 className="font-bold mb-7 text-base lg:text-2xl">Add Payment Method</h3>

      <div className="bg-white rounded-[10px] p-4 lg:p-5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-[#212122]">
          <CreditCard className="w-5 h-5 lg:w-9 lg:h-9" />
          <div className="flex flex-col">
            <span className="text-base font-medium">Stripe Secure Payment</span>
            <span className="text-sm">Your payment is protected with Stripe&apos;s secure encryption.</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#272626] rounded-[20px] p-4 lg:p-10 flex flex-col gap-5 lg:gap-9">
        {/* Card Element */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60 z-10">
            Card Details
          </label>
          <div className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 flex items-center outline-none focus-within:border-white/50 bg-[#272626]">
            <CardElement options={CARD_ELEMENT_OPTIONS} className="w-full" />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60">
            Card Holder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white/50 bg-[#272626]"
            placeholder="Ex. John Doe"
            required
          />
        </div>

        {/* Referral Code */}
        <div className="relative w-full">
          <label className="absolute -top-3 left-4 bg-[#272626] px-2 text-sm lg:text-base text-white/60 z-10 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Referral Code (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => handleReferralCodeChange(e.target.value)}
              className={`h-14 lg:h-[82px] w-full rounded-[12px] border px-4 pr-12 text-white outline-none bg-[#272626] uppercase tracking-wider ${
                referralCodeValid === true 
                  ? 'border-green-500 focus:border-green-400' 
                  : referralCodeValid === false 
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-white/30 focus:border-white/50'
              }`}
              placeholder="Enter code"
              maxLength={10}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidatingReferral ? (
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              ) : referralCodeValid === true ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : referralCodeValid === false ? (
                <X className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {referralCodeValid === true && referralAffiliateName && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Referred by {referralAffiliateName}
            </p>
          )}
          {referralCodeValid === false && referralCode.length >= 4 && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <X className="w-4 h-4" />
              Invalid referral code
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          className="w-fit h-14 lg:h-[96px] px-5 lg:px-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-base lg:text-2xl font-medium rounded-[10px] lg:rounded-[20px] shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : `Confirm & Pay $${amount.toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
}
