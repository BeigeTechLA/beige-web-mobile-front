// Define Request and Response Interfaces
export interface SubscribeNewsletterPayload {
  email: string;
}

export interface SubscribeNewsletterResponse {
  success: boolean;
  message: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://revure-api.beige.app/v1/';

/**
 * Subscribes an email to the Press Blogs newsletter.
 */
export async function subscribeToNewsletter(
  payload: SubscribeNewsletterPayload
): Promise<SubscribeNewsletterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to subscribe to newsletter.");
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while subscribing.");
  }
}