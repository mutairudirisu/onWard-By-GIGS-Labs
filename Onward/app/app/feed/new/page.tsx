"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, ImagePlus, Loader2, X } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { useStore } from "@/components/store";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import {
  POST_BODY_MAX,
  POST_MEDIA_MAX_PER_POST,
  createPost,
  mediaProblem,
} from "@/lib/db";
import { useKeyboardInset } from "@/lib/keyboard";

/** The picked file and the URL its tile shows. Videos preview their first frame. */
type Pick = { file: File; url: string };

/** The counter and the one button that finishes the post, in the page and again on
 *  top of the keypad. */
function SubmitRow({
  chars,
  used,
  empty,
  busy,
  onSubmit,
}: {
  chars: number;
  used: number;
  empty: boolean;
  busy: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 -rotate-90" aria-hidden>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2.5"
          stroke="currentColor"
          className="text-line"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={2 * Math.PI * 10}
          strokeDashoffset={2 * Math.PI * 10 * (1 - Math.min(1, used))}
          className={used > 0.9 ? "text-[#E5484D]" : "text-lime-deep"}
        />
      </svg>
      <span className="min-w-0 flex-1 text-[10px] tabular-nums text-muted">
        {chars}/{POST_BODY_MAX}
      </span>
      <button
        type="button"
        onClick={onSubmit}
        disabled={empty || Boolean(busy)}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold transition active:scale-[0.99] ${
          empty || busy
            ? "cursor-not-allowed bg-line text-muted"
            : "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
        }`}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {busy}
          </>
        ) : (
          "Post"
        )}
      </button>
    </div>
  );
}

function Composer() {
  const router = useRouter();
  const params = useSearchParams();
  const { onWards } = useStore();
  const { user } = useAuth();
  const me = useCurrentUser();
  const [body, setBody] = useState("");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const keyboard = useKeyboardInset(Boolean(user));

  // Opening this from an onWard carries its text over; the entry itself stays private.
  useEffect(() => {
    const fromQuery = onWards.find((w) => w.id === params.get("ward"));
    if (!fromQuery) return;
    setBody(
      [fromQuery.title, fromQuery.impact, fromQuery.body].filter((line) => line && line.trim()).join("\n\n"),
    );
    // Only on the way in: retyping must not be undone by a store refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => picks.forEach((pick) => URL.revokeObjectURL(pick.url)),
    // Each change hands a fresh teardown for the set it replaced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picks],
  );

  const room = POST_MEDIA_MAX_PER_POST - picks.length;
  const empty = body.trim().length === 0 && picks.length === 0;
  const used = body.length / POST_BODY_MAX;
  const ward = useMemo(
    () => onWards.find((w) => w.id === params.get("ward")),
    [onWards, params],
  );
  const initials = me.initials || (me.name.slice(0, 1).toUpperCase() || "?");

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...picks.map((p) => p.file), ...Array.from(list)];
    const problem = mediaProblem(next);
    if (problem) {
      toastError(problem);
      return;
    }
    setPicks((prev) => [
      ...prev,
      ...Array.from(list).map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removeAt(index: number) {
    setPicks((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function post() {
    if (empty || busy) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setBusy("Uploading your files…");
    setProgress(null);
    try {
      await createPost({
        body: body.trim(),
        files: picks.map((p) => p.file),
        wardId: ward?.id ?? null,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      toastSuccess("Posted to the feed");
      router.push("/feed");
    } catch (error) {
      setBusy(null);
      setProgress(null);
      toastError(error instanceof Error ? error.message : "Couldn't post that");
    }
  }

  return (
    <PhoneShell tab="feed">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/feed"
          aria-label="Back to the feed"
          className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5 8 12l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-[13px] font-bold tracking-tight text-ink">New post</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 pb-1 pt-3.5">
          <Avatar initials={initials} src={me.avatarUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold tracking-tight text-ink">
              {me.name ? `${me.name.split(" ")[0]} (you)` : "You"}
            </span>
            {me.role ? (
              <span className="block truncate text-[9px] text-muted">{me.role}</span>
            ) : null}
          </span>
        </div>

        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, POST_BODY_MAX))}
          rows={6}
          placeholder="What did you get done, and what did it change?"
          aria-label="Post text"
          className="wheel w-full resize-none bg-transparent px-4 py-3 text-[13.5px] leading-[1.6] text-ink outline-none placeholder:text-faint"
        />

        {picks.length ? (
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
            {picks.map((pick, index) => (
              <div
                key={pick.url}
                className="relative aspect-square overflow-hidden rounded-xl bg-lime-pale"
              >
                {pick.file.type.startsWith("video/") ? (
                  <video
                    src={pick.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src={pick.url} alt="" className="h-full w-full object-cover" />
                )}
                {/* The number is the order the files go up in, which is the order the
                    feed slides through them. */}
                <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-ink/55 px-1.5 text-[9.5px] font-bold tabular-nums text-paper">
                  {index + 1}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${pick.file.name}`}
                  onClick={() => removeAt(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-paper transition hover:bg-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {room > 0 ? (
              <button
                type="button"
                aria-label="Add another"
                onClick={() => imageRef.current?.click()}
                className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dash text-inksoft transition hover:border-lime-deep hover:text-lime-deep"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={room <= 0}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-inksoft transition hover:bg-cream disabled:cursor-not-allowed disabled:text-faint"
          >
            <ImagePlus className="h-[17px] w-[17px]" /> Photo
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            disabled={room <= 0}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-inksoft transition hover:bg-cream disabled:cursor-not-allowed disabled:text-faint"
          >
            <Film className="h-[17px] w-[17px]" /> Video
          </button>
          <span className="ml-auto pr-2 text-[10px] text-faint">
            {room > 0 ? `${room} of ${POST_MEDIA_MAX_PER_POST} free` : "No room left"}
          </span>
        </div>

        <input
          ref={imageRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={videoRef}
          type="file"
          hidden
          multiple
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {ward ? (
        <p className="mt-3 text-[10.5px] leading-[1.5] text-muted">
          Written from <span className="font-semibold text-inksoft">{ward.title}</span>. The post
          goes to the feed; the onWard itself stays private.
        </p>
      ) : null}

      <p className="mt-3 text-[10px] leading-[1.5] text-muted">
        {progress
          ? `Uploading ${progress.done} of ${progress.total}…`
          : "25MB each. Anyone on onWard can read what you post, so keep it to what you would say out loud."}
      </p>

      <div className="mt-3">
        <SubmitRow chars={body.length} used={used} empty={empty} busy={busy} onSubmit={() => void post()} />
      </div>

      {/* While the keypad is up the in-flow button is somewhere you cannot reach, so the
          same row rides on top of it. Nothing else is pinned: the tab bar keeps its place. */}
      {keyboard > 0 ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[400px] bg-cream/95 px-5 pt-2.5 backdrop-blur"
          style={{ paddingBottom: keyboard + 10 }}
        >
          <SubmitRow
            chars={body.length}
            used={used}
            empty={empty}
            busy={busy}
            onSubmit={() => void post()}
          />
        </div>
      ) : null}

      <p className="mt-4 text-center text-[10px] text-muted">
        Changed your mind?{" "}
        <Link href="/feed" className="cursor-pointer font-bold text-lime-deep hover:underline">
          Back to the feed
        </Link>
      </p>
    </PhoneShell>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <Composer />
    </Suspense>
  );
}
