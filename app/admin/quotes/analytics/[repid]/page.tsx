"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import Image from "next/image";

import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import QuotesOverdueWidget from "@/components/admin/quotes/QuotesOverdue";
import OpenPipelineWidget from "@/components/admin/quotes/OpenPipeline";
import ConversionPerformanceWidget from "@/components/admin/quotes/ConversionPerformance";
import QuotePerformanceWidget from "@/components/admin/quotes/QuotePerformance";
import {
  DealColumn,
  DealColumnData,
} from "@/components/admin/quotes/DealColumn";
import {
  salesApi,
  type QuoteAnalyticsQuoteListData,
  type QuoteAnalyticsQuoteRow,
} from "@/lib/api";

type RepAnalyticsData = {
  sales_rep?: {
    name?: string | null;
    profile_image?: string | null;
    profile_photo?: string | null;
    image?: string | null;
  };

  performance_chart?: {
    date: string;
    quote_value: number;
    quotes_sent: number;
    deals_won: number;
    won_revenue: number;
  }[];

  overview?: {
    open_pipeline?: {
      count: number;
      value: number;
      by_status: {
        status: "sent" | "accepted" | "partially_paid";
        count: number;
        value: number;
      }[];
    };

    overdue_follow_ups?: {
      count: number;
      value: number;
      by_status: {
        status: "sent" | "accepted" | "partially_paid";
        count: number;
        value: number;
      }[];
    };

    deals_won?: number;
    quotes_sent?: number;
    win_rate?: number;
    average_deal_size?: number;
    quote_to_cash_conversion?: number;
  };
};

const formatAnalyticsDate = (
  value?: string | null
): string => {
  if (!value) {
    return "-";
  }

  try {
    const rawValue = String(value).trim();

    if (!rawValue) {
      return "-";
    }

    const dateOnlyMatch = rawValue.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    const normalizedValue = dateOnlyMatch
      ? `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`
      : rawValue;

    const parsedDate = parseISO(normalizedValue);

    if (!isValid(parsedDate)) {
      return "-";
    }

    return format(parsedDate, "dd MMM, yyyy");
  } catch {
    return "-";
  }
};

const toDealColumn = (
  title: string,
  response: QuoteAnalyticsQuoteListData | null
): DealColumnData => ({
  title,

  count: response?.pagination?.total ?? 0,

  deals: (response?.rows ?? []).map(
    (quote: QuoteAnalyticsQuoteRow) => {
      const name = quote.client?.name || "Client";

      return {
        id: String(quote.sales_quote_id),

        initials: name
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),

        name,

        quoteId: quote.quote_number || "-",

        email: quote.client?.email || "-",

        status:
          quote.quote_status === "accepted"
            ? "Accepted"
            : quote.quote_status === "rejected"
              ? "Rejected"
              : "Pending",

        project: quote.project || "-",

        bookingStatus: quote.lead_source || "Pending",

        amount: `$${Number(
          quote.quote_value || 0
        ).toLocaleString()}`,

        paid: `$${Number(
          quote.collected_amount || 0
        ).toLocaleString()}`,

        pending: `$${Number(
          quote.outstanding_amount || 0
        ).toLocaleString()}`,

        validity: formatAnalyticsDate(
          quote.validity?.valid_until
        ),
      };
    }
  ),
});

export default function QuoteSalesRepDetailsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const params = useParams<{
    repid: string;
  }>();

  const { isDark } = useResolvedTheme();

  const salesRepId = String(
    params?.repid || ""
  );

  const [analytics, setAnalytics] =
    useState<RepAnalyticsData | null>(null);

  const [dealsWon, setDealsWon] =
    useState<QuoteAnalyticsQuoteListData | null>(
      null
    );

  const [overdueQuotes, setOverdueQuotes] =
    useState<QuoteAnalyticsQuoteListData | null>(
      null
    );

  const [
    overdueAllQuotes,
    setOverdueAllQuotes,
  ] =
    useState<QuoteAnalyticsQuoteListData | null>(
      null
    );

  const [overduePage, setOverduePage] =
    useState(1);

  const [
    profileImageFailed,
    setProfileImageFailed,
  ] = useState(false);

  useEffect(() => {
    if (!salesRepId) {
      return;
    }

    setOverduePage(1);

    const load = async () => {
      const [
        analyticsResponse,
        dealsWonResponse,
        overdueAllResponse,
      ] = await Promise.all([
        salesApi.getQuoteAnalyticsByRep(
          salesRepId
        ),

        salesApi.getQuoteAnalyticsQuotes({
          bucket: "deals_won",
          sales_rep_id: salesRepId,
          limit: "all",
        }),

        salesApi.getQuoteAnalyticsQuotes({
          bucket: "overdue_follow_ups",
          sales_rep_id: salesRepId,
          limit: "all",
        }),
      ]);

      if (analyticsResponse.success) {
        setAnalytics(
          analyticsResponse.data as RepAnalyticsData
        );
      }

      if (dealsWonResponse.success) {
        setDealsWon(
          dealsWonResponse.data
        );
      }

      if (overdueAllResponse.success) {
        setOverdueAllQuotes(
          overdueAllResponse.data
        );
      }
    };

    void load();
  }, [salesRepId]);

  useEffect(() => {
    if (!salesRepId) {
      return;
    }

    const loadOverdueTable =
      async () => {
        const overdueResponse =
          await salesApi.getQuoteAnalyticsQuotes(
            {
              bucket:
                "overdue_follow_ups",
              sales_rep_id: salesRepId,
              page: overduePage,
              limit: 10,
            }
          );

        if (overdueResponse.success) {
          setOverdueQuotes(
            overdueResponse.data
          );
        }
      };

    void loadOverdueTable();
  }, [overduePage, salesRepId]);

  const dealWonColumn = useMemo(
    () =>
      toDealColumn(
        "Deal Won",
        dealsWon
      ),
    [dealsWon]
  );

  const overdueColumn = useMemo(
    () =>
      toDealColumn(
        "Overdue Follow-ups",
        overdueAllQuotes
      ),
    [overdueAllQuotes]
  );

  const conversionData = {
    deals_won:
      analytics?.overview?.deals_won ??
      0,

    quotes_sent:
      analytics?.overview?.quotes_sent ??
      0,

    win_rate:
      analytics?.overview?.win_rate ??
      0,

    average_deal_size:
      analytics?.overview
        ?.average_deal_size ?? 0,

    quote_to_cash_conversion:
      analytics?.overview
        ?.quote_to_cash_conversion ?? 0,
  };

  const salesRepName =
    analytics?.sales_rep?.name ||
    "Sales Representative";

  const salesRepImage =
    analytics?.sales_rep
      ?.profile_image ||
    analytics?.sales_rep
      ?.profile_photo ||
    analytics?.sales_rep?.image;

  const salesRepInitial =
    salesRepName
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  useEffect(() => {
    setProfileImageFailed(false);
  }, [salesRepImage]);

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          create: "Master Pricing",
        }}
      />

      <div
        className="overflow-hidden space-y-6 p-4 pb-20 lg:p-6 lg:px-10 lg:py-9"
        style={{
          fontFamily:
            "var(--font-instrument-sans)",
        }}
      >
        <div className="flex min-w-0 items-start gap-4 lg:items-center">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className={`flex items-center gap-2 text-sm transition-colors lg:text-base ${
              isDark
                ? "text-white hover:text-[#E0E0E0]"
                : "text-black hover:text-black/70"
            }`}
          >
            <ArrowLeft size={20} />

            <span>
              Back
            </span>
          </button>
        </div>

        <div
          className={`flex items-center gap-4 rounded-2xl border p-5 ${
            isDark
              ? "border-[#3D3D3D] bg-[#101010]"
              : "border-black/20 bg-black/5"
          }`}
        >
          {salesRepImage &&
          !profileImageFailed ? (
            <div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-full lg:h-21 lg:w-21">
              <Image
                src={salesRepImage}
                alt={salesRepName}
                fill
                className="object-cover"
                onError={() =>
                  setProfileImageFailed(
                    true
                  )
                }
              />
            </div>
          ) : (
            <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] text-2xl font-bold text-black lg:h-21 lg:w-21 lg:text-3xl">
              {salesRepInitial}
            </div>
          )}

          <p className="text-base font-medium lg:text-xl">
            {salesRepName}
          </p>
        </div>

        <div className="space-y-3 lg:space-y-6">
          <div className="flex w-full flex-col gap-5 lg:flex-row">
            <div className="h-full w-full lg:w-3/5">
              <QuotePerformanceWidget
                data={
                  analytics?.performance_chart ??
                  []
                }
              />
            </div>

            <div className="h-full w-full lg:w-2/5">
              <ConversionPerformanceWidget
                isDark={isDark}
                data={conversionData}
              />
            </div>
          </div>

          <div>
            <OpenPipelineWidget
              isDark={isDark}
              data={
                analytics?.overview
                  ?.open_pipeline ??
                undefined
              }
              filters={{
                sales_rep_id:
                  salesRepId,
              }}
            />
          </div>

          <div>
            <QuotesOverdueWidget
              isDark={isDark}
              data={
                analytics?.overview
                  ?.overdue_follow_ups ??
                undefined
              }
              quotesData={
                overdueQuotes as never
              }
              onPageChange={
                setOverduePage
              }
            />
          </div>

          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-x-hidden lg:pb-0">
            <div className="w-[90%] min-w-[90%] shrink-0 snap-center lg:w-full lg:min-w-0">
              <DealColumn
                data={dealWonColumn}
                isDark={isDark}
              />
            </div>

            <div className="w-[90%] min-w-[90%] shrink-0 snap-center lg:w-full lg:min-w-0">
              <DealColumn
                data={overdueColumn}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}