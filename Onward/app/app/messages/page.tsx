"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Modal } from "@/components/modal";
import { PresenceAvatar } from "@/components/presence-avatar";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { toastError } from "@/components/toast";
import {
  fetchDirectMessageInbox,
  subscribeToDirectConversationPresence,
  type DirectMessageThread,
} from "@/lib/db";
import {
  CalendarDays,
  Loader2,
  ListChecks,
  MessageCircle,
  MoreVertical,
  PencilLine,
  Search,
  Settings2,
} from "lucide-react";

export default function MessagesPage() {
  const { user, ready } = useAuth();
  const [threads, setThreads] = useState<DirectMessageThread[]>([]);
  const [onlineByConversation, setOnlineByConversation] = useState<Record<string, boolean | null>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoading(true);
    void fetchDirectMessageInbox()
      .then((rows) => {
        if (!cancelled) setThreads(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toastError(error instanceof Error ? error.message : "Couldn't load your messages.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const userId = user?.id;
  useEffect(() => {
    if (!ready || !userId || !threads.length) return;
    let active = true;
    const unsubscribe = threads.map((thread) =>
      subscribeToDirectConversationPresence(
        thread.conversationId,
        userId,
        (online) => {
          if (active) {
            setOnlineByConversation((current) => ({
              ...current,
              [thread.conversationId]: online,
            }));
          }
        },
        () => {
          if (active) {
            setOnlineByConversation((current) => ({
              ...current,
              [thread.conversationId]: null,
            }));
          }
        },
      ),
    );
    return () => {
      active = false;
      unsubscribe.forEach((stop) => stop());
    };
  }, [ready, threads, userId]);

  const visibleThreads = threads.filter((thread) =>
    thread.person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!ready || !user) {
    return (
      <PhoneShell>
        <div className="card px-4 py-8 text-center text-[11px] text-muted">
          Sign in to view your messages.
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href="/network" label="Back to My Network" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Messages</h1>
        </div>
        <button
          type="button"
          aria-label="Message settings"
          aria-haspopup="dialog"
          onClick={() => setSettingsOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:bg-cream"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-line bg-paper px-3 text-muted focus-within:border-lime-deep">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <section id="conversation-list" className="-mx-5 md:mx-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 border-b border-line px-5 py-8 text-[10px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
          </div>
        ) : visibleThreads.length ? (
          visibleThreads.map((thread, index) => (
            <div
              key={thread.conversationId}
              className="flex items-center gap-3 pl-3 transition hover:bg-paper/50"
            >
              <Link
                href={`/people/${thread.person.id}`}
                aria-label={`View ${thread.person.name}'s profile`}
                className="shrink-0"
              >
                <PresenceAvatar
                  initials={thread.person.initials}
                  src={thread.person.avatarUrl}
                  online={onlineByConversation[thread.conversationId] ?? null}
                />
              </Link>
              <Link
                href={`/messages/${thread.conversationId}`}
                className={`flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pr-4 ${
                  index < visibleThreads.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">
                      {thread.person.name || "onWard member"}
                    </span>
                    <span className="shrink-0 text-[9px] text-muted">
                      {new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-muted">
                    {thread.lastMessage}
                  </span>
                </span>
              </Link>
            </div>
          ))
        ) : (
          <div className="border-y border-line px-5 py-10 text-center">
            <MessageCircle className="mx-auto h-5 w-5 text-lime-deep" />
            <p className="mt-2 text-[11px] font-semibold text-ink">
              {query ? "No conversations found" : "No messages yet"}
            </p>
            <p className="mt-1 text-[9px] text-muted">
              Start a conversation from someone’s profile or Catch up.
            </p>
            <Link href="/network" className="mt-3 inline-block text-[9px] font-semibold text-lime-deep">
              Find people
            </Link>
          </div>
        )}
      </section>

      <Link
        href="/network"
        aria-label="Start a new conversation"
        title="Start a new conversation"
        className="fixed bottom-7 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-lime-deep text-dark shadow-lift transition hover:brightness-95 md:right-8"
      >
        <PencilLine className="h-6 w-6" />
      </Link>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Message settings">
        <div className="-mx-5 divide-y divide-line">
          <Link
            href="#conversation-list"
            onClick={() => setSettingsOpen(false)}
            className="flex items-center gap-4 px-5 py-4 text-[14px] font-medium text-ink hover:bg-cream"
          >
            <ListChecks className="h-6 w-6 text-muted" />
            Manage conversations
          </Link>
          <div
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-4 px-5 py-4 text-[14px] font-medium text-muted"
          >
            <CalendarDays className="h-6 w-6" />
            <span>
              <span className="block">Set away message</span>
              <span className="mt-0.5 block text-[11px]">Unlock with Premium</span>
            </span>
          </div>
          <Link
            href="/settings"
            onClick={() => setSettingsOpen(false)}
            className="flex items-center gap-4 px-5 py-4 text-[14px] font-medium text-ink hover:bg-cream"
          >
            <Settings2 className="h-6 w-6 text-muted" />
            Manage settings
          </Link>
        </div>
      </Modal>
    </PhoneShell>
  );
}
