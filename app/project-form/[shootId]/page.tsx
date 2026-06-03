"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";
import { affiliateApi } from "@/lib/api";

type PageProps = {
  params: Promise<{
    shootId: string;
  }>;
};

export default function PublicProjectFormPage({ params }: PageProps) {
  const { shootId } = use(params);
  const numericShootId = useMemo(() => Number(shootId), [shootId]);
  const isShootIdValid = Number.isFinite(numericShootId) && numericShootId > 0;

  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isShootIdValid) {
      setStatusMessage("Invalid shoot ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const response = await affiliateApi.getProjectFormStatusGuest(numericShootId);
    const submitted = Boolean(response?.data?.is_submitted);
    setIsSubmitted(submitted);
    setStatusMessage(response?.message || "");
    setLoading(false);
  }, [isShootIdValid, numericShootId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-20 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-[#111]/70 p-8 md:p-10 text-white">
            <h1 className="text-2xl md:text-4xl font-bold mb-3">Project Details Form</h1>
            <p className="text-white/70 mb-8">Shoot ID: {shootId}</p>

            {loading ? (
              <div className="flex items-center gap-3 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin text-[#E8D1AB]" />
                Checking form status...
              </div>
            ) : !isShootIdValid ? (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Invalid link</p>
                  <p className="text-red-100/80 text-sm">The shoot ID in this URL is not valid.</p>
                </div>
              </div>
            ) : isSubmitted ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-300 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-200">Form already submitted</p>
                    <p className="text-green-100/80 text-sm">
                      {statusMessage || "Thanks. We already received your project details for this shoot."}
                    </p>
                  </div>
                </div>
                <Link href="/" className="inline-flex h-11 items-center px-6 rounded-lg bg-[#E8D1AB] text-black font-medium hover:bg-[#dcb98a]">
                  Back to Home
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#E8D1AB]/30 bg-[#E8D1AB]/10 p-4">
                  <p className="text-sm text-[#f2e2c6]">
                    Please fill this form so we can prepare your shoot smoothly.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex h-11 items-center px-6 rounded-lg bg-[#E8D1AB] text-black font-medium hover:bg-[#dcb98a]"
                >
                  Open Form
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {isShootIdValid && (
        <AffiliateShootDetailsForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          projectId={numericShootId}
          hideAffiliateStep={true}
          onSubmitSuccess={() => {
            setShowForm(false);
            setIsSubmitted(true);
            setStatusMessage("Project form submitted and saved successfully.");
          }}
        />
      )}
    </>
  );
}
