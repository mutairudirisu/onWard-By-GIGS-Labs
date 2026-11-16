"use client";

import { useEffect, useRef, useState, type ChangeEvent, type Ref } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, Send, Smile, X } from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError } from "@/components/toast";
import { POST_COMMENT_MAX } from "@/lib/db";

const EMOJIS = ["😊", "😂", "❤️", "🙌", "🎉", "✨", "👍", "🔥", "💚", "👏", "🥰", "💪"];
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
  const gifInput = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    const field = composerRef.current?.querySelector("textarea");
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(96, field.scrollHeight)}px`;
  }, [value]);

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length + picked.length > MAX_FILES) {
      toastError("Attach up to four images or GIFs.");
      return;
    }
    if (picked.some((file) => file.size > MAX_FILE_BYTES)) {
      toastError("Keep each image or GIF under 25MB.");
      return;
    }
    onFilesChange([...files, ...picked]);
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
          {emojiOpen ? (
            <div
              role="group"
              aria-label="Choose an emoji"
              className="absolute bottom-full right-8 z-10 mb-2 grid grid-cols-6 gap-1 rounded-2xl border border-line bg-paper p-2 shadow-lift"
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Add ${emoji}`}
                  onClick={() => {
                    onChange(`${value}${emoji}`.slice(0, POST_COMMENT_MAX));
                    setEmojiOpen(false);
                  }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[20px] transition hover:bg-cream"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
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
                    {file.type === "image/gif" ? "GIF" : <ImagePlus className="h-3 w-3" />}
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
                aria-expanded={emojiOpen}
                onClick={() => setEmojiOpen((open) => !open)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
              >
                <Smile className="h-[18px] w-[18px]" />
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
                className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-1 text-[10px] font-bold text-muted transition hover:bg-cream hover:text-ink"
              >
                GIF
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
    </div>
  );
}
