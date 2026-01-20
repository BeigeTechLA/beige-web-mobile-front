import { DiscountCode, DiscountType } from '@/types/sales';

/**
 * Calculate discount amount based on discount code
 * @param subtotal - Original amount before discount
 * @param discountCode - Discount code details
 * @returns Discount amount and final amount
 */
export function calculateDiscount(
  subtotal: number,
  discountCode: Pick<DiscountCode, 'discount_type' | 'discount_value'>
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0;

  if (discountCode.discount_type === 'percentage') {
    discountAmount = (subtotal * discountCode.discount_value) / 100;
  } else if (discountCode.discount_type === 'fixed_amount') {
    discountAmount = Math.min(discountCode.discount_value, subtotal);
  }

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalAmount = Math.max(0, subtotal - discountAmount);

  return {
    discountAmount,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}

/**
 * Format discount code for display (uppercase, no spaces)
 * @param code - Discount code string
 * @returns Formatted code
 */
export function formatDiscountCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '');
}

/**
 * Validate discount code format (client-side validation)
 * @param code - Discount code to validate
 * @returns True if valid format
 */
export function isDiscountCodeValid(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Code should be alphanumeric, 4-20 characters
  const regex = /^[A-Z0-9]{4,20}$/;
  return regex.test(code.toUpperCase());
}

/**
 * Get human-readable discount description
 * @param discountCode - Discount code details
 * @returns Description string
 */
export function getDiscountDescription(
  discountCode: Pick<DiscountCode, 'discount_type' | 'discount_value'>
): string {
  if (discountCode.discount_type === 'percentage') {
    return `${discountCode.discount_value}% off`;
  } else {
    return `$${discountCode.discount_value.toFixed(2)} off`;
  }
}

/**
 * Check if discount code is expired
 * @param expiresAt - Expiration date string
 * @returns True if expired
 */
export function isDiscountCodeExpired(expiresAt?: string): boolean {
  if (!expiresAt) {
    return false; // No expiration date means never expires
  }

  return new Date() > new Date(expiresAt);
}

/**
 * Check if discount code usage limit is reached
 * @param discountCode - Discount code details
 * @returns True if limit reached
 */
export function isUsageLimitReached(
  discountCode: Pick<DiscountCode, 'usage_type' | 'current_uses' | 'max_uses'>
): boolean {
  if (discountCode.usage_type === 'one_time' && discountCode.current_uses >= 1) {
    return true;
  }

  if (
    discountCode.usage_type === 'multi_use' &&
    discountCode.max_uses &&
    discountCode.current_uses >= discountCode.max_uses
  ) {
    return true;
  }

  return false;
}

/**
 * Get discount code status for display
 * @param discountCode - Discount code details
 * @returns Status object with label and color
 */
export function getDiscountCodeStatus(
  discountCode: Pick<
    DiscountCode,
    'is_active' | 'expires_at' | 'usage_type' | 'current_uses' | 'max_uses'
  >
): { label: string; color: string } {
  if (!discountCode.is_active) {
    return { label: 'Inactive', color: 'text-gray-500' };
  }

  if (isDiscountCodeExpired(discountCode.expires_at)) {
    return { label: 'Expired', color: 'text-red-500' };
  }

  if (isUsageLimitReached(discountCode)) {
    return { label: 'Limit Reached', color: 'text-orange-500' };
  }

  return { label: 'Active', color: 'text-green-500' };
}

/**
 * Format expiration date for display
 * @param expiresAt - Expiration date string
 * @returns Formatted string like "Expires in 2 days" or "Expires on Jan 21, 2026"
 */
export function formatExpirationDate(expiresAt?: string): string {
  if (!expiresAt) {
    return 'Never expires';
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffInMs = expirationDate.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInMs < 0) {
    return 'Expired';
  }

  if (diffInHours < 1) {
    const minutes = Math.floor((diffInMs / (1000 * 60)));
    return `Expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
  }

  return `Expires on ${expirationDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate percentage
 * @param part - Part value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}
