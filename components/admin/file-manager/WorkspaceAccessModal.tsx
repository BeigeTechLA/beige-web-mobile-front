"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Search, Trash2, UserRoundPlus, X } from "lucide-react";

interface WorkspaceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "registered-client" | "email";
  resource: {
    externalId: string;
    label: string;
  } | null;
}

type AccessItem = {
  accessId: number;
  userId?: number | null;
  clientId?: number | null;
  name?: string | null;
  email?: string | null;
  pending?: boolean;
  emailSent?: boolean;
  emailError?: string | null;
  createdAt?: string;
};

type OwnerItem = {
  userId?: number | null;
  clientId?: number | null;
  name?: string | null;
  email?: string | null;
  projectName?: string | null;
};

type RegisteredClientItem = {
  clientId: number;
  userId: number;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());

export default function WorkspaceAccessModal({ isOpen, onClose, mode = "registered-client", resource }: WorkspaceAccessModalProps) {
  const { isDark } = useResolvedTheme();
  const emailMode = mode === "email";
  const clientDropdownRef = useRef<HTMLDivElement | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [email, setEmail] = useState("");
  const [clients, setClients] = useState<RegisteredClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<RegisteredClientItem | null>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [owner, setOwner] = useState<OwnerItem | null>(null);
  const [access, setAccess] = useState<AccessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const title = resource?.label || "Workspace";

  const loadAccess = async () => {
    if (!resource?.externalId) return;
    try {
      setLoading(true);
      const result = await fileManagerApi.listWorkspaceAccess(resource.externalId);
      setOwner(result?.owner || null);
      setAccess(result?.access || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load dashboard access"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && resource?.externalId) {
      setClientSearch("");
      setEmail("");
      setSelectedClient(null);
      setClientDropdownOpen(false);
      void loadAccess();
    }
  }, [isOpen, resource?.externalId]);

  useEffect(() => {
    if (!isOpen || emailMode) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setClientsLoading(true);
        const rows = await fileManagerApi.searchRegisteredClients(clientSearch.trim());
        if (!cancelled) setClients(rows || []);
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error, "Failed to load registered clients"));
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [clientSearch, emailMode, isOpen]);

  useEffect(() => {
    if (!clientDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (clientDropdownRef.current?.contains(target)) return;
      setClientDropdownOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [clientDropdownOpen]);

  const blockedUserIds = useMemo(() => {
    const ids = new Set(access.map((item) => Number(item.userId)).filter(Boolean));
    if (owner?.userId) ids.add(Number(owner.userId));
    return ids;
  }, [access, owner?.userId]);

  const handleGrant = async () => {
    if (!resource?.externalId) return;
    if (emailMode) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        toast.error("Enter a valid email address");
        return;
      }
      if (access.some((item) => item.email?.toLowerCase() === normalizedEmail)) {
        toast.info("This email already has access");
        return;
      }

      try {
        setSaving(true);
        const result = await fileManagerApi.grantWorkspaceAccess({
          externalId: resource.externalId,
          email: normalizedEmail,
        });
        toast.success(result?.data?.pending ? "Invite sent. Access will appear after signup." : "Dashboard access granted");
        if (result?.data?.emailError) {
          toast.info("Access was saved, but the invite email could not be sent");
        }
        setEmail("");
        await loadAccess();
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to grant dashboard access"));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!selectedClient) {
      toast.error("Select a registered client first");
      return;
    }
    if (blockedUserIds.has(Number(selectedClient.userId))) {
      toast.info("This client already has access");
      return;
    }

    try {
      setSaving(true);
      await fileManagerApi.grantWorkspaceAccess({
        externalId: resource.externalId,
        clientId: selectedClient.clientId,
      });
      toast.success("Dashboard access granted");
      setClientSearch("");
      setSelectedClient(null);
      setClientDropdownOpen(false);
      await loadAccess();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to grant dashboard access"));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (accessId: number) => {
    try {
      setRemovingId(accessId);
      await fileManagerApi.revokeWorkspaceAccess(accessId);
      toast.success("Dashboard access removed");
      await loadAccess();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove dashboard access"));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`w-[94vw] max-w-[620px] rounded-2xl border p-0 shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden ${isDark ? "border-white/15 bg-black text-white" : "border-[#D7D7D7] bg-white text-black"}`}>
        <DialogTitle className="sr-only">Dashboard Access</DialogTitle>

        <div className={`flex items-start justify-between gap-4 border-b p-5 ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">
              Dashboard Access <span className="text-[#E8D1AB]">({title})</span>
            </h2>
            <p className={`mt-2 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
              {emailMode
                ? "Invite people by email to view this folder in their client dashboard."
                : "Give logged-in clients access without changing the booking owner."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-white/10 text-white/70 hover:text-white" : "bg-black/5 text-black/60 hover:text-black"}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {owner && !emailMode ? (
            <div className={`rounded-lg border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#D7D7D7] bg-[#FAFAFA]"}`}>
              <p className={`text-xs font-bold uppercase ${isDark ? "text-white/40" : "text-black/40"}`}>Owner</p>
              <p className="mt-2 text-sm font-semibold">{owner.name || owner.email || "Unassigned booking owner"}</p>
              <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                {owner.clientId ? `Client #${owner.clientId}` : owner.userId ? `User #${owner.userId}` : "Guest booking"}
                {owner.email ? ` - ${owner.email}` : ""}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {emailMode ? (
              <div className="flex-1">
                <fieldset className={`rounded-lg border px-4 pb-2.5 pt-1 ${isDark ? "border-white/25 focus-within:border-[#E8D1AB]" : "border-[#D7D7D7] focus-within:border-[#E8D1AB]"}`}>
                  <legend className={`px-1 text-xs font-medium ${isDark ? "text-white/55" : "text-black/55"}`}>
                    Email Address
                  </legend>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/35"}`}
                  />
                </fieldset>
                <p className="mt-2 text-xs leading-relaxed text-[#E8D1AB]">
                  <span className="font-bold">Note:-</span>{" "}
                  To view this folder in their dashboard, the recipient must log in or sign up with the same email address.
                </p>
              </div>
            ) : (
            <div ref={clientDropdownRef} className="relative flex-1">
              <fieldset className={`rounded-lg border px-4 pb-2.5 pt-1 ${isDark ? "border-white/25 focus-within:border-[#E8D1AB]" : "border-[#D7D7D7] focus-within:border-[#E8D1AB]"}`}>
                <legend className={`px-1 text-xs font-medium ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Registered Client
                </legend>
                <div className="flex items-center gap-2">
                  <Search size={16} className={isDark ? "text-white/35" : "text-black/35"} />
                  <input
                    value={selectedClient ? `${selectedClient.name || selectedClient.email} (#${selectedClient.clientId})` : clientSearch}
                    onChange={(event) => {
                      setSelectedClient(null);
                      setClientSearch(event.target.value);
                      setClientDropdownOpen(true);
                    }}
                    onFocus={() => setClientDropdownOpen(true)}
                    placeholder="Search registered clients..."
                    className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/35"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setClientDropdownOpen((prev) => !prev)}
                    className={isDark ? "text-white/45" : "text-black/45"}
                  >
                    <ChevronsUpDown size={16} />
                  </button>
                </div>
              </fieldset>

              {clientDropdownOpen ? (
                <div className={`absolute left-0 right-0 top-[62px] z-[60] max-h-[260px] overflow-y-auto rounded-lg border p-1 shadow-2xl ${isDark ? "border-white/15 bg-[#090909]" : "border-[#D7D7D7] bg-white"}`}>
                  {clientsLoading ? (
                    <div className={`flex items-center justify-center gap-2 px-3 py-5 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                      <Loader2 className="animate-spin" size={16} />
                      Searching clients...
                    </div>
                  ) : clients.length === 0 ? (
                    <div className={`px-3 py-5 text-center text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>
                      No registered clients found.
                    </div>
                  ) : (
                    clients.map((client) => {
                      const disabled = blockedUserIds.has(Number(client.userId));
                      return (
                        <button
                          key={`${client.clientId}-${client.userId}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedClient(client);
                            setClientDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                            isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {client.name || client.email || `Client #${client.clientId}`}
                            </span>
                            <span className={`block truncate text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                              Client #{client.clientId} - {client.email || "No email"}
                              {disabled ? " - Already added" : ""}
                            </span>
                          </span>
                          {selectedClient?.clientId === client.clientId ? (
                            <Check size={16} className="shrink-0 text-[#E8D1AB]" />
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : null}
            </div>
            )}
            <Button
              type="button"
              onClick={handleGrant}
              disabled={saving || (emailMode ? !email.trim() : !selectedClient || blockedUserIds.has(Number(selectedClient.userId)))}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] px-5 text-sm font-bold text-black hover:bg-[#dcb98a] disabled:opacity-40"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <UserRoundPlus size={16} />}
              {emailMode ? "Invite" : "Grant"}
            </Button>
          </div>

          <div>
            <p className={`mb-3 text-sm font-bold ${isDark ? "text-white/85" : "text-black/85"}`}>{emailMode ? "Shared With" : "Other Clients"}</p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#E8D1AB]" size={24} />
              </div>
            ) : access.length === 0 ? (
              <div className={`rounded-lg border py-8 text-center text-sm ${isDark ? "border-white/10 text-white/35" : "border-[#D7D7D7] text-black/35"}`}>
                No extra client access yet.
              </div>
            ) : (
              <div className={`max-h-[240px] space-y-2 overflow-y-auto pr-1 ${isDark ? "[&::-webkit-scrollbar-thumb]:bg-white/10" : "[&::-webkit-scrollbar-thumb]:bg-black/10"}`}>
                {access.map((item) => (
                    <div key={item.accessId} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${isDark ? "border-white/10 bg-white/[0.02]" : "border-[#D7D7D7] bg-[#FAFAFA]"}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name || item.email || (item.userId ? `User #${item.userId}` : "Pending invite")}</p>
                        <p className={`mt-1 truncate text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                          {item.pending ? "Pending signup" : item.clientId ? `Client #${item.clientId}` : item.userId ? `User #${item.userId}` : "Email invite"}
                          {item.email ? ` - ${item.email}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(item.accessId)}
                        disabled={removingId === item.accessId}
                        className="rounded-md p-2 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                        title="Remove access"
                      >
                        {removingId === item.accessId ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
