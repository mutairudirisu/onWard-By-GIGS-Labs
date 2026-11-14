"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button } from "@/components/ui";
import { toastError, toastSuccess } from "@/components/toast";
import {
  fetchNetworkRequests,
  respondToConnectionRequest,
  type NetworkRequest,
} from "@/lib/db";
import { Check, Loader2, Share2, X } from "lucide-react";

export default function NetworkInvitationsPage() {
  const { user, ready } = useAuth();
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRequests(await fetchNetworkRequests());
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't load invitations.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready) void loadRequests();
  }, [loadRequests, ready]);

  async function respond(request: NetworkRequest, accept: boolean) {
    if (busyIds.has(request.requestId)) return;
    setBusyIds((ids) => new Set(ids).add(request.requestId));
    try {
      await respondToConnectionRequest(request.requestId, accept);
      setRequests((current) => current.filter((entry) => entry.requestId !== request.requestId));
      toastSuccess(accept ? "You’re now connected." : "Invitation declined.");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't update the invitation.");
    } finally {
      setBusyIds((ids) => {
        const next = new Set(ids);
        next.delete(request.requestId);
        return next;
      });
    }
  }

  async function shareInvite() {
    const url = `${window.location.origin}/network`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join me on onWard", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toastSuccess("Invite link copied.");
      } else {
        throw new Error("Sharing is not available in this browser.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toastError(error instanceof Error ? error.message : "Couldn't share the invite link.");
    }
  }

  if (!ready || !user) {
    return (
      <PhoneShell tab="network">
        <div className="card px-4 py-8 text-center">
          <p className="text-[11px] text-muted">Sign in to manage connection invitations.</p>
          <Link href="/sign-in" className="mt-3 inline-block text-[11px] font-semibold text-lime-deep">
            Sign in
          </Link>
        </div>
      </PhoneShell>
    );
  }

  const incoming = requests.filter((request) => request.direction === "incoming");
  const outgoing = requests.filter((request) => request.direction === "outgoing");

  return (
    <PhoneShell tab="network">
      <div className="mb-5 flex items-center gap-1">
        <BackLink href="/network" label="Back to My Network" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Invitations</h1>
      </div>

      <section className="mb-5 rounded-2xl border border-line bg-paper p-4">
        <h2 className="text-[12px] font-bold text-ink">Invite someone to onWard</h2>
        <p className="mt-1 text-[10px] leading-[1.5] text-muted">
          Share your network page with a colleague, classmate or friend.
        </p>
        <Button
          className="mt-3"
          onClick={() => void shareInvite()}
          iconLeft={<Share2 className="h-4 w-4" />}
        >
          Share invite link
        </Button>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[10px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading invitations…
        </div>
      ) : (
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-[12px] font-bold text-ink">Received ({incoming.length})</h2>
            </header>
            {incoming.length ? incoming.map((request) => (
              <article key={request.requestId} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <Link href={`/people/${request.person.id}`}>
                  <Avatar initials={request.person.initials} src={request.person.avatarUrl} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/people/${request.person.id}`} className="block truncate text-[11px] font-bold text-ink hover:underline">
                    {request.person.name || "onWard member"}
                  </Link>
                  <p className="truncate text-[9px] text-muted">{request.person.role || "Connection request"}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Accept ${request.person.name}'s invitation`}
                  disabled={busyIds.has(request.requestId)}
                  onClick={() => void respond(request, true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-dark disabled:opacity-60"
                >
                  {busyIds.has(request.requestId) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  aria-label={`Decline ${request.person.name}'s invitation`}
                  disabled={busyIds.has(request.requestId)}
                  onClick={() => void respond(request, false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </article>
            )) : (
              <p className="px-4 py-5 text-center text-[10px] text-muted">You have no received invitations.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <header className="border-b border-line px-4 py-3">
              <h2 className="text-[12px] font-bold text-ink">Sent ({outgoing.length})</h2>
            </header>
            {outgoing.length ? outgoing.map((request) => (
              <article key={request.requestId} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <Link href={`/people/${request.person.id}`}>
                  <Avatar initials={request.person.initials} src={request.person.avatarUrl} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/people/${request.person.id}`} className="block truncate text-[11px] font-bold text-ink hover:underline">
                    {request.person.name || "onWard member"}
                  </Link>
                  <p className="truncate text-[9px] text-muted">{request.person.role || "Invitation pending"}</p>
                </div>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-semibold text-muted">Pending</span>
              </article>
            )) : (
              <p className="px-4 py-5 text-center text-[10px] text-muted">No pending invitations sent.</p>
            )}
          </section>
        </div>
      )}
    </PhoneShell>
  );
}
