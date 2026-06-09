"use client";

import React, { useState } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Review {
  id: string;
  user: {
    name: string;
    image: string;
    date: string;
  };
  comment: string;
}

const ratings = [
  { label: 'Cleanliness', score: 3.5 },
  { label: 'Communication', score: 4.6 },
  { label: 'Check-in', score: 4.5 },
];

const reviews: Review[] = [
  {
    id: '1',
    user: { name: 'Mira', image: '/images/crew/CREW(8).png', date: 'December 2021' },
    comment: 'Host was very attentive.'
  },
  {
    id: '2',
    user: { name: 'Shayna', image: '/images/crew/CREW(9).png', date: 'December 2021' },
    comment: 'Wonderful neighborhood, easy access to restaurants and the subway, cozy studio apartment with a super comfortable bed. Great host, super helpful and responsive. Cool murphy bed and extra amenities made the stay very smooth.'
  },
  {
    id: '3',
    user: { name: 'Jose', image: '/images/crew/CREW(10).png', date: 'November 2020' },
    comment: 'Morbi id interdum velit. Fusce vel leo ut eros aliquam lacinia in sed dolor. Vestibulum maximus, orci quis maximus euismod, dui lorem sodales tellus, id aliquet nunc nisi non diam. Vestibulum nec mauris convallis, imperdiet tellus a, porta risus. Pellentesque pharetra velit vel mi luctus congue. Vivamus non tincidunt felis, vitae luctus libero.'
  },
  {
    id: '4',
    user: { name: 'Faiza', image: '/images/crew/CREW(2).png', date: 'November 2020' },
    comment: 'This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price.'
  },
  {
    id: '5',
    user: { name: 'Vladko', image: '/images/crew/CREW(3).png', date: 'November 2020' },
    comment: 'This is amazing place. It has everything one needs for a monthly business stay. Very clean and organized place. Amazing hospitality affordable price.'
  }
];

export const ReviewsComponent = ({ isDark = true }: { isDark?: boolean }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className={`space-y-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
      {/* Header & Overall Rating */}
      <div className="flex items-center gap-2 text-lg lg:text-2xl font-medium">
        <Star size={24} fill="currentColor" className="text-[#E8D1AB]" />
        <span>5.0 · 7 reviews</span>
      </div>

      {/* Ratings Progress Bars */}
      <div className="flex flex-col gap-2 lg:gap-4 max-w-xs">
        {ratings.map((rating) => (
          <div key={rating.label} className="flex items-center justify-between gap-4">
            <span className={`text-base flex-1 ${isDark ? 'text-white' : 'text-zinc-600'}`}>
              {rating.label}
            </span>
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className={`h-[3px] flex-1 rounded-full ${isDark ? 'bg-[#6B7280]' : 'bg-zinc-200'}`}>
                <div
                  className={`h-full rounded-full ${isDark ? 'bg-[#E8D1AB]' : 'bg-black'}`}
                  style={{ width: `${(rating.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums">{rating.score.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Review Cards */}
      <div className="grid grid-cols-1 gap-5 lg:gap-10 mt-12">
        {visibleReviews.map((review) => (
          <ReviewItem key={review.id} review={review} isDark={isDark} />
        ))}
      </div>

      {/* Action Button */}
      <button 
        onClick={() => setShowAllReviews(!showAllReviews)}
        className={`mt-6 px-6 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 ${isDark ? 'bg-[#f3e3ce] text-black hover:bg-[#e2d1b1]' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
        }`}
      >
        {showAllReviews ? "Show less" : `Show all ${reviews.length} reviews`}
      </button>
    </div>
  );
};

const ReviewItem = ({ review, isDark }: { review: Review; isDark: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongComment = review.comment.length > 150;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden relative">
          <Image
            src={review.user.image}
            alt={review.user.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-medium text-sm lg:text-base">{review.user.name}</h4>
          <p className={`text-xs lg:text-sm ${isDark ? 'text-[#6B7280]' : 'text-zinc-400'}`}>
            {review.user.date}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className={`text-sm lg:text-base leading-relaxed ${!isExpanded && isLongComment ? 'line-clamp-2' : ''}`}>
          {review.comment}
        </p>
        
        {isLongComment && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm font-medium underline decoration-2 underline-offset-4"
          >
            {isExpanded ? "Show less" : "Show more"} 
            <ChevronRight size={14} strokeWidth={3} className={isExpanded ? "-rotate-90 transition-transform" : "rotate-0 transition-transform"} />
          </button>
        )}
      </div>
    </div>
  );
};