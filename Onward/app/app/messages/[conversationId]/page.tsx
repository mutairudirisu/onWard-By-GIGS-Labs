"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PresenceAvatar } from "@/components/presence-avatar";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, TextInput } from "@/components/ui";
import { toastError } from "@/components/toast";
import {
  fetchDirectMessageInbox,
  fetchDirectMessages,
  directMessageMediaProblem,
  markDirectMessagesRead,
  sendDirectMessage,
  subscribeToDirectConversationPresence,
  subscribeToDirectMessages,
  type DirectMessage,
  type DirectMessageThread,
} from "@/lib/db";
import { Check, CircleCheck, FileText, Loader2, Mic, Plus, Send, Square, X } from "lucide-react";

const MAX_VOICE_SECONDS = 5 * 60;

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageAttachment({ message }: { message: DirectMessage }) {
  if (!message.mediaUrl || !message.mediaType) return null;
  if (message.mediaType === "image") {
    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block w-fit max-w-full overflow-hidden rounded-xl border border-line"
      >
        <Image
          src={message.mediaUrl}
          alt={message.mediaName || "Image attachment"}
          width={480}
          height={360}
          unoptimized
          className="h-auto max-h-72 w-auto max-w-full object-contain"
        />
      </a>
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        controls
        preload="metadata"
        src={message.mediaUrl}
        className="mt-2 max-h-72 max-w-full rounded-xl border border-line"
      >
        Your browser does not support video playback.
      </video>
    );
  }
  if (message.mediaType === "audio") {
    return (
      <audio
        controls
        preload="metadata"
        src={message.mediaUrl}
        className="mt-2 block h-10 max-w-full"
      >
        Your browser does not support audio playback.
      </audio>
    );
  }
  return (
    <a
      href={message.mediaUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-[10px] font-semibold text-lime-deep hover:bg-cream"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{message.mediaName || "Download attachment"}</span>
    </a>
  );
}

