import { useState } from "react";
import { subscribeToNewsletter, SubscribeNewsletterPayload } from "@/lib/newsletterApi";

export function useNewsletter() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const subscribe = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await subscribeToNewsletter({ email });
      setSuccessMessage(res.message || "Subscribed successfully!");
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error, successMessage };
}