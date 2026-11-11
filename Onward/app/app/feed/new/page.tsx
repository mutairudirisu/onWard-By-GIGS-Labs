"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Eye, Film, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { Modal } from "@/components/modal";
import { PostEditor } from "@/components/post-editor";
import {
  PollComposer,
  newPollDraft,
  pollEndsAt,
  type PollComposerDraft,
} from "@/components/poll-composer";
import { useStore } from "@/components/store";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import {
  POST_BODY_MAX,
  POST_MEDIA_MAX_PER_POST,
  POST_TITLE_MAX,
  createPost,
  fetchChannel,
  mediaProblem,
  type ChannelCard,
} from "@/lib/db";
import { useKeyboardInset } from "@/lib/keyboard";

/** The picked file and the URL its tile shows. Videos preview their first frame. */
type Pick = { file: File; url: string };

/** Compact submit action pinned above the virtual keyboard while it is open. */
function SubmitRow({
  chars,
  used,
  empty,
  busy,
  isPoll,
  onSubmit,
}: {
  chars: number;
  used: number;
  empty: boolean;
  busy: string | null;
  isPoll: boolean;
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
          isPoll ? "Publish poll" : "Post"
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [picks, setPicks] = useState<Pick[]>([]);
  // Post and Poll are two modes of one composer, so switching between them keeps
  // whatever is already written in either of them. The chooser can ask for the poll
  // straight away.
  const [mode, setMode] = useState<"post" | "poll">(
    params.get("mode") === "poll" ? "poll" : "post",
  );
  const [pollDraft, setPollDraft] = useState<PollComposerDraft>(newPollDraft);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [channel, setChannel] = useState<ChannelCard | null>(null);
  const [addMenu, setAddMenu] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const keyboard = useKeyboardInset(Boolean(user));

  // Which room this is going into, so the page can say its name rather than an id.
  const channelParam = params.get("channel");
  useEffect(() => {
    if (!channelParam) return;
    let cancelled = false;
    void fetchChannel(channelParam)
      .then((found) => {
        if (!cancelled) setChannel(found);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [channelParam]);

  // Opening this from an onWard carries its words over; the entry itself stays private.
  useEffect(() => {
    const fromQuery = onWards.find((w) => w.id === params.get("ward"));
    if (!fromQuery) return;
    setTitle(fromQuery.title.slice(0, POST_TITLE_MAX));
    setBody([fromQuery.impact, fromQuery.body].filter((line) => line && line.trim()).join("\n\n"));
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
  const isPoll = mode === "poll";
  // A poll counts as content only once it says something, so an empty half-filled
  // section cannot send a post with nothing in it.
  const pollWanted = Boolean(
    pollDraft.question.trim() || pollDraft.options.some((option) => option.trim()),
  );
  // A poll is its own kind of entry: it is asked with the question and the choices,
  // so it needs no headline, no words and no picture alongside it.
  const empty = isPoll ? !pollWanted : !title.trim() && !body.trim() && !picks.length;
  // The ring counts the words that are actually going into the post, so a poll does not
  // inherit the count of the text left behind when the poll form came up.
  const counted = isPoll ? 0 : body.length;
  const used = counted / POST_BODY_MAX;
  const ward = useMemo(
    () => onWards.find((w) => w.id === params.get("ward")),
    [onWards, params],
  );
  // A channel post is an ordinary Exchange post with a room named on it.
  const channelId = channelParam;
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
        title: isPoll ? "" : title.trim(),
        body: isPoll ? "" : body.trim(),
        files: isPoll ? [] : picks.map((p) => p.file),
        wardId: ward?.id ?? null,
        channelId: channelId ?? null,
        poll: isPoll && pollWanted
          ? {
              question: pollDraft.question,
              options: pollDraft.options,
              endsAt: pollEndsAt(pollDraft.hours),
            }
          : null,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      toastSuccess("Shared to the Exchange");
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
          aria-label="Discard and return to the Exchange"
          className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2} />
        </Link>
        <Avatar initials={initials} src={me.avatarUrl} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-bold tracking-tight text-ink">
            {me.name ? `${me.name.split(" ")[0]} (you)` : "You"}
          </span>
          <span className="flex items-center gap-1 text-[9.5px] font-medium text-muted">
            <Eye className="h-3 w-3" strokeWidth={2} />
            Public on the Exchange{channel ? ` · #${channel.name}` : ""}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void post()}
          disabled={empty || Boolean(busy)}
          className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition active:scale-[0.99] ${
            empty || busy
              ? "cursor-not-allowed bg-line text-muted"
              : "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {busy ? "Posting…" : isPoll ? "Publish poll" : "Post"}
        </button>
      </div>

      <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-lime-deep/25 bg-lime-pale px-3.5 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-deep">
          <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <p className="text-[10.5px] leading-[1.5] text-inksoft">
          {channel
            ? `This post will be public on the Exchange and in #${channel.name}.`
            : "Your post will be visible to people across the Exchange."}
        </p>
      </div>

      <div className="card overflow-hidden">

        {isPoll ? (
          <PollComposer draft={pollDraft} onChange={setPollDraft} disabled={Boolean(busy)} />
        ) : (
          <>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, POST_TITLE_MAX))}
              placeholder="Say it in one line"
              aria-label="Exchange title"
              className="wheel w-full border-b border-line bg-transparent px-4 py-4 text-[15px] font-bold leading-[1.4] tracking-tight text-ink outline-none placeholder:font-normal placeholder:text-faint"
            />

            <PostEditor
              initial={body}
              onChange={setBody}
              max={POST_BODY_MAX}
              disabled={Boolean(busy)}
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
          </>
        )}

        <div className="flex items-center gap-2 border-t border-line px-3 py-2">
          <button
            type="button"
            aria-label="Add to your post"
            aria-haspopup="dialog"
            onClick={() => setAddMenu(true)}
            disabled={Boolean(busy)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-lime-soft text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:text-faint"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
          <span className="text-[10.5px] font-semibold text-inksoft">
            {isPoll ? "Poll" : picks.length ? `${picks.length} attachment${picks.length === 1 ? "" : "s"}` : "Add media or make a poll"}
          </span>
          <span className="min-w-0 flex-1" />
          {!isPoll ? (
            <span className="text-[9.5px] text-faint">
              {room > 0 ? `${room} of ${POST_MEDIA_MAX_PER_POST} left` : "No room left"}
            </span>
          ) : null}
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

      <Modal open={addMenu} onClose={() => setAddMenu(false)} title="Add to your post">
        <div className="grid grid-cols-2 gap-2">
          {!isPoll ? (
            <>
              <button
                type="button"
                disabled={room <= 0 || Boolean(busy)}
                onClick={() => {
                  setAddMenu(false);
                  imageRef.current?.click();
                }}
                className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus className="h-5 w-5 text-lime-deep" strokeWidth={2} />
                Photos
              </button>
              <button
                type="button"
                disabled={room <= 0 || Boolean(busy)}
                onClick={() => {
                  setAddMenu(false);
                  videoRef.current?.click();
                }}
                className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Film className="h-5 w-5 text-lime-deep" strokeWidth={2} />
                Video
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => {
              setMode("poll");
              setAddMenu(false);
            }}
            className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BarChart3 className="h-5 w-5 text-lime-deep" strokeWidth={2} />
            Poll
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => {
              setMode("post");
              setAddMenu(false);
            }}
            className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-[17px] font-bold leading-none text-lime-deep">Aa</span>
            Text post
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] leading-[1.5] text-muted">
          {isPoll
            ? "Switch to a text post to attach media."
            : "Keep it simple: share a thought, add media, or ask a poll."}
        </p>
      </Modal>

      {ward ? (
        <p className="mt-3 text-[10.5px] leading-[1.5] text-muted">
          Written from <span className="font-semibold text-inksoft">{ward.title}</span>. The post
          goes to the Exchange; the onWard itself stays private.
        </p>
      ) : null}

      {progress ? (
        <p className="mt-3 text-[10px] leading-[1.5] text-muted">
          Uploading {progress.done} of {progress.total}…
        </p>
      ) : null}

      <div className={`mt-3${keyboard > 0 ? " hidden" : ""}`}>
        <p className="text-center text-[10px] tabular-nums text-muted">
          {counted}/{POST_BODY_MAX} characters
        </p>
      </div>

      {keyboard > 0 ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[400px] bg-cream/95 px-5 pt-2.5 backdrop-blur"
          style={{ paddingBottom: keyboard + 10 }}
        >
          <SubmitRow
            chars={counted}
            used={used}
            empty={empty}
            busy={busy}
            isPoll={isPoll}
            onSubmit={() => void post()}
          />
        </div>
      ) : null}

      <p className="mt-4 text-center text-[10px] text-muted">
        Changed your mind?{" "}
        <Link href="/feed" className="cursor-pointer font-bold text-lime-deep hover:underline">
          Back to the Exchange
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
