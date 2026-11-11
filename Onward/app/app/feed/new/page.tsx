"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Copy,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Globe,
  Handshake,
  ImagePlus,
  Loader2,
  MessageCircle,
  PartyPopper,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  Users,
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
import { supabase } from "@/lib/supabase";
import {
  POST_BODY_MAX,
  POST_MEDIA_MAX_PER_POST,
  POST_TITLE_MAX,
  createPost,
  mediaProblem,
  removePostDocument,
  searchPeople,
  uploadPostDocument,
  type ExchangePerson,
} from "@/lib/db";
import { useKeyboardInset } from "@/lib/keyboard";

/** The picked file and the URL its tile shows. Videos preview their first frame. */
type Pick = { file: File; url: string };
type ComposerPage =
  | "event"
  | "celebration"
  | "celebration-details"
  | "job"
  | "document"
  | null;
const FORM_INPUT_CLASS =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted focus:border-lime-deep";
const POST_CATEGORIES = [
  { id: "media", label: "Media", Icon: ImagePlus },
  { id: "event", label: "Event", Icon: CalendarDays },
  { id: "celebration", label: "Celebration", Icon: PartyPopper },
  { id: "job", label: "Job", Icon: BriefcaseBusiness },
  { id: "poll", label: "Poll", Icon: BarChart3 },
  { id: "document", label: "Document", Icon: FileText },
] as const;
type ProofreadResult = { original: string; corrected: string };
type AudiencePanel = "overview" | "visibility" | "comments" | "collaborators";
type PostAudience = "anyone" | "connections";
type CommentAudience = "anyone" | "connections" | "off";

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
  const [composerPage, setComposerPage] = useState<ComposerPage>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [audiencePanel, setAudiencePanel] = useState<AudiencePanel>("overview");
  const [postAudience, setPostAudience] = useState<PostAudience>("anyone");
  const [commentAudience, setCommentAudience] = useState<CommentAudience>("anyone");
  const [collaborators, setCollaborators] = useState<ExchangePerson[]>([]);
  const [peopleResults, setPeopleResults] = useState<ExchangePerson[]>([]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [brandPartnership, setBrandPartnership] = useState(false);
  const [brandPartnerName, setBrandPartnerName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventFormat, setEventFormat] = useState<"Online" | "In person">("Online");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [celebration, setCelebration] = useState("Project launch");
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [jobDescription, setJobDescription] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCaption, setDocumentCaption] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [audienceSettingsOpen, setAudienceSettingsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
  const [proofreading, setProofreading] = useState(false);
  const [proofreadResult, setProofreadResult] = useState<ProofreadResult | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const mediaRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const keyboard = useKeyboardInset(Boolean(user));

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
  const empty = isPoll
    ? !pollWanted
    : !title.trim() && !body.trim() && !picks.length && !documentFile;
  // The ring counts the words that are actually going into the post, so a poll does not
  // inherit the count of the text left behind when the poll form came up.
  const ward = useMemo(
    () => onWards.find((w) => w.id === params.get("ward")),
    [onWards, params],
  );
  const initials = me.initials || (me.name.slice(0, 1).toUpperCase() || "?");
  const audienceLabel = postAudience === "connections" ? "Connections" : "Anyone";

  useEffect(() => {
    if (!audienceSettingsOpen || audiencePanel !== "collaborators") return;
    let active = true;
    setPeopleLoading(true);
    const timer = window.setTimeout(() => {
      void searchPeople(peopleQuery.trim())
        .then((people) => {
          if (active) setPeopleResults(people);
        })
        .catch((error) => {
          if (active) toastError(error instanceof Error ? error.message : "Couldn't search people.");
        })
        .finally(() => {
          if (active) setPeopleLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [audiencePanel, audienceSettingsOpen, peopleQuery]);

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

  function chooseCategory(category: "media" | "event" | "celebration" | "job" | "poll" | "document") {
    if ((category === "media" || category === "document") && postAudience !== "anyone") {
      toastError("Set the post audience to Anyone before adding media or a document.");
      return;
    }
    setShowCategoryModal(false);
    if (category === "media") {
      setComposerPage(null);
      setMode("post");
      mediaRef.current?.click();
    } else if (category === "poll") {
      setComposerPage(null);
      setMode("poll");
    } else {
      setMode("post");
      setComposerPage(category);
    }
  }

  function backFromComposerPage() {
    if (composerPage === "celebration-details") setComposerPage("celebration");
    else if (composerPage) {
      setComposerPage(null);
      setShowCategoryModal(true);
    }
  }

  function addEvent() {
    if (!eventName.trim() || !eventStart || (eventFormat === "In person" && !eventLocation.trim())) {
      toastError("Add the event name, start time, and location for an in-person event.");
      return;
    }
    if (eventEnd && Date.parse(eventEnd) <= Date.parse(eventStart)) {
      toastError("The event end time must be after its start time.");
      return;
    }
    const formatDate = (value: string) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      );
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const details = [
      `${eventFormat} event`,
      eventLocation.trim() ? `Location: ${eventLocation.trim()}` : "",
      `Starts: ${formatDate(eventStart)} (${timeZone})`,
      eventEnd ? `Ends: ${formatDate(eventEnd)} (${timeZone})` : "",
      eventDescription.trim(),
    ].filter(Boolean);
    setTitle(eventName.trim().slice(0, POST_TITLE_MAX));
    setBody(details.join("\n\n").slice(0, POST_BODY_MAX));
    setShowHeadline(true);
    setComposerPage(null);
  }

  function addCelebration() {
    setTitle(celebration.slice(0, POST_TITLE_MAX));
    setBody(celebrationMessage.trim().slice(0, POST_BODY_MAX));
    setShowHeadline(true);
    setComposerPage(null);
  }

  function addJob() {
    if (!jobTitle.trim() || !jobCompany.trim()) {
      toastError("Add the job title and company before continuing.");
      return;
    }
    const details = [
      `Company: ${jobCompany.trim()}`,
      `Type: ${jobType}`,
      jobLocation.trim() ? `Location: ${jobLocation.trim()}` : "",
      jobDescription.trim(),
    ].filter(Boolean);
    setTitle(jobTitle.trim().slice(0, POST_TITLE_MAX));
    setBody(details.join("\n\n").slice(0, POST_BODY_MAX));
    setShowHeadline(true);
    setComposerPage(null);
  }

  async function proofread() {
    const original = body.trim();
    if (!original || proofreading || busy) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setProofreading(true);
    setProofreadResult(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (error || !accessToken) {
        throw new Error("Your session has expired. Sign in again.");
      }

      const response = await fetch("/api/proofread", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ text: original }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The proofreading service returned an unreadable response.");
      }
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Couldn't proofread this text.";
        throw new Error(message);
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("corrected" in payload) ||
        typeof payload.corrected !== "string" ||
        !payload.corrected.trim()
      ) {
        throw new Error("The proofreading service returned no corrected text.");
      }
      setProofreadResult({ original, corrected: payload.corrected.trim() });
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't proofread this text.");
    } finally {
      setProofreading(false);
    }
  }

  async function copyProofreadText() {
    if (!proofreadResult) return;
    try {
      await navigator.clipboard.writeText(proofreadResult.corrected);
      toastSuccess("Improved text copied");
    } catch {
      toastError("Couldn't copy the improved text. Check clipboard permissions and try again.");
    }
  }

  function replaceWithProofreadText() {
    if (!proofreadResult) return;
    setBody(proofreadResult.corrected);
    setEditorVersion((version) => version + 1);
    setProofreadResult(null);
    toastSuccess("Post text updated");
  }

  async function post() {
    if (empty || busy || composerPage || proofreading) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (postAudience !== "anyone" && (picks.length || documentFile)) {
      toastError("Connections-only posts can’t include media or documents yet.");
      return;
    }
    if (brandPartnership && !brandPartnerName.trim()) {
      toastError("Add the brand or partner name for this disclosure.");
      return;
    }
    setBusy(documentFile ? "Uploading your files…" : "Sharing your post…");
    setProgress(null);
    let uploadedDocumentPath: string | null = null;
    try {
      let postBody = isPoll ? "" : body.trim();
      let postTitle = isPoll ? "" : title.trim();
      if (documentFile) {
        const uploaded = await uploadPostDocument(user.id, documentFile);
        uploadedDocumentPath = uploaded.path;
        const label = (documentTitle.trim() || documentFile.name)
          .replace(/[\[\]()\r\n]/g, "")
          .slice(0, 120);
        const attachment = `[${label}](${uploaded.url})`;
        const documentLine = `Document: ${attachment}`;
        const context = [postBody, documentCaption.trim()].filter(Boolean).join("\n\n");
        const remaining = Math.max(0, POST_BODY_MAX - documentLine.length - (context ? 2 : 0));
        postBody = [context.slice(0, remaining), documentLine].filter(Boolean).join("\n\n");
        if (!postTitle) postTitle = documentTitle.trim().slice(0, POST_TITLE_MAX);
      }
      await createPost({
        title: postTitle,
        body: postBody,
        files: isPoll ? [] : picks.map((p) => p.file),
        wardId: ward?.id ?? null,
        audience: postAudience,
        commentAudience,
        collaboratorIds: collaborators.map((person) => person.id),
        brandPartnerName: brandPartnership ? brandPartnerName : null,
        poll: isPoll && pollWanted
          ? {
              question: pollDraft.question,
              options: pollDraft.options,
              endsAt: pollEndsAt(pollDraft.hours),
            }
          : null,
        documentPath: uploadedDocumentPath,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      uploadedDocumentPath = null;
      toastSuccess("Shared to the Exchange");
      router.push("/feed");
    } catch (error) {
      setBusy(null);
      setProgress(null);
      const message = error instanceof Error ? error.message : "Couldn't post that";
      if (uploadedDocumentPath) {
        try {
          await removePostDocument(uploadedDocumentPath);
        } catch (cleanupError) {
          toastError(
            `${message}. The uploaded document could not be removed: ${
              cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error"
            }`,
          );
          return;
        }
      }
      toastError(message);
    }
  }

  return (
    <PhoneShell tab="feed">
      <div
        className="fixed inset-x-0 top-0 z-[45] mx-auto flex w-full max-w-[400px] items-center gap-2 bg-cream px-5 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:static md:mx-auto md:mb-5 md:max-w-[820px] md:bg-transparent md:px-0 md:py-0"
      >
        <Link
          href="/feed"
          aria-label="Discard and return to the Exchange"
          className="-ml-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-lime-pale"
        >
          <X className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <Avatar initials={initials} src={me.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              setAudiencePanel("overview");
              setAudienceSettingsOpen(true);
            }}
            className="flex cursor-pointer items-center gap-1 text-[14px] font-semibold leading-tight text-ink"
          >
            {audienceLabel}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <p className="mt-1 truncate text-[11px] leading-tight text-muted">
            {postAudience === "connections"
              ? "Visible to mutual followers"
              : "Public on the Exchange"}
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-label="Scheduled posting is not available yet"
          title="Scheduled posting is not available yet"
          className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-lime-pale text-inksoft"
        >
          <Clock3 className="h-4 w-4" strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={() => void post()}
          disabled={empty || Boolean(busy) || Boolean(composerPage) || proofreading}
          className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-[12px] font-semibold transition active:scale-[0.99] ${
            empty || busy || composerPage || proofreading
              ? "cursor-not-allowed bg-lime-pale text-muted"
              : "cursor-pointer bg-lime-pale text-ink hover:bg-lime-soft"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {busy ? "Posting…" : isPoll ? "Publish poll" : "Post"}
        </button>
      </div>
      <div
        aria-hidden="true"
        className="mb-5 h-[calc(3.5rem+env(safe-area-inset-top))] md:hidden"
      />

      <div className="wheel max-h-[calc(100dvh-17rem)] overflow-y-auto overscroll-contain pb-6 md:max-h-none md:overflow-visible md:pb-0">
        {composerPage ? (
          <section aria-label="Post creation step">
            <header className="mb-4 flex items-center gap-2 border-b border-line pb-3">
              <button
                type="button"
                aria-label="Back"
                onClick={backFromComposerPage}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-lime-pale"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">
                  {composerPage === "event"
                    ? "Create an event"
                    : composerPage === "celebration"
                      ? "Choose a celebration"
                      : composerPage === "celebration-details"
                        ? celebration
                        : composerPage === "job"
                          ? "Share a job"
                          : "Share a document"}
                </h2>
                {composerPage === "celebration-details" ? (
                  <p className="text-[10px] text-muted">Add a message for your network</p>
                ) : null}
              </div>
            </header>

            {composerPage === "event" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(["Online", "In person"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      aria-pressed={eventFormat === format}
                      onClick={() => setEventFormat(format)}
                      className={`rounded-xl border px-3 py-2.5 text-[12px] font-semibold ${
                        eventFormat === format
                          ? "border-lime-deep bg-lime-pale text-ink"
                          : "border-line bg-paper text-inksoft"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value.slice(0, 75))}
                  placeholder="Event name"
                  aria-label="Event name"
                  className={FORM_INPUT_CLASS}
                />
                {eventFormat === "In person" ? (
                  <input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Location"
                    aria-label="Event location"
                    className={FORM_INPUT_CLASS}
                  />
                ) : null}
                <label className="block text-[11px] font-medium text-inksoft">
                  Starts
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className={`${FORM_INPUT_CLASS} mt-1`}
                  />
                </label>
                <label className="block text-[11px] font-medium text-inksoft">
                  Ends (optional)
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className={`${FORM_INPUT_CLASS} mt-1`}
                  />
                </label>
                <p className="text-[10px] text-muted">
                  Event times use your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
                </p>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value.slice(0, 1200))}
                  placeholder="Tell people what to expect"
                  aria-label="Event description"
                  rows={4}
                  className={FORM_INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={addEvent}
                  className="w-full rounded-full bg-lime-pale px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-lime-soft"
                >
                  Add event to post
                </button>
              </div>
            ) : null}

            {composerPage === "celebration" ? (
              <div className="space-y-2">
                {[
                  "Project launch",
                  "Work anniversary",
                  "New position",
                  "New educational milestone",
                  "New certification",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCelebration(item);
                      setComposerPage("celebration-details");
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-cream px-4 py-3 text-left text-[12px] font-semibold text-ink transition hover:border-lime-deep hover:bg-lime-pale"
                  >
                    {item}
                    <ChevronDown className="h-4 w-4 -rotate-90 text-muted" />
                  </button>
                ))}
              </div>
            ) : null}

            {composerPage === "celebration-details" ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-lime-pale px-4 py-3 text-[12px] font-semibold text-ink">
                  Celebrating: {celebration}
                </div>
                <textarea
                  value={celebrationMessage}
                  onChange={(e) => setCelebrationMessage(e.target.value.slice(0, POST_BODY_MAX))}
                  placeholder="Share the story behind this milestone"
                  aria-label="Celebration message"
                  rows={6}
                  className={FORM_INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={addCelebration}
                  className="w-full rounded-full bg-lime-pale px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-lime-soft"
                >
                  Add celebration to post
                </button>
              </div>
            ) : null}

            {composerPage === "job" ? (
              <div className="space-y-3">
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value.slice(0, POST_TITLE_MAX))}
                  placeholder="Job title"
                  aria-label="Job title"
                  className={FORM_INPUT_CLASS}
                />
                <input
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  placeholder="Company"
                  aria-label="Company"
                  className={FORM_INPUT_CLASS}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="Location"
                    aria-label="Job location"
                    className={FORM_INPUT_CLASS}
                  />
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    aria-label="Employment type"
                    className={FORM_INPUT_CLASS}
                  >
                    {["Full-time", "Part-time", "Contract", "Internship", "Volunteer"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value.slice(0, 1200))}
                  placeholder="Describe the role or how to apply"
                  aria-label="Job description"
                  rows={4}
                  className={FORM_INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={addJob}
                  className="w-full rounded-full bg-lime-pale px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-lime-soft"
                >
                  Add job to post
                </button>
              </div>
            ) : null}

            {composerPage === "document" ? (
              <div className="space-y-3">
                <input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value.slice(0, 58))}
                  placeholder="Document title"
                  aria-label="Document title"
                  className={FORM_INPUT_CLASS}
                />
                <textarea
                  value={documentCaption}
                  onChange={(e) => setDocumentCaption(e.target.value.slice(0, 1200))}
                  placeholder="Add context for your network"
                  aria-label="Document description"
                  rows={3}
                  className={FORM_INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={() => documentRef.current?.click()}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-lime-deep bg-lime-pale px-3 py-3 text-[12px] font-semibold text-ink"
                >
                  <FileText className="h-4 w-4 text-lime-deep" />
                  {documentFile ? "Replace document" : "Choose a document"}
                </button>
                {documentFile ? (
                  <p className="text-[11px] text-inksoft">
                    {documentFile.name} · {(documentFile.size / 1024 / 1024).toFixed(1)} MB
                    <button
                      type="button"
                      onClick={() => setDocumentFile(null)}
                      className="ml-2 cursor-pointer text-lime-deep underline"
                    >
                      Remove
                    </button>
                  </p>
                ) : null}
                <p className="text-[10px] leading-[1.5] text-muted">
                  PDF, Word, PowerPoint or text files up to 25MB.
                </p>
                <button
                  type="button"
                  disabled={!documentFile || !documentTitle.trim()}
                  onClick={() => setComposerPage(null)}
                  className="w-full rounded-full bg-lime-pale px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add document to post
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <>
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
                    key={editorVersion}
                    initial={body}
                    onChange={(next) => {
                      setBody(next);
                      setProofreadResult(null);
                    }}
                    placeholder="Share a work win, project update, insight or lesson from your professional journey..."
                    max={POST_BODY_MAX}
                    disabled={Boolean(busy) || proofreading}
                    showToolbar={showFormatting}
                    toolbarClassName="fixed inset-x-0 z-[44] mx-auto w-full max-w-[400px] border-t border-b-0 border-line bg-cream/95 px-5 py-2 backdrop-blur md:static md:mx-0 md:max-w-none md:border-t-0 md:border-b md:bg-transparent md:px-2 md:py-1.5 md:backdrop-blur-none"
                    toolbarStyle={{
                      bottom: keyboard > 0 ? keyboard + 84 : 180,
                    }}
                    editorClassName="!min-h-[calc(100dvh-380px)] !px-0 !pt-0 md:!min-h-[360px]"
                  />
                  {proofreading ? (
                    <p
                      role="status"
                      className="mt-3 flex items-center gap-2 rounded-xl bg-lime-pale px-3 py-2.5 text-[11px] font-medium text-inksoft"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-lime-deep" />
                      Checking spelling, grammar, punctuation and clarity…
                    </p>
                  ) : null}
                  {proofreadResult ? (
                    <section
                      aria-label="Proofread comparison"
                      className="mt-4 rounded-2xl border border-line bg-cream p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                          <Sparkles className="h-4 w-4 text-lime-deep" />
                          Proofread result
                        </div>
                        <button
                          type="button"
                          aria-label="Close proofread result"
                          onClick={() => setProofreadResult(null)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-lime-pale"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="min-w-0 rounded-xl border border-line bg-paper p-3">
                          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                            Original
                          </p>
                          <p className="whitespace-pre-wrap break-words text-[12px] leading-[1.55] text-inksoft">
                            {proofreadResult.original}
                          </p>
                        </div>
                        <div className="min-w-0 rounded-xl border border-lime-deep/40 bg-lime-pale p-3">
                          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-inksoft">
                            Improved
                          </p>
                          <p className="whitespace-pre-wrap break-words text-[12px] leading-[1.55] text-ink">
                            {proofreadResult.corrected}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void copyProofreadText()}
                          className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[11px] font-semibold text-inksoft transition hover:bg-lime-pale"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy improved
                        </button>
                        <button
                          type="button"
                          onClick={replaceWithProofreadText}
                          className="min-h-9 cursor-pointer rounded-full bg-lime-pale px-3 text-[11px] font-semibold text-ink transition hover:bg-lime-soft"
                        >
                          Replace original
                        </button>
                      </div>
                    </section>
                  ) : null}
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
          </>
        )}
      </div>

      <input
        ref={mediaRef}
        type="file"
        hidden
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={documentRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) {
            setDocumentFile(file);
            if (!documentTitle.trim()) setDocumentTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 58));
          }
          e.target.value = "";
        }}
      />

      {!composerPage ? (
        <div
          className="fixed inset-x-0 z-[45] mx-auto flex w-full max-w-[400px] items-center gap-3 bg-cream/95 px-5 py-3 backdrop-blur md:static md:mx-auto md:max-w-[820px] md:bg-transparent md:px-0 md:backdrop-blur-none"
          style={{ bottom: keyboard > 0 ? keyboard + 8 : 104 }}
        >
          {!isPoll ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void proofread()}
                disabled={!body.trim() || proofreading || Boolean(busy)}
                className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-dash px-3 text-[12px] font-medium text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
              >
                {proofreading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-lime-deep" />
                )}
                {proofreading ? "Checking…" : "Proofread"}
              </button>
              <button
                type="button"
                aria-pressed={showFormatting}
                onClick={() => setShowFormatting((visible) => !visible)}
                disabled={Boolean(busy) || proofreading}
                className={`flex min-h-10 cursor-pointer items-center rounded-full border px-3 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  showFormatting
                    ? "border-lime-deep bg-lime-pale text-ink"
                    : "border-dash text-inksoft hover:border-lime-deep hover:bg-lime-pale"
                }`}
              >
                Format
              </button>
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {!isPoll ? (
              <button
                type="button"
                aria-label="Add media"
                title={room > 0 ? `${room} attachment${room === 1 ? "" : "s"} available` : "Attachment limit reached"}
                disabled={room <= 0 || Boolean(busy) || postAudience !== "anyone"}
                onClick={() => mediaRef.current?.click()}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cream text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:text-faint"
              >
                <ImagePlus className="h-6 w-6" strokeWidth={1.8} />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Add to your post"
              onClick={() => setShowCategoryModal(true)}
              disabled={Boolean(busy)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-lime-soft text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:text-faint"
            >
              <Plus className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        open={audienceSettingsOpen}
        onClose={() => setAudienceSettingsOpen(false)}
        title={
          audiencePanel === "overview"
            ? "Post settings"
            : audiencePanel === "visibility"
              ? "Who can see your post?"
              : audiencePanel === "comments"
                ? "Comment settings"
                  : "Add collaborators"
        }
      >
        {audiencePanel === "overview" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-3">
              <Avatar initials={initials} src={me.avatarUrl} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                {me.name || "Your profile"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAudiencePanel("visibility")}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cream"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-pale text-ink">
                <Globe className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-ink">Who can see your post?</span>
                <span className="block truncate text-[11px] text-muted">
                  {audienceLabel}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
            <button
              type="button"
              onClick={() => setAudiencePanel("comments")}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cream"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-pale text-ink">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-ink">Who can comment on your post?</span>
                <span className="block truncate text-[11px] text-muted">
                  {commentAudience === "off"
                    ? "Off"
                    : commentAudience === "connections"
                      ? "Connections only"
                      : "Anyone"}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPeopleQuery("");
                setAudiencePanel("collaborators");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cream"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime-pale text-ink">
                <UserPlus className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-ink">Add collaborators</span>
                <span className="block truncate text-[11px] text-muted">
                  {collaborators.length ? `${collaborators.length} tagged` : "Tag up to 5 people"}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
            <div className="border-t border-line pt-3">
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-ink">
                  <Handshake className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-ink">Brand partnership</span>
                  <span className="block text-[10px] leading-snug text-muted">
                    Disclose when this post is made with a brand.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={brandPartnership}
                  onChange={(event) => {
                    setBrandPartnership(event.target.checked);
                    if (!event.target.checked) setBrandPartnerName("");
                  }}
                  className="h-4 w-4 accent-lime-deep"
                />
              </label>
              {brandPartnership ? (
                <input
                  value={brandPartnerName}
                  onChange={(event) => setBrandPartnerName(event.target.value.slice(0, 120))}
                  placeholder="Brand or partner name"
                  aria-label="Brand or partner name"
                  className={`${FORM_INPUT_CLASS} mt-2`}
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setAudienceSettingsOpen(false)}
              className="mt-2 w-full rounded-full bg-lime-pale px-4 py-3 text-[12px] font-semibold text-ink transition hover:bg-lime-soft"
            >
              Done
            </button>
          </div>
        ) : null}

        {audiencePanel !== "overview" ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                setAudiencePanel("overview")
              }
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 text-[11px] font-semibold text-inksoft hover:bg-cream"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        ) : null}

        {audiencePanel === "visibility" ? (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setPostAudience("anyone");
                setAudiencePanel("overview");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-cream"
            >
              <Globe className="ml-1 h-5 w-5 shrink-0 text-ink" />
              <span className="flex-1">
                <span className="block text-[13px] font-semibold text-ink">Anyone</span>
                <span className="block text-[10px] text-muted">Anyone on or off onWard</span>
              </span>
              {postAudience === "anyone" ? <Check className="h-5 w-5 text-lime-deep" /> : null}
            </button>
            <button
              type="button"
              disabled={Boolean(picks.length || documentFile)}
              onClick={() => {
                setPostAudience("connections");
                setAudiencePanel("overview");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Users className="ml-1 h-5 w-5 shrink-0 text-ink" />
              <span className="flex-1">
                <span className="block text-[13px] font-semibold text-ink">Connections only</span>
                <span className="block text-[10px] text-muted">People who mutually follow you</span>
              </span>
              {postAudience === "connections" ? <Check className="h-5 w-5 text-lime-deep" /> : null}
            </button>
            {picks.length || documentFile ? (
              <p className="px-2 pt-2 text-[10px] leading-relaxed text-muted">
                Private audiences are not available with media or document attachments yet.
              </p>
            ) : null}
          </div>
        ) : null}

        {audiencePanel === "comments" ? (
          <div className="space-y-1">
            {(
              [
                ["anyone", "Anyone", "Anyone who can view the post"],
                ["connections", "Connections only", "People who mutually follow you"],
                ["off", "Off", "No one can comment"],
              ] as const
            ).map(([value, label, description]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCommentAudience(value);
                  setAudiencePanel("overview");
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-cream"
              >
                <MessageCircle className="ml-1 h-5 w-5 shrink-0 text-ink" />
                <span className="flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{label}</span>
                  <span className="block text-[10px] text-muted">{description}</span>
                </span>
                {commentAudience === value ? <Check className="h-5 w-5 text-lime-deep" /> : null}
              </button>
            ))}
          </div>
        ) : null}

        {audiencePanel === "collaborators" ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 focus-within:border-lime-deep">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={peopleQuery}
                onChange={(event) => setPeopleQuery(event.target.value)}
                placeholder="Search for people"
                aria-label="Search for collaborators"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
              />
            </label>
            <p className="text-[10px] leading-relaxed text-muted">
              Tag up to five people. They’ll be credited on your post; they won’t be able to edit it.
            </p>
            {collaborators.length ? (
              <div className="flex flex-wrap gap-1.5">
                {collaborators.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() =>
                      setCollaborators((current) => current.filter((item) => item.id !== person.id))
                    }
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-lime-pale px-2.5 py-1.5 text-[10px] font-semibold text-ink"
                  >
                    {person.name}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="max-h-56 overflow-y-auto">
              {peopleLoading ? (
                <p className="py-5 text-center text-[11px] text-muted">Searching…</p>
              ) : peopleResults.length ? (
                peopleResults.map((person) => {
                  const selected = collaborators.some((item) => item.id === person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      disabled={!selected && collaborators.length >= 5}
                      onClick={() =>
                        setCollaborators((current) =>
                          selected
                            ? current.filter((item) => item.id !== person.id)
                            : [...current, person],
                        )
                      }
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Avatar initials={person.initials} src={person.avatarUrl} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-ink">{person.name}</span>
                        {person.role ? (
                          <span className="block truncate text-[9px] text-muted">{person.role}</span>
                        ) : null}
                      </span>
                      {selected ? <Check className="h-4 w-4 text-lime-deep" /> : null}
                    </button>
                  );
                })
              ) : (
                <p className="py-5 text-center text-[11px] text-muted">No people found.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAudiencePanel("overview")}
              className="w-full rounded-full bg-lime-pale px-4 py-3 text-[12px] font-semibold text-ink hover:bg-lime-soft"
            >
              Done
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add to your post"
      >
        <div className="grid grid-cols-2 gap-2">
          {POST_CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              disabled={Boolean(busy) || (id === "media" && room <= 0)}
              onClick={() => chooseCategory(id)}
              className="flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-cream px-3 py-3 text-[11px] font-semibold text-inksoft transition hover:border-lime-deep hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="h-5 w-5 text-lime-deep" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] leading-[1.5] text-muted">
          Choose a format to share professional milestones, opportunities, and knowledge.
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
