"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ImagePlus, Loader2, Send, Smile, X } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError } from "@/components/toast";
import { POST_COMMENT_MAX } from "@/lib/db";

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
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const closeEmojiPicker = useCallback(() => {
    setEmojiOpen(false);
    window.requestAnimationFrame(() => emojiButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    const field = composerRef.current?.querySelector("textarea");
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(96, field.scrollHeight)}px`;
  }, [value]);

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
      toastError("Attach up to four images.");
      return;
    }
    if (picked.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      toastError("Choose a JPG, PNG or WebP image.");
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
          <div className="rounded-2xl border border-line bg-paper px-3.5 py-2 focus-within:border-dash">
            <textarea
              ref={inputRef}
              value={value}
              rows={1}
              maxLength={POST_COMMENT_MAX}
              onChange={(event) => {
                const field = event.currentTarget;
                field.style.height = "auto";
                field.style.height = `${Math.min(96, field.scrollHeight)}px`;
                onChange(field.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
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
                    <ImagePlus className="h-3 w-3" />
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
            <div className="flex items-center justify-end gap-1">
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
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSend}
                aria-label="Post comment"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  canSend
                    ? "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
                    : "cursor-not-allowed bg-line text-muted"
                }`}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
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
