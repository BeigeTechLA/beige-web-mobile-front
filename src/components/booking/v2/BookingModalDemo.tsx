"use client";

import React, { useState } from "react";
import { BookingModal } from "./BookingModal";

/**
 * Demo component showing how to use the V2 Booking Modal
 *
 * This is a simplified, Redux-free version of the booking modal system.
 * All state is managed locally with useState.
 *
 * Usage:
 * ```tsx
 * import { BookingModalDemo } from "@/src/components/booking/v2/BookingModalDemo";
 *
 * function MyPage() {
 *   return <BookingModalDemo />;
 * }
 * ```
 *
 * Or use the modal directly:
 * ```tsx
 * import { BookingModal } from "@/src/components/booking/v2";
 *
 * function MyPage() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Book Now</button>
 *       <BookingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
 *     </>
 *   );
 * }
 * ```
 */
export const BookingModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          V2 Booking Modal Demo
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          This is the simplified, Redux-free booking modal system.
          All state is managed locally with useState.
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-lg rounded-[12px] transition-colors"
        >
          Open Booking Modal
        </button>

        <div className="mt-8 text-left max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Changes from Original:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Removed Redux dependencies (useAppSelector, useAppDispatch)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Replaced with local useState for form data and step management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Removed API integration (usePostOrderMutation)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Mock order creation with console.log output</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Navigation replaced with console.log statements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>All validation logic preserved with local state</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>100% visual accuracy maintained - all styles, animations, transitions</span>
            </li>
          </ul>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
