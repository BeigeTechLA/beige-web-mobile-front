"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { toast } from "sonner";

export default function SharedFileManagerPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = String(params?.shareToken || "");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "content">("email");
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [content, setContent] = useState<any>(null);

  const loadContent = async (token: string) => {
    const response = await fileManagerApi.getSharedContent(shareToken, token);
    setContent(response?.data || null);
  };

  const requestOtp = async () => {
    try {
      setLoading(true);
      await fileManagerApi.requestExternalShareOtp(shareToken, email.trim().toLowerCase());
      setStep("otp");
      toast.success("OTP sent to your email");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      const result = await fileManagerApi.verifyExternalShareOtp(
        shareToken,
        email.trim().toLowerCase(),
        otp.trim()
      );
      const token = result?.data?.accessToken;
      if (!token) throw new Error("Verification failed");
      setAccessToken(token);
      await loadContent(token);
      setStep("content");
      toast.success("Verified successfully");
    } catch (error: any) {
      toast.error(error?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filepath?: string) => {
    if (!accessToken) return;
    try {
      const result = await fileManagerApi.getSharedFileDownloadUrl(shareToken, accessToken, filepath);
      if (result?.data?.url) {
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to get download link");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-[#171717] p-6">
        <h1 className="text-2xl font-semibold">Shared Files</h1>
        <p className="mt-1 text-sm text-white/60">Email verification is required to view this shared resource.</p>

        {step === "email" ? (
          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-white/10 bg-[#1D1D1D] px-3 py-2"
            />
            <Button onClick={requestOtp} disabled={loading || !email.trim()} className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90">
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-lg border border-white/10 bg-[#1D1D1D] px-3 py-2"
            />
            <Button onClick={verifyOtp} disabled={loading || !otp.trim()} className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90">
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        ) : null}

        {step === "content" ? (
          <div className="mt-6 space-y-4">
            {content?.type === "file" ? (
              <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                <p className="text-sm text-white/70">{content?.file?.name}</p>
                <div className="mt-3">
                  <Button onClick={() => downloadFile(content?.file?.path)} className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90">
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(content?.folders) && content.folders.length ? (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                    <p className="mb-2 text-sm text-white/60">Folders</p>
                    {content.folders.map((folder: any) => (
                      <div key={folder.path} className="py-1 text-sm">{folder.name}</div>
                    ))}
                  </div>
                ) : null}
                {Array.isArray(content?.files) && content.files.length ? (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
                    <p className="mb-2 text-sm text-white/60">Files</p>
                    {content.files.map((file: any) => (
                      <div key={file.path} className="flex items-center justify-between gap-3 py-1">
                        <span className="text-sm">{file.name}</span>
                        <Button onClick={() => downloadFile(file.path)} className="h-8 bg-[#E5D5B8] px-3 text-xs text-black hover:bg-[#E5D5B8]/90">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
