"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  Clock3,
  Film,
  ImagePlus,
  Loader2,
  Plus,
  X,
} from "lucide-react";
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
  const [audienceInfo, setAudienceInfo] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
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
      <div className="mb-5 flex items-center gap-2.5">
        <Link
          href="/feed"
          aria-label="Discard and return to the Exchange"
          className="-ml-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-lime-pale"
        >
          <X className="h-6 w-6" strokeWidth={1.8} />
        </Link>
        <Avatar initials={initials} src={me.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setAudienceInfo(true)}
            className="flex cursor-pointer items-center gap-1 text-[15px] font-semibold leading-tight text-ink"
          >
            Anyone
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>
          <p className="mt-1 truncate text-[12px] leading-tight text-muted">
            {channel ? `Public on Exchange · #${channel.name}` : "Public on the Exchange"}
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-label="Scheduled posting is not available yet"
          title="Scheduled posting is not available yet"
          className="flex h-12 w-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-cream text-faint"
        >
          <Clock3 className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => void post()}
          disabled={empty || Boolean(busy)}
          className={`flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-[14px] font-semibold transition active:scale-[0.99] ${
            empty || busy
              ? "cursor-not-allowed bg-cream text-faint"
              : "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Posting…" : isPoll ? "Publish poll" : "Post"}
        </button>
      </div>

      {showBanner ? (
        <div className="mb-7 flex items-start gap-3 rounded-xl bg-lime-pale px-4 py-4 text-ink">
          <p className="flex-1 text-[14px] leading-[1.5]">
            {ward
              ? `Share a thought inspired by “${ward.title}”. Your onWard stays private.`
              : "Share a win, a question or an idea with people across the Exchange."}
          </p>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setShowBanner(false)}
            className="-mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-lime-soft"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <div className="min-h-[35vh]">
        {isPoll ? (
          <PollComposer draft={pollDraft} onChange={setPollDraft} disabled={Boolean(busy)} />
        ) : (
          <>
            {showHeadline || title ? (
              <input
                autoFocus={showHeadline}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, POST_TITLE_MAX))}
                placeholder="Add a headline"
                aria-label="Post headline"
                className="mb-2 w-full bg-transparent px-0 py-2 text-[18px] font-semibold leading-[1.4] text-ink outline-none placeholder:font-normal placeholder:text-muted"
              />
            ) : null}
            <PostEditor
              initial={body}
              onChange={setBody}
              placeholder="Share your thoughts ..."
              max={POST_BODY_MAX}
              disabled={Boolean(busy)}
              showToolbar={showFormatting}
              editorClassName="!min-h-[calc(100dvh-380px)] !px-0 !pt-4 md:!min-h-[360px]"
            />
            {picks.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {picks.map((pick, index) => (
                  <div
                    key={pick.url}
                    className="relative aspect-square overflow-hidden rounded-xl bg-lime-pale"
                  >
                    {pick.file.type.startsWith("video/") ? (
                      <video src={pick.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <img src={pick.url} alt="" className="h-full w-full object-cover" />
                    )}
                    <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-ink/55 px-1.5 text-[9.5px] font-bold tabular-nums text-paper">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${pick.file.name}`}
                      onClick={() => removeAt(index)}
                      className="absolute right-1 top-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-paper transition hover:bg-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
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

      <div
        className="fixed inset-x-0 z-[45] mx-auto flex w-full max-w-[400px] items-center gap-3 bg-cream/95 px-5 py-3 backdrop-blur md:static md:mx-auto md:max-w-[820px] md:bg-transparent md:px-0 md:backdrop-blur-none"
        style={{ bottom: keyboard > 0 ? keyboard + 8 : 104 }}
      >
        {isPoll ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => setMode("post")}
            className="flex min-h-11 cursor-pointer items-center rounded-full border border-dash px-4 text-[13px] font-medium text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
          >
            Text post
          </button>
        ) : (
          <button
            type="button"
            aria-pressed={showFormatting}
            onClick={() => setShowFormatting((visible) => !visible)}
            className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] font-medium transition ${
              showFormatting
                ? "border-lime-deep bg-lime-pale text-ink"
                : "border-dash text-inksoft hover:border-lime-deep hover:bg-lime-pale"
            }`}
          >
            Format
          </button>
        )}
        {!isPoll ? (
          <button
            type="button"
            aria-label="Add photos"
            title={room > 0 ? `${room} attachment${room === 1 ? "" : "s"} available` : "Attachment limit reached"}
            disabled={room <= 0 || Boolean(busy)}
            onClick={() => imageRef.current?.click()}
            className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:text-faint"
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.8} />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Add to your post"
          aria-haspopup="dialog"
          onClick={() => setAddMenu(true)}
          disabled={Boolean(busy)}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-lime-soft text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:text-faint ${
            isPoll ? "ml-auto" : ""
          }`}
        >
          <Plus className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <Modal open={audienceInfo} onClose={() => setAudienceInfo(false)} title="Post audience">
        <p className="text-[12px] leading-[1.6] text-inksoft">
          Exchange posts are public and can be seen by anyone. Audience selection and collaborator
          controls aren’t available yet.
        </p>
      </Modal>

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
          {isPoll ? (
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
          ) : (
            <>
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
                  setShowHeadline(true);
                  setAddMenu(false);
                }}
                className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-[17px] font-bold leading-none text-lime-deep">T</span>
                Headline
              </button>
            </>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] leading-[1.5] text-muted">
          {isPoll
            ? "Switch to a text post to attach media."
            : "Keep it simple: share a thought, add media, or ask a poll."}
        </p>
      </Modal>

      {progress ? (
        <p className="mt-3 text-[10px] leading-[1.5] text-muted">
          Uploading {progress.done} of {progress.total}…
        </p>
      ) : null}
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
