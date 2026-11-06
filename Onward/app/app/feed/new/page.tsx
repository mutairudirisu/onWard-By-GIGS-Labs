"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ImagePlus, X } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { PageHeader } from "@/components/ui";
import { useStore } from "@/components/store";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import {
  POST_BODY_MAX,
  POST_MEDIA_MAX_PER_POST,
  createPost,
  mediaProblem,
} from "@/lib/db";

/** The picked file and the URL its tile shows. Videos preview their first frame. */
type Pick = { file: File; url: string };

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
  const fileRef = useRef<HTMLInputElement>(null);

  // Opening this from an onWard carries its text over; the entry itself stays private.
  useEffect(() => {
    const ward = onWards.find((w) => w.id === params.get("ward"));
    if (!ward) return;
    setBody(
      [ward.title, ward.impact, ward.body].filter((line) => line && line.trim()).join("\n\n"),
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
        wardId: params.get("ward"),
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
      <PageHeader title="New post" subtitle="This goes to the feed, not to your onWards." />

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 pb-1 pt-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-soft text-[10px] font-bold text-ink">
            {me.avatarUrl ? (
              <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (me.initials || me.name.slice(0, 1).toUpperCase() || "?")
            )}
          </span>
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
          rows={5}
          placeholder="What did you get done, and what did it change?"
          aria-label="Post text"
          className="w-full resize-none bg-transparent px-4 py-3 text-[13.5px] leading-[1.6] text-ink outline-none placeholder:text-faint"
        />

        <div className="grid grid-cols-3 gap-1 px-3 pb-3">
          {picks.map((pick, index) => (
            <div key={pick.url} className="relative aspect-square overflow-hidden rounded-lg bg-lime-pale">
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
              <button
                type="button"
                aria-label={`Remove ${pick.file.name}`}
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-paper"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {room > 0 ? (
            <button
              type="button"
              aria-label="Add a photo or video"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dash text-inksoft transition hover:border-lime-deep hover:text-lime-deep"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[10px] text-muted">
          {progress
            ? `Uploading ${progress.done} of ${progress.total}…`
            : `${POST_MEDIA_MAX_PER_POST} files max, 25MB each. First name and initials only.`}
        </p>
        <span className="text-[10px] tabular-nums text-faint">{body.length}/{POST_BODY_MAX}</span>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={post}
          disabled={empty || Boolean(busy)}
          className={`flex w-full items-center justify-center gap-2 rounded-btn px-4 py-3 text-[13px] font-semibold transition active:scale-[0.99] ${
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