function mergeMessages(current: DirectMessage[], incoming: DirectMessage[]) {
  const unique = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) unique.set(message.id, message);
  return [...unique.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function reportReadStatusError(error: unknown) {
  toastError(
    error instanceof Error
      ? `Couldn't update read status: ${error.message}`
      : "Couldn't update read status.",
  );
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const mountedRef = useRef(true);

  const markMessagesRead = useCallback(async () => {
    if (!user) return;
    const readAt = await markDirectMessagesRead(conversationId);
    const readTime = Date.parse(readAt);
    setMessages((current) =>
      current.map((message) =>
        message.senderId !== user.id &&
        !message.readAt &&
        Date.parse(message.createdAt) <= readTime
          ? { ...message, readAt }
          : message,
      ),
    );
  }, [conversationId, user]);

  const loadMessages = useCallback(async () => {
    const [rows, inbox] = await Promise.all([
      fetchDirectMessages(conversationId),
      fetchDirectMessageInbox(),
    ]);
    setMessages((current) => mergeMessages(current, rows));
    setThread(inbox.find((item) => item.conversationId === conversationId) ?? null);
    if (user && rows.some((message) => message.senderId !== user.id && !message.readAt)) {
      void markMessagesRead().catch(reportReadStatusError);
    }
  }, [conversationId, markMessagesRead, user]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const unsubscribe = subscribeToDirectMessages(
      conversationId,
      (message) => {
        setMessages((current) => mergeMessages(current, [message]));
        if (message.senderId !== user.id && !message.readAt) {
          void markMessagesRead().catch(reportReadStatusError);
        }
      },
      () => {
        void loadMessages().catch((loadError: unknown) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : "Couldn't load messages.");
          }
        });
      },
      (subscribeError) => {
        if (!cancelled) {
          toastError(
            subscribeError instanceof Error
              ? `Couldn't load message attachment: ${subscribeError.message}`
              : "Realtime messaging disconnected. Check your connection.",
          );
        }
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
  }, [conversationId, loadMessages, markMessagesRead, ready, user]);

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
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardRecordingRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setRecordingSeconds(seconds);
      if (seconds >= MAX_VOICE_SECONDS && recorderRef.current?.state === "recording") {
        toastError("Voice messages can be up to 5 minutes.");
        recorderRef.current.stop();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function startVoiceRecording() {
    if (!thread || sending || attachmentFile) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toastError("Voice recording is not supported by this browser.");
      return;
    }

    recordingChunksRef.current = [];
    discardRecordingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recordingChunksRef.current = [];
        if (mountedRef.current) {
          setRecording(false);
          toastError("Recording failed. Check microphone access and try again.");
        }
      };
      recorder.onstop = () => {
        recorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        if (!mountedRef.current) return;
        setRecording(false);
        if (discardRecordingRef.current) return;
        const rawType = recorder.mimeType || mimeType || "audio/webm";
        const type = rawType.split(";")[0].toLowerCase();
        const blob = new Blob(chunks, { type });
        if (!blob.size) {
          toastError("The voice recording is empty. Try again.");
          return;
        }
        const extension =
          type === "audio/mp4"
            ? "m4a"
            : type === "audio/ogg"
              ? "ogg"
              : type === "audio/mpeg"
                ? "mp3"
                : type === "audio/wav" || type === "audio/x-wav"
                  ? "wav"
                : "webm";
        const file = new File([blob], `voice-message-${Date.now()}.${extension}`, { type });
        const problem = directMessageMediaProblem(file);
        if (problem) {
          toastError(problem);
          return;
        }
        setAttachmentFile(file);
      };
      recorder.start(250);
      setRecordingSeconds(0);
      setRecording(true);
    } catch (recordingError) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const message =
        recordingError instanceof DOMException &&
        (recordingError.name === "NotAllowedError" || recordingError.name === "SecurityError")
          ? "Allow microphone access in your browser settings to record a voice message."
          : recordingError instanceof DOMException && recordingError.name === "NotFoundError"
            ? "No microphone was found on this device."
            : recordingError instanceof Error
              ? recordingError.message
              : "Couldn't start recording.";
      toastError(message);
    }
  }

  function stopVoiceRecording(discard = false) {
    discardRecordingRef.current = discard;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !attachmentFile) || sending || recording || !user) return;
    setSending(true);
    try {
      const message = await sendDirectMessage(conversationId, body, attachmentFile);
      setMessages((current) => mergeMessages(current, [message]));
      setDraft("");
      setAttachmentFile(null);
    } catch (sendError) {
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

        <section className="-mx-5 flex min-h-0 flex-1 flex-col md:mx-0">
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
                      {mine ? (
                        <span
                          aria-label={message.readAt ? "Read" : "Delivered"}
                          title={message.readAt ? "Read" : "Delivered"}
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            message.readAt ? "bg-lime-deep text-dark" : "text-muted"
                          }`}
                        >
                          {message.readAt ? (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          ) : (
                            <CircleCheck className="h-3.5 w-3.5" />
                          )}
                        </span>
                      ) : null}
                      </header>
                      {message.body ? (
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.5] text-ink">
                          {message.body}
                        </p>
                      ) : null}
                      <MessageAttachment message={message} />
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
            className="fixed inset-x-0 bottom-7 z-50 mx-auto flex w-full max-w-[400px] shrink-0 flex-wrap items-center gap-2 bg-page px-4 py-3 shadow-lift md:relative md:inset-auto md:bottom-auto md:z-auto md:w-auto md:max-w-none md:bg-transparent md:shadow-none"
          >
            <input
              ref={mediaInputRef}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime,audio/webm,audio/mp4,audio/ogg,audio/mpeg,audio/wav,audio/x-wav,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                const problem = directMessageMediaProblem(file);
                if (problem) {
                  toastError(problem);
                  return;
                }
                setAttachmentFile(file);
              }}
            />
            {attachmentFile ? (
              <div className="flex basis-full items-center gap-2 rounded-xl bg-paper px-3 py-2 text-[10px] text-inksoft">
                <FileText className="h-4 w-4 shrink-0 text-lime-deep" />
                <span className="min-w-0 flex-1 truncate">{attachmentFile.name}</span>
                <span className="shrink-0 text-muted">{formatFileSize(attachmentFile.size)}</span>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  disabled={sending}
                  onClick={() => setAttachmentFile(null)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {recording ? (
              <div className="flex basis-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                <span className="flex-1 font-semibold">
                  Recording {formatDuration(recordingSeconds)} / 05:00
                </span>
                <button
                  type="button"
                  onClick={() => stopVoiceRecording(true)}
                  aria-label="Discard voice recording"
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => stopVoiceRecording()}
                  aria-label="Finish voice recording"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              disabled={!thread || sending || recording || Boolean(attachmentFile)}
              onClick={() => mediaInputRef.current?.click()}
              aria-label="Attach media or file"
              title="Attach media or file"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:bg-cream disabled:opacity-50"
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
            {draft.trim() || attachmentFile ? (
              <button
                type="submit"
                aria-label="Send message"
                disabled={sending || !thread || recording}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                disabled={!thread || sending || recording || Boolean(attachmentFile)}
                onClick={() => void startVoiceRecording()}
                aria-label="Record voice message"
                title="Record voice message"
                className="flex h-11 w-10 shrink-0 items-center justify-center text-muted transition hover:text-ink disabled:opacity-50"
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
