"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";

type Review = {
  review_id: number;
  user_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

function CreatorReviewsContent() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id") || "";
  const highlightedReviewId = searchParams.get("review_id") || "";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!/^\d+$/.test(creatorId)) {
      setError("Creator review link is invalid.");
      setLoading(false);
      return;
    }
    let active = true;
    apiClient.get<{ data: Review[] }>(`reviews/by-creator/${creatorId}`, { limit: 100 })
      .then((response) => { if (active) setReviews(response.data || []); })
      .catch(() => { if (active) setError("Could not load reviews."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [creatorId]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-white">
      <h1 className="text-2xl font-semibold">Client reviews</h1>
      {loading && <p>Loading reviews…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && reviews.length === 0 && <p>No reviews yet.</p>}
      {reviews.map((review) => (
        <article key={review.review_id} id={`review-${review.review_id}`}
          className={`rounded-xl border p-5 ${String(review.review_id) === highlightedReviewId ? "border-[#E8D1AB] bg-[#302a20]" : "border-white/15 bg-white/5"}`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-medium">{review.user_name || "Client"}</h2>
            <span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, Number(review.rating) || 0)))}</span>
          </div>
          <p className="mt-2 text-sm text-white/75">{review.review_text || "No written comment."}</p>
          <time className="mt-3 block text-xs text-white/50">{new Date(review.created_at).toLocaleDateString()}</time>
        </article>
      ))}
    </main>
  );
}

export default function CreatorReviewsPage() {
  return <Suspense fallback={<main className="p-6 text-white">Loading reviews…</main>}><CreatorReviewsContent /></Suspense>;
}
