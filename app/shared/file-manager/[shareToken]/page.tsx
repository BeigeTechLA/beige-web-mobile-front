"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Download, Lock, Mail, ShieldCheck, FileText, ArrowLeft,
  ChevronRight, Eye, X, Check, FileImage, FileVideo, FileArchive,
  FileSpreadsheet, Presentation, Home, KeyRound, CheckCircle2, EyeOff,
  FileX2
} from "lucide-react";
import { toast } from "sonner";

type ShareStep = "email" | "otp" | "content";

type SharedFolder = {
  name?: string;
  path?: string;
  fileCount?: number;
};

type SharedFile = {
  name?: string;
  path?: string;
  size?: number;
  contentType?: string;
};

type SharedPageError = Error & { status?: number };

type SharedContent = {
  type?: "file" | "folder" | "workspace";
  phase?: string;
  path?: string;
  folders?: SharedFolder[];
  files?: SharedFile[];
  file?: SharedFile;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isSharedResourceUnavailable = (error: unknown) => {
  const sharedError = error as SharedPageError;
  const message = String(sharedError?.message || "").toLowerCase();
  return sharedError?.status === 410 || (
    sharedError?.status === 404 &&
    (message.includes("share") || message.includes("not found"))
  ) || message.includes("no longer available") || message.includes("deleted by the owner");
};

const formatFileSize = (bytes?: number) => {
  const value = Number(bytes || 0);
  if (!value || value < 1024) return `${value || 0} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const isPreProdLabel = (value?: string) => String(value || "").trim().toLowerCase() === "pre-production";
const isPostProdLabel = (value?: string) => String(value || "").trim().toLowerCase() === "post-production";

const getFileExt = (name?: string) => {
  const parts = (name || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const getFileMeta = (contentType?: string, name?: string) => {
  const ext = getFileExt(name);
  const ct = (contentType || "").toLowerCase();
  if (ct.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg","bmp","avif"].includes(ext))
    return { icon: FileImage, label: "Image", accent: "text-[#22C55E]", badge: "bg-[#22C55E]/15" };
  if (ct.startsWith("video/") || ["mp4","mov","avi","mkv","webm"].includes(ext))
    return { icon: FileVideo, label: "Video", accent: "text-[#E8D1AB]", badge: "bg-[#E8D1AB]/15" };
  if (ct === "application/pdf" || ext === "pdf")
    return { icon: FileText, label: "PDF", accent: "text-[#F04438]", badge: "bg-[#F04438]/15" };
  if (["ppt","pptx","key"].includes(ext))
    return { icon: Presentation, label: ext.toUpperCase(), accent: "text-[#F97316]", badge: "bg-[#F97316]/15" };
  if (["xls","xlsx","csv"].includes(ext))
    return { icon: FileSpreadsheet, label: ext.toUpperCase(), accent: "text-[#10B981]", badge: "bg-[#10B981]/15" };
  if (["zip","rar","7z","tar","gz"].includes(ext))
    return { icon: FileArchive, label: ext.toUpperCase(), accent: "text-[#A855F7]", badge: "bg-[#A855F7]/15" };
  return { icon: FileText, label: ext.toUpperCase() || "FILE", accent: "text-white/70", badge: "bg-white/10" };
};

function OtpDigitInput({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleInput = (i: number, char: string) => {
    const d = char.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    while (arr.length <= i) arr.push("");
    arr[i] = d;
    onChange(arr.join("").trim());
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[i]) {
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = "";
        onChange(arr.join(""));
        refs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(p);
    const nextIdx = Math.min(p.length, length - 1);
    refs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      {Array.from({ length }, (_, i) => {
        const isFocused = value.length === i || (i === length - 1 && value.length === length);
        const hasValue = !!value[i];
        
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={`h-16 w-full max-w-[64px] rounded-2xl border-2 bg-white/[0.03] text-center text-2xl font-bold transition-all duration-200 outline-none
              ${hasValue ? 'border-[#E5D5B8] text-white bg-[#E5D5B8]/[0.05]' : 'border-white/10 text-white/40'}
              ${isFocused ? 'border-[#E5D5B8] ring-4 ring-[#E5D5B8]/10 bg-white/[0.05]' : ''}
              focus:border-[#E5D5B8] focus:ring-4 focus:ring-[#E5D5B8]/10 focus:bg-white/[0.05]
            `}
            placeholder="•"
          />
        );
      })}
    </div>
  );
}

function Thumbnail({ file, getFileThumbnail }: { file: SharedFile; getFileThumbnail: (file: SharedFile) => Promise<string> }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let active = true;
    void getFileThumbnail(file).then((r) => { if (active) setUrl(r || ""); });
    return () => { active = false; };
  }, [file, getFileThumbnail]);
  if (!url) return <div className="flex h-full w-full items-center justify-center"><FileText className="h-5 w-5 text-white/40" /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={file.name || "thumbnail"} className="h-full w-full object-cover" />;
}

export default function SharedFileManagerPage() {
  const params = useParams<{ shareToken: string }>();
  const shareToken = String(params?.shareToken || "");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<ShareStep>("email");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [content, setContent] = useState<SharedContent | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; contentType?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState("");

  const handleUnavailableError = (error: unknown) => {
    if (!isSharedResourceUnavailable(error)) return false;
    setUnavailableMessage(
      "This shared file or folder is no longer available. It may have been deleted by the owner."
    );
    setContent(null);
    return true;
  };

  const folders = useMemo(() => (Array.isArray(content?.folders) ? (content.folders as SharedFolder[]) : []), [content]);
  const files = useMemo(() => (Array.isArray(content?.files) ? (content.files as SharedFile[]) : []), [content]);
  const selectionLockActive = selectedFilePaths.length > 0;

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; phase?: string; path?: string }> = [{ label: "Shared Root" }];
    if (currentPhase) {
      crumbs.push({ label: currentPhase === "pre" ? "Pre-Production" : "Post-Production", phase: currentPhase });
    }
    const segments = String(currentPath || "")
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    segments.forEach((segment, index) => {
      crumbs.push({
        label: segment,
        phase: currentPhase,
        path: segments.slice(0, index + 1).join("/"),
      });
    });
    return crumbs;
  }, [currentPhase, currentPath]);

  useEffect(() => {
  let interval: NodeJS.Timeout;
  if (resendTimer > 0) {
    interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
  }
  return () => clearInterval(interval);
}, [resendTimer]);

  const loadContent = async (token: string, options?: { phase?: string; path?: string }) => {
    const response = await fileManagerApi.getSharedContent(shareToken, token, options);
    const payload = response?.data || null;
    setContent(payload);
    setCurrentPhase(payload?.phase || options?.phase);
    setCurrentPath(payload?.path || options?.path);
    setSelectedFilePaths([]);
  };

  const requestOtp = async () => {
    try {
      setLoading(true);
      await fileManagerApi.requestExternalShareOtp(shareToken, email.trim().toLowerCase());
      setOtp("");
      setStep("otp");
      setResendTimer(60);
      toast.success("OTP sent to your email");
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
     if (resendTimer > 0) return;
    try {
      setResendLoading(true);
      await fileManagerApi.requestExternalShareOtp(shareToken, email.trim().toLowerCase());
      setOtp("");
      setResendTimer(60);
      toast.success("New OTP sent to your email");
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) {
        toast.error(error instanceof Error ? error.message : "Failed to resend OTP");
      }
    } finally {
      setResendLoading(false);
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
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filepath?: string) => {
    if (!accessToken || !filepath) return;
    try {
      const result = await fileManagerApi.getSharedFileDownloadUrl(
        shareToken,
        accessToken,
        filepath,
        { phase: currentPhase, path: currentPath }
      );
      if (result?.data?.url) {
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to get download link"));
    }
  };

  const downloadBlobInPage = async (filepath: string, fileName: string) => {
    const result = await fileManagerApi.getSharedFileDownloadUrl(
      shareToken,
      accessToken,
      filepath,
      { phase: currentPhase, path: currentPath }
    );
    const url = result?.data?.url;
    if (!url) throw new Error("Download URL missing");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to download file");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName || "file";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const toggleFileSelection = (filepath?: string) => {
    const path = String(filepath || "").trim();
    if (!path) return;
    setSelectedFilePaths((prev) =>
      prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path]
    );
  };

  const downloadSelectedFiles = async () => {
    if (!selectedFilePaths.length) return;
    try {
      setBulkDownloading(true);
      for (const path of selectedFilePaths) {
        const file = files.find((item) => item.path === path);
        await downloadBlobInPage(path, String(file?.name || "file"));
      }
      setSelectedFilePaths([]);
      toast.success(`Downloaded ${selectedFilePaths.length} file(s)`);
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to download selected files"));
    } finally {
      setBulkDownloading(false);
    }
  };

  const openPreview = async (file: SharedFile) => {
    if (!file?.path) return;
    try {
      setPreviewLoading(true);
      const result = await fileManagerApi.getSharedFileViewUrl(
        shareToken,
        accessToken,
        file.path,
        { phase: currentPhase, path: currentPath }
      );
      const url = result?.data?.url;
      if (!url) throw new Error("Preview URL missing");
      setPreviewFile({
        name: String(file.name || "File"),
        url,
        contentType: file.contentType,
      });
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to open preview"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const isPreviewImage = (file?: { name?: string; contentType?: string }) => {
    const name = String(file?.name || "").toLowerCase();
    const ct = String(file?.contentType || "").toLowerCase();
    return ct.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(name);
  };

  const isPreviewVideo = (file?: { name?: string; contentType?: string }) => {
    const name = String(file?.name || "").toLowerCase();
    const ct = String(file?.contentType || "").toLowerCase();
    return ct.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(name);
  };

  const isPreviewPdf = (file?: { name?: string; contentType?: string }) => {
    const name = String(file?.name || "").toLowerCase();
    const ct = String(file?.contentType || "").toLowerCase();
    return ct === "application/pdf" || /\.pdf$/i.test(name);
  };

  const getFileThumbnail = async (file: SharedFile) => {
    if (!file?.path) return "";
    try {
      const response = await fileManagerApi.getSharedFileViewUrl(
        shareToken,
        accessToken,
        file.path,
        { phase: currentPhase, path: currentPath }
      );
      return response?.data?.url || "";
    } catch {
      return "";
    }
  };

  const openFolder = async (folder: SharedFolder) => {
    if (!accessToken) return;

    try {
      const folderName = String(folder?.name || "").trim();
      if (!currentPhase && isPreProdLabel(folderName)) {
        await loadContent(accessToken, { phase: "pre" });
        return;
      }
      if (!currentPhase && isPostProdLabel(folderName)) {
        await loadContent(accessToken, { phase: "post" });
        return;
      }

      const nextPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      await loadContent(accessToken, { phase: currentPhase, path: nextPath });
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to open folder"));
    }
  };

  const goToCrumb = async (crumb: { phase?: string; path?: string }, index: number) => {
    if (!accessToken) return;
    try {
      if (index === 0) {
        await loadContent(accessToken);
        return;
      }
      await loadContent(accessToken, { phase: crumb.phase, path: crumb.path });
    } catch (error: unknown) {
      if (!handleUnavailableError(error)) toast.error(getErrorMessage(error, "Failed to open location"));
    }
  };

  const stepConfig = [
    { key: "email", label: "Email", icon: Mail },
    { key: "otp", label: "Verify", icon: KeyRound },
    { key: "content", label: "Access", icon: FolderOpen },
  ];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : 2;

  if (unavailableMessage) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060608] px-4 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[20%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#E5D5B8]/[0.06] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center backdrop-blur-xl md:p-10"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5D5B8]/10">
            <FileX2 className="h-8 w-8 text-[#E5D5B8]" />
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E5D5B8]/80">Beige</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Shared content unavailable</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">{unavailableMessage}</p>
          <p className="mt-6 text-xs text-white/30">Please contact the sender if you still need access.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#060608] text-white overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-[15%] h-[500px] w-[500px] rounded-full bg-[#E5D5B8]/[0.07] blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-[#7BA1FF]/[0.05] blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[10%] left-[40%] h-[300px] w-[300px] rounded-full bg-[#A855F7]/[0.04] blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 backdrop-blur-xl"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E5D5B8]/80">Beige</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Shared File Manager</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#E5D5B8]/20 bg-[#E5D5B8]/[0.08] px-4 py-2 text-xs font-medium text-[#E5D5B8]">
            <EyeOff size={14} />
            View + Download
          </div>
        </motion.div>

        {/* Step Indicator */}
        {step !== "content" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex items-center justify-center gap-0">
            {stepConfig.map((s, i) => {
              const Icon = s.icon;
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      done ? "border-[#E5D5B8] bg-[#E5D5B8] text-black" :
                      active ? "border-[#E5D5B8] bg-[#E5D5B8]/15 text-[#E5D5B8] shadow-[0_0_20px_rgba(229,213,184,0.25)]" :
                      "border-white/15 bg-white/[0.03] text-white/30"
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                    </div>
                    <span className={`text-[11px] font-medium tracking-wide ${active ? "text-[#E5D5B8]" : done ? "text-white/70" : "text-white/30"}`}>{s.label}</span>
                  </div>
                  {i < stepConfig.length - 1 && (
                    <div className={`mx-3 mb-5 h-[2px] w-12 rounded-full transition-colors duration-500 sm:w-20 ${i < stepIndex ? "bg-[#E5D5B8]" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {step !== "content" ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl md:p-8"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#E5D5B8]/[0.06] blur-[60px]" />
              <div className="relative">
                <div className="mb-6 flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5D5B8]/15">
                    {step === "email" ? <Mail className="h-5 w-5 text-[#E5D5B8]" /> : <ShieldCheck className="h-5 w-5 text-[#E5D5B8]" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{step === "email" ? "Verify Your Identity" : "Enter Verification Code"}</h2>
                    <p className="mt-0.5 text-sm text-white/50">
                      {step === "email" ? "Enter the email address that received this shared link." : `We sent a 6-digit code to ${email}`}
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {step === "email" ? (
                    <motion.div key="email-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-white/40">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !loading && email.trim() && requestOtp()}
                          placeholder="you@company.com"
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[15px] outline-none transition-all placeholder:text-white/20 focus:border-[#E5D5B8]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#E5D5B8]/15"
                        />
                      </div>
                      <Button
                        onClick={requestOtp}
                        disabled={loading || !email.trim()}
                        className="h-12 w-full rounded-xl bg-[#E5D5B8] text-sm font-semibold text-black transition-all hover:bg-[#dcb98a] disabled:opacity-40"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                            Sending…
                          </span>
                        ) : "Continue"}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="otp-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                      <div className="space-y-3">
                        <label className="text-xs font-medium uppercase tracking-wider text-white/40">One-Time Passcode</label>
                        <OtpDigitInput value={otp} onChange={setOtp} />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="text-white/40">Code expired or not received?</span>
                          <button
                            type="button"
                            onClick={resendOtp}
                            disabled={loading || resendLoading || !email.trim() || resendTimer > 0}
                            className="font-semibold text-[#E5D5B8] transition-colors hover:text-[#dcb98a] disabled:cursor-not-allowed disabled:text-white/25"
                          >
                            {resendLoading 
                                ? "Sending..." 
                                : resendTimer > 0 
                                  ? `Resend in ${resendTimer}s` 
                                  : "Resend OTP"
                              }
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep("email")}
                          className="group flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white"
                        >
                          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                          Back
                        </button>
                        <Button
                          onClick={verifyOtp}
                          disabled={loading || !otp.trim()}
                          className="h-12 flex-1 rounded-xl bg-[#E5D5B8] text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#dcb98a] active:scale-[0.98] disabled:opacity-40"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                              Verifying…
                            </span>
                          ) : "Verify & Continue"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl md:p-8"
            >
              <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[#7BA1FF]/[0.06] blur-[50px]" />
              <div className="relative">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7BA1FF]/15">
                    <Lock className="h-5 w-5 text-[#7BA1FF]" />
                  </div>
                  <h3 className="text-lg font-semibold">Secure Client Access</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { icon: Mail, text: "Only invited email can open this shared link." },
                    { icon: ShieldCheck, text: "OTP verification required before viewing content." },
                    { icon: EyeOff, text: "Read-only mode: view and download files only." },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                        <item.icon size={13} className="text-white/50" />
                      </div>
                      <span className="text-sm leading-relaxed text-white/60">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl md:p-7"
          >
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Your Shared Files</h2>
                <p className="mt-0.5 text-sm text-white/45">Browse, preview, and download shared content.</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                    <FolderOpen size={12} /> {folders.length} Folder{folders.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                    <FileText size={12} /> {files.length} File{files.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(currentPhase || currentPath) && (
                  <button
                    onClick={() => {
                      if (selectionLockActive) return;
                      loadContent(accessToken);
                    }}
                    disabled={selectionLockActive}
                    className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={16} /> Root
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="mb-6 flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectionLockActive) return;
                      goToCrumb(crumb, index);
                    }}
                    disabled={selectionLockActive}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      index === breadcrumbs.length - 1
                        ? "bg-white/[0.06] font-medium text-white"
                        : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                  >
                    {index === 0 ? <Home size={14} /> : crumb.label}
                  </button>
                  {index < breadcrumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-white/20" />}
                </div>
              ))}
            </div>

            {content?.type === "file" ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getFileMeta(content?.file?.contentType, content?.file?.name).badge}`}>
                    {(() => { const M = getFileMeta(content?.file?.contentType, content?.file?.name); return <M.icon size={20} className={M.accent} />; })()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{content?.file?.name}</p>
                    <p className="text-xs text-white/40">Single file share</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (selectionLockActive) return;
                    downloadFile(content?.file?.path);
                  }}
                  disabled={selectionLockActive}
                  className="h-10 rounded-xl bg-[#E5D5B8] px-5 text-sm font-semibold text-black hover:bg-[#dcb98a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
            ) : (
              <div className="space-y-7">
                {/* Folders */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/35">
                    <FolderOpen size={13} /> Folders
                  </h3>
                  {folders.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {folders.map((folder, fi) => (
                        <motion.button
                          key={folder.path || folder.name}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: fi * 0.04 }}
                          type="button"
                          onClick={() => {
                            if (selectionLockActive) return;
                            openFolder(folder);
                          }}
                          disabled={selectionLockActive}
                          className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-[#E5D5B8]/30 hover:bg-[#E5D5B8]/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5D5B8]/10 transition-colors group-hover:bg-[#E5D5B8]/20">
                            <FolderOpen className="h-5 w-5 text-[#E5D5B8]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{folder.name || "Folder"}</p>
                            <p className="mt-0.5 text-xs text-white/35">
                              {folder.fileCount != null ? `${folder.fileCount} files` : "Open folder"}
                            </p>
                          </div>
                          <ChevronRight size={16} className="shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#E5D5B8]/60" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center text-sm text-white/30">
                      No folders found in this location.
                    </div>
                  )}
                </div>

                {/* Files */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/35">
                    <FileText size={13} /> Files
                  </h3>
                  {files.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {files.map((file, fi) => {
                        const meta = getFileMeta(file.contentType, file.name);
                        const Icon = meta.icon;
                        const selected = selectedFilePaths.includes(String(file.path || ""));
                        return (
                          <motion.div
                            key={file.path || file.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: fi * 0.03 }}
                            className={`group relative overflow-hidden rounded-2xl border transition-all ${
                              selected ? "border-[#E5D5B8]/50 bg-[#E5D5B8]/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleFileSelection(file.path)}
                              className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all ${
                                selected
                                  ? "border-[#E5D5B8] bg-[#E5D5B8] text-black"
                                  : "border-white/25 bg-black/40 text-transparent opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:border-[#E5D5B8]/60"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </button>

                            {/* Thumbnail */}
                            <button
                              type="button"
                              onClick={() => {
                                if (selectionLockActive) return;
                                openPreview(file);
                              }}
                              disabled={selectionLockActive}
                              className="relative aspect-[16/10] w-full overflow-hidden bg-[#0A0A0A] disabled:cursor-not-allowed"
                            >
                              {(isPreviewImage(file) || isPreviewVideo(file)) ? (
                                <Thumbnail file={file} getFileThumbnail={getFileThumbnail} />
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.badge}`}>
                                    <Icon size={24} className={meta.accent} />
                                  </div>
                                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">{meta.label}</span>
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                  <Eye size={18} className="text-white" />
                                </div>
                              </div>
                            </button>

                            {/* Info */}
                            <div className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.badge}`}>
                                  <Icon size={12} className={meta.accent} />
                                </div>
                                <p className="min-w-0 truncate text-sm font-medium">{file.name || "File"}</p>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-white/35">{formatFileSize(file.size)}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectionLockActive) return;
                                      openPreview(file);
                                    }}
                                    disabled={selectionLockActive}
                                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectionLockActive) return;
                                      downloadFile(file.path);
                                    }}
                                    disabled={selectionLockActive}
                                    className="rounded-lg bg-[#E5D5B8]/15 px-2.5 py-1 text-[11px] font-medium text-[#E5D5B8] transition-all hover:bg-[#E5D5B8]/25 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center text-sm text-white/30">
                      No files found in this location.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Floating Selection Bar */}
          <AnimatePresence>
            {selectedFilePaths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/15 bg-[#111]/95 px-5 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                <span className="text-sm text-white/60">{selectedFilePaths.length} selected</span>
                <Button
                  onClick={downloadSelectedFiles}
                  disabled={bulkDownloading}
                  className="h-9 rounded-xl bg-[#E5D5B8] px-4 text-sm font-semibold text-black hover:bg-[#dcb98a]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {bulkDownloading ? "Downloading…" : "Download All"}
                </Button>
                <button
                  onClick={() => setSelectedFilePaths([])}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </>
        )}

      <AnimatePresence>
        {(previewFile || previewLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0A0A0A] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {previewFile && (() => {
                    const m = getFileMeta(previewFile.contentType, previewFile.name);
                    return (
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.badge}`}>
                        <m.icon size={14} className={m.accent} />
                      </div>
                    );
                  })()}
                  <h3 className="truncate text-sm font-medium">{previewFile?.name || "Loading preview…"}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {previewFile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectionLockActive) return;
                        downloadFile(files.find((f) => f.name === previewFile.name)?.path);
                      }}
                      disabled={selectionLockActive}
                      className="flex items-center gap-1.5 rounded-lg bg-[#E5D5B8]/15 px-3 py-1.5 text-xs font-medium text-[#E5D5B8] transition-colors hover:bg-[#E5D5B8]/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={13} /> Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setPreviewFile(null); setPreviewLoading(false); }}
                    className="rounded-lg bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center p-4">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                    <p className="text-sm text-white/50">Opening preview…</p>
                  </div>
                ) : previewFile ? (
                  isPreviewImage(previewFile) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewFile.url} alt={previewFile.name} className="max-h-full max-w-full rounded-lg object-contain" />
                  ) : isPreviewVideo(previewFile) ? (
                    <video src={previewFile.url} controls className="max-h-full max-w-full rounded-lg" />
                  ) : isPreviewPdf(previewFile) ? (
                    <iframe src={previewFile.url} title={previewFile.name} className="h-full w-full rounded-lg bg-white" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                        <FileText size={28} className="text-white/30" />
                      </div>
                      <p className="text-sm text-white/50">Preview not available for this file type.</p>
                      <Button
                        onClick={() => {
                          if (selectionLockActive) return;
                          downloadFile(files.find((item) => item.name === previewFile.name)?.path);
                        }}
                        disabled={selectionLockActive}
                        className="h-10 rounded-xl bg-[#E5D5B8] px-5 text-sm font-semibold text-black hover:bg-[#dcb98a] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download File
                      </Button>
                    </div>
                  )
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
