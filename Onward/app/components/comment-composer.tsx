"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AtSign, ImagePlus, Loader2, Send, Smile, X } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError } from "@/components/toast";
import { POST_COMMENT_MAX, searchPeople, type ExchangePerson } from "@/lib/db";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="grid h-48 place-items-center text-[12px] font-medium text-muted">
      Loading emoji…
    </div>
  ),
});

const MAX_FILES = 4;
const MAX_FILE_BYTES = 26_214_400;

type ActiveMention = { start: number; end: number; query: string };

function activeMentionAt(value: string, cursor: number): ActiveMention | null {
  const beforeCursor = value.slice(0, cursor);
  const start = beforeCursor.lastIndexOf("@");
  if (start < 0 || (start > 0 && /[\w.+-]/.test(beforeCursor[start - 1]))) return null;
  const query = beforeCursor.slice(start + 1);
  if (/[\s@]/.test(query)) return null;
  return { start, end: cursor, query };
}

export function CommentComposer({
  value,
  onChange,
  files,
  onFilesChange,
  onSubmit,
  sending,
  className = "",
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: () => void;
  sending: boolean;
  className?: string;
  inputRef?: Ref<HTMLTextAreaElement>;
}) {
  const { user } = useAuth();
  const me = useCurrentUser();
  const photoInput = useRef<HTMLInputElement>(null);
  const gifInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mention, setMention] = useState<ActiveMention | null>(null);
  const [mentionPeople, setMentionPeople] = useState<ExchangePerson[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const closeEmojiPicker = useCallback(() => {
    setEmojiOpen(false);
    window.requestAnimationFrame(() => emojiButtonRef.current?.focus());
  }, []);
  const attachTextareaRef = useCallback(
    (field: HTMLTextAreaElement | null) => {
      textareaRef.current = field;
      if (typeof inputRef === "function") inputRef(field);
      else if (inputRef) inputRef.current = field;
    },
    [inputRef],
  );

  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(96, field.scrollHeight)}px`;
  }, [value]);

  useEffect(() => {
    if (!mention) {
      setMentionPeople([]);
      setMentionLoading(false);
      return;
    }

    let active = true;
    setMentionLoading(true);
    const timer = window.setTimeout(() => {
      void searchPeople(mention.query)
        .then((people) => {
          if (active) setMentionPeople(people);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setMentionPeople([]);
          toastError(error instanceof Error ? error.message : "Couldn't search people.");
        })
        .finally(() => {
          if (active) setMentionLoading(false);
        });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mention]);

  useEffect(() => {
    if (!emojiOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEmojiPicker();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeEmojiPicker, emojiOpen]);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length + picked.length > MAX_FILES) {
      toastError("Attach up to four images or GIFs.");
      return;
    }
    if (
      picked.some(
        (file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
      )
    ) {
      toastError("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (picked.some((file) => file.size > MAX_FILE_BYTES)) {
      toastError("Keep each image under 25MB.");
      return;
    }
    onFilesChange([...files, ...picked]);
  }

  function addEmoji(emoji: string) {
    if (value.length + emoji.length <= POST_COMMENT_MAX) {
      onChange(`${value}${emoji}`);
    }
  }

  function insertMentionTrigger() {
    const field = textareaRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? start;
    const nextValue = `${value.slice(0, start)}@${value.slice(end)}`;
    if (nextValue.length > POST_COMMENT_MAX) {
      toastError("Keep comments under 500 characters.");
      return;
    }
    onChange(nextValue);
    setMention({ start, end: start + 1, query: "" });
    window.requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + 1, start + 1);
    });
  }

  function chooseMention(person: ExchangePerson) {
    if (!mention) return;
    const field = textareaRef.current;
    const trailingText = value.slice(mention.end);
    const insertion = `@${person.name}${trailingText.startsWith(" ") ? "" : " "}`;
    const nextValue = `${value.slice(0, mention.start)}${insertion}${trailingText}`;
    if (nextValue.length > POST_COMMENT_MAX) {
      toastError("Keep comments under 500 characters.");
      return;
    }
    const cursor = mention.start + insertion.length;
    onChange(nextValue);
    setMention(null);
    window.requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(cursor, cursor);
    });
  }

  const canSend = Boolean(value.trim() || files.length) && !sending;

  return (
    <div className={className}>
      <div className="flex items-end gap-2.5">
        {user ? (
          <Link href={`/people/${user.id}`} aria-label="View your profile" className="shrink-0">
            <Avatar
              initials={me.initials || (me.name.slice(0, 1).toUpperCase() || "?")}
              src={me.avatarUrl}
            />
          </Link>
        ) : null}
        <div ref={composerRef} className="relative min-w-0 flex-1">
          {mention ? (
            <div
              role="listbox"
              aria-label="People to mention"
              className="absolute inset-x-0 bottom-full z-30 mb-2 max-h-[45dvh] overflow-y-auto rounded-2xl border border-line bg-paper p-1.5 shadow-lift"
            >
              {mentionLoading ? (
                <p className="px-3 py-2 text-[11px] text-muted">Finding people…</p>
              ) : mentionPeople.length ? (
                mentionPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => chooseMention(person)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-cream"
                  >
                    <Avatar initials={person.initials} src={person.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink">
                        {person.name}
                      </span>
                      {person.role ? (
                        <span className="block truncate text-[10px] text-muted">{person.role}</span>
                      ) : null}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-muted">No people found.</p>
              )}
            </div>
          ) : null}
          <div className="rounded-2xl md:border md:border-line md:bg-paper md:px-3.5 md:py-2 md:focus-within:border-dash">
            <div className="rounded-2xl border border-line bg-paper px-3.5 py-2 focus-within:border-dash md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0">
              <textarea
                ref={attachTextareaRef}
                value={value}
                rows={1}
                maxLength={POST_COMMENT_MAX}
                onChange={(event) => {
                  const field = event.currentTarget;
                  field.style.height = "auto";
                  field.style.height = `${Math.min(96, field.scrollHeight)}px`;
                  onChange(field.value);
                  setMention(activeMentionAt(field.value, field.selectionStart));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && mention) {
                    event.preventDefault();
                    setMention(null);
                    return;
                  }
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (mention) {
                      if (mentionPeople[0]) chooseMention(mentionPeople[0]);
                      return;
                    }
                    if (canSend) onSubmit();
                  }
                }}
                placeholder="Add a comment…"
                aria-label="Add a comment"
                className="wheel max-h-24 min-w-0 w-full resize-none bg-transparent text-[16px] leading-[1.4] text-ink outline-none placeholder:text-faint md:text-[12px] md:leading-[1.5]"
              />
              {files.length ? (
                <ul className="mb-1.5 flex flex-wrap gap-1.5">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[10px] text-muted"
                    >
                      {file.type === "image/gif" ? (
                        <span className="text-[9px] font-bold">GIF</span>
                      ) : (
                        <ImagePlus className="h-3 w-3" />
                      )}
                      <span className="max-w-32 truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => onFilesChange(files.filter((_, item) => item !== index))}
                        className="cursor-pointer rounded-full text-muted hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="mt-1 flex items-center justify-between gap-1 md:mt-0">
              <div className="flex items-center gap-1">
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={addFiles}
                />
                <button
                  type="button"
                  aria-label="Attach an image"
                  onClick={() => photoInput.current?.click()}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                >
                  <ImagePlus className="h-[18px] w-[18px]" />
                </button>
                <input
                  ref={gifInput}
                  type="file"
                  accept="image/gif"
                  multiple
                  className="hidden"
                  onChange={addFiles}
                />
                <button
                  type="button"
                  aria-label="Attach a GIF"
                  onClick={() => gifInput.current?.click()}
                  className="flex h-8 cursor-pointer items-center justify-center rounded-full px-1 text-[11px] font-bold text-muted transition hover:bg-cream hover:text-ink"
                >
                  GIF
                </button>
                <button
                  type="button"
                  aria-label="Add an emoji"
                  aria-haspopup="dialog"
                  aria-expanded={emojiOpen}
                  ref={emojiButtonRef}
                  onClick={() => setEmojiOpen((open) => !open)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                >
                  <Smile className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label="Mention someone"
                  onClick={insertMentionTrigger}
                  aria-haspopup="listbox"
                  aria-expanded={Boolean(mention)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                >
                  <AtSign className="h-[18px] w-[18px]" />
                </button>
              </div>
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSend}
                aria-label="Post comment"
                className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition ${
                  canSend
                    ? "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
                    : "cursor-not-allowed bg-line text-muted"
                }`}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {emojiOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:px-5 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Choose an emoji"
        >
          <button
            type="button"
            aria-label="Close emoji picker"
            onClick={closeEmojiPicker}
            className="absolute inset-0 cursor-default bg-ink/40"
            style={{ animation: "onward-fade 0.15s ease-out" }}
          />
          <section
            className="relative flex max-h-[82dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl border border-line bg-paper shadow-lift sm:rounded-3xl"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
              animation: "onward-slide-up 0.22s ease-out",
            }}
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-bold text-ink">Choose an emoji</h2>
                <p className="mt-0.5 text-[10.5px] text-muted">
                  Search or browse by category
                </p>
              </div>
              <button
                type="button"
                aria-label="Close emoji picker"
                onClick={closeEmojiPicker}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-2">
              <EmojiPicker
                onEmojiClick={(emoji) => addEmoji(emoji.emoji)}
                emojiStyle="native"
                theme="light"
                width="100%"
                height="52dvh"
                lazyLoadEmojis
                autoFocusSearch={false}
                previewConfig={{ showPreview: false }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
