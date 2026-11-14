"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PresenceAvatar } from "@/components/presence-avatar";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, TextInput } from "@/components/ui";
import { toastError } from "@/components/toast";
import {
  fetchDirectMessageInbox,
  fetchDirectMessages,
  sendDirectMessage,
  subscribeToDirectConversationPresence,
  subscribeToDirectMessages,
  type DirectMessage,
  type DirectMessageThread,
} from "@/lib/db";
import { Loader2, Mic, Plus, Send } from "lucide-react";

function mergeMessages(current: DirectMessage[], incoming: DirectMessage[]) {
  const unique = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) unique.set(message.id, message);
  return [...unique.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export default function DirectMessagePage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const { user, profile, ready } = useAuth();
  const [thread, setThread] = useState<DirectMessageThread | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [otherOnline, setOtherOnline] = useState<boolean | null>(null);
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
    if (!ready || !user) return;
    setOtherOnline(null);
    return subscribeToDirectConversationPresence(
      conversationId,
      user.id,
      setOtherOnline,
      () => setOtherOnline(null),
    );
  }, [conversationId, ready, user]);

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
      <PhoneShell>
        <div className="card px-4 py-8 text-center text-[11px] text-muted">Sign in to message people.</div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="flex h-[calc(100dvh-5.25rem)] flex-col md:h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-5.5rem)] xl:h-[calc(100dvh-6.5rem)]">
        <div className="mb-4 flex shrink-0 items-center gap-2">
          <BackLink href="/messages" label="Back to messages" />
          {thread ? (
            <Link
              href={`/people/${thread.person.id}`}
              className="flex min-w-0 items-center gap-2 no-underline hover:no-underline focus:no-underline active:no-underline"
            >
              <PresenceAvatar
                initials={thread.person.initials}
                src={thread.person.avatarUrl}
                online={otherOnline}
              />
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-bold text-ink">
                  {thread.person.name || "onWard member"}
                </span>
                {thread.person.role ? (
                  <span
                    title={thread.person.role}
                    className="block max-w-[60vw] truncate text-[10px] text-muted md:max-w-[400px]"
                  >
                    {thread.person.role}
                  </span>
                ) : null}
              </span>
            </Link>
          ) : (
            <h1 className="text-[15px] font-bold text-ink">Conversation</h1>
          )}
        </div>

        <section className="-mx-5 flex min-h-0 flex-1 flex-col border-y border-line md:mx-0">
          <div className="wheel min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 pb-28 md:pb-4">
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
                  <article key={message.id} className="flex items-start gap-3 py-2">
                    <Link
                      href={mine ? "/profile" : `/people/${thread.person.id}`}
                      aria-label={`View ${mine ? "your" : thread.person.name + "'s"} profile`}
                      className="shrink-0"
                    >
                      {mine ? (
                        <Avatar
                          initials={profile?.initials ?? ""}
                          src={profile?.avatarUrl}
                          size="lg"
                        />
                      ) : (
                        <Avatar
                          initials={thread.person.initials}
                          src={thread.person.avatarUrl}
                          size="lg"
                        />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <header className="mb-1 flex min-w-0 items-center gap-2">
                      <Link
                        href={mine ? "/profile" : `/people/${thread.person.id}`}
                        className="truncate text-[12px] font-semibold text-ink no-underline hover:no-underline"
                      >
                        {mine ? profile?.displayName || "You" : thread.person.name || "onWard member"}
                      </Link>
                      <span aria-hidden="true" className="text-[10px] text-muted">
                        ·
                      </span>
                      <time className="shrink-0 text-[10px] text-muted">
                        {new Date(message.createdAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                      </header>
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.5] text-ink">
                        {message.body}
                      </p>
                    </div>
                  </article>
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
          <form
            onSubmit={submit}
            className="fixed inset-x-0 bottom-7 z-50 mx-auto flex w-full max-w-[400px] shrink-0 items-center gap-2 border-t border-line bg-page px-4 py-3 shadow-lift md:relative md:inset-auto md:bottom-auto md:z-auto md:w-auto md:max-w-none md:bg-transparent md:shadow-none"
          >
            <button
              type="button"
              disabled
              aria-label="Attachments are not available yet"
              title="Attachments are not available yet"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted disabled:opacity-70"
            >
              <Plus className="h-6 w-6" />
            </button>
            <TextInput
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message…"
              aria-label="Write a message"
              maxLength={5000}
              disabled={!thread || sending}
              className="h-12 min-w-0 flex-1 rounded-2xl border-0 bg-line px-4 text-[12px] focus:border-0 focus:ring-0"
            />
            {draft.trim() ? (
              <button
                type="submit"
                aria-label="Send message"
                disabled={sending || !thread}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Voice messages are not available yet"
                title="Voice messages are not available yet"
                className="flex h-11 w-10 shrink-0 items-center justify-center text-muted disabled:opacity-70"
              >
                <Mic className="h-6 w-6" />
              </button>
            )}
          </form>
        </section>
      </div>
    </PhoneShell>
  );
}
