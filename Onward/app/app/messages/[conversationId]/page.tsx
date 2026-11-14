"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, TextInput } from "@/components/ui";
import { toastError } from "@/components/toast";
import {
  fetchDirectMessageInbox,
  fetchDirectMessages,
  sendDirectMessage,
  subscribeToDirectMessages,
  type DirectMessage,
  type DirectMessageThread,
} from "@/lib/db";
import { Loader2, Send } from "lucide-react";

function mergeMessages(current: DirectMessage[], incoming: DirectMessage[]) {
  const unique = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) unique.set(message.id, message);
  return [...unique.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default function DirectMessagePage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const { user, ready } = useAuth();
  const [thread, setThread] = useState<DirectMessageThread | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const [rows, inbox] = await Promise.all([
      fetchDirectMessages(conversationId),
      fetchDirectMessageInbox(),
    ]);
    setMessages((current) => mergeMessages(current, rows));
    setThread(inbox.find((item) => item.conversationId === conversationId) ?? null);
  }, [conversationId]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const unsubscribe = subscribeToDirectMessages(
      conversationId,
      (message) => {
        setMessages((current) => mergeMessages(current, [message]));
      },
      () => {
        void loadMessages().catch((loadError: unknown) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : "Couldn't load messages.");
          }
        });
      },
      () => {
        if (!cancelled) toastError("Realtime messaging disconnected. Check your connection.");
      },
    );
    void loadMessages()
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Couldn't load messages.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [conversationId, loadMessages, ready, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending || !user) return;
    setSending(true);
    setDraft("");
    try {
      const message = await sendDirectMessage(conversationId, body);
      setMessages((current) => mergeMessages(current, [message]));
    } catch (sendError) {
      setDraft(body);
      toastError(sendError instanceof Error ? sendError.message : "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  }

  if (!ready || !user) {
    return (
      <PhoneShell tab="network">
        <div className="card px-4 py-8 text-center text-[11px] text-muted">Sign in to message people.</div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="network">
      <div className="mb-4 flex items-center gap-2">
        <BackLink href="/messages" label="Back to messages" />
        {thread ? (
          <Link href={`/people/${thread.person.id}`} className="flex min-w-0 items-center gap-2">
            <Avatar initials={thread.person.initials} src={thread.person.avatarUrl} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-bold text-ink">
                {thread.person.name || "onWard member"}
              </span>
              {thread.person.role ? (
                <span className="block truncate text-[9px] text-muted">{thread.person.role}</span>
              ) : null}
            </span>
          </Link>
        ) : (
          <h1 className="text-[15px] font-bold text-ink">Conversation</h1>
        )}
      </div>

      <section className="flex min-h-[65vh] flex-col overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="wheel flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[10px] text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </div>
          ) : error ? (
            <div className="py-8 text-center text-[10px] text-red-700">{error}</div>
          ) : !thread ? (
            <div className="py-8 text-center text-[10px] text-muted">
              This conversation is unavailable.
            </div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine = message.senderId === user.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <article
                    className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                      mine ? "rounded-br-sm bg-lime text-dark" : "rounded-bl-sm bg-cream text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.5]">
                      {message.body}
                    </p>
                    <time className={`mt-1 block text-right text-[8px] ${mine ? "text-dark/65" : "text-muted"}`}>
                      {new Date(message.createdAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </article>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center">
              <p className="text-[11px] font-semibold text-ink">Start the conversation</p>
              <p className="mt-1 text-[9px] text-muted">Your messages are delivered in real time.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-line p-3">
          <TextInput
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message…"
            aria-label="Write a message"
            maxLength={5000}
            disabled={!thread || sending}
            className="min-w-0 flex-1 rounded-full"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim() || sending || !thread}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </section>
    </PhoneShell>
  );
}
