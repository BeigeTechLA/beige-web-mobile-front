"use client";

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Review } from '@/types/payment';
import { format } from 'date-fns';

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-[#171717] rounded-[20px] p-6 lg:p-8">
        <h3 className="font-bold mb-4 text-base lg:text-xl">Recent Reviews</h3>
        <p className="text-white/60 text-sm">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#171717] rounded-[20px] p-6 lg:p-8">
      <h3 className="font-bold mb-6 text-base lg:text-xl">Recent Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
            <div className="flex items-start gap-3 mb-2">
              {review.reviewer_image ? (
                <Image
                  src={review.reviewer_image}
                  alt={review.reviewer_name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center text-[#E8D1AB] font-medium">
                  {review.reviewer_name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm lg:text-base">{review.reviewer_name || 'Anonymous'}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 lg:w-4 lg:h-4 ${
                          i < review.rating
                            ? 'fill-[#E8D1AB] text-[#E8D1AB]'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-white/70 text-xs lg:text-sm mb-1">{review.comment}</p>
                <span className="text-white/40 text-xs">
                  {format(new Date(review.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
