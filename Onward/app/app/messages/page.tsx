"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { toastError } from "@/components/toast";
import { fetchDirectMessageInbox, type DirectMessageThread } from "@/lib/db";
import { Loader2, MessageCircle, Search } from "lucide-react";

export default function MessagesPage() {
  const { user, ready } = useAuth();
  const [threads, setThreads] = useState<DirectMessageThread[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

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

  const visibleThreads = threads.filter((thread) =>
    thread.person.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (!ready || !user) {
    return (
      <PhoneShell tab="network">
        <div className="card px-4 py-8 text-center text-[11px] text-muted">
          Sign in to view your messages.
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="network">
      <div className="mb-5 flex items-center gap-1">
        <BackLink href="/network" label="Back to My Network" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Messages</h1>
      </div>

      <label className="mb-4 flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-3 text-muted focus-within:border-lime-deep">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-muted"
        />
      </label>

      <section className="-mx-5 md:mx-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 border-b border-line px-5 py-8 text-[10px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
          </div>
        ) : visibleThreads.length ? (
          visibleThreads.map((thread) => (
            <Link
              key={thread.conversationId}
              href={`/messages/${thread.conversationId}`}
              className="flex items-center gap-3 border-b border-line px-6 py-3.5 last:border-b-0 transition hover:bg-paper/50"
            >
              <Avatar initials={thread.person.initials} src={thread.person.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold text-ink">
                    {thread.person.name || "onWard member"}
                  </span>
                  <span className="shrink-0 text-[8px] text-faint">
                    {new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <span className="mt-1 block truncate text-[9px] text-muted">{thread.lastMessage}</span>
              </span>
            </Link>
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
    </PhoneShell>
  );
}
