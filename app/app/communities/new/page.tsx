"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Globe,
  Hash,
  Lightbulb,
  LockKeyhole,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { CommunityIcon, CommunityTopicIcon } from "@/components/communities/community-card";
import { PhoneShell } from "@/components/layout/phone-shell";
import { useSmartBack, useTrackedReplace } from "@/components/providers/navigation-history";
import { Toggle } from "@/components/ui/ui";
import { Wordmark } from "@/components/ui/wordmark";
import {
  COMMUNITY_SUBCATEGORIES,
  COMMUNITY_TOPICS,
  addCommunitySubcategory,
  addCommunityTopic,
  COMMUNITY_TYPE_OPTIONS,
  createCommunity,
  defaultCommunityTaxonomy,
  fetchCommunityTaxonomy,
  type CommunitySubcategory,
  type CommunityTaxonomy,
  type CommunityTopic,
  type CommunityType,
} from "@/lib/db";

const STEPS = ["Idea", "Topic", "Name", "Description"];

function communitySlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export default function NewCommunityPage() {
  const router = useRouter();
  const smartBack = useSmartBack("/communities");
  const trackedReplace = useTrackedReplace();
  const { user, ready } = useAuth();
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [topic, setTopic] = useState<CommunityTopic>("Technology");
  const [subcategory, setSubcategory] = useState<CommunitySubcategory>("General");
  const [taxonomy, setTaxonomy] = useState<CommunityTaxonomy>(defaultCommunityTaxonomy);
  const [taxonomyError, setTaxonomyError] = useState("");
  const [topicDraft, setTopicDraft] = useState("");
  const [subcategoryDraft, setSubcategoryDraft] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [showSubcategoryInput, setShowSubcategoryInput] = useState(false);
  const [taxonomyBusy, setTaxonomyBusy] = useState<"topic" | "subcategory" | null>(null);
  const [communityType, setCommunityType] = useState<CommunityType>("public");
  const [isMature, setIsMature] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const slug = useMemo(() => communitySlug(name), [name]);
  const subcategories = taxonomy.subcategories[topic] ?? [];

  useEffect(() => {
    let cancelled = false;
    fetchCommunityTaxonomy()
      .then((next) => {
        if (!cancelled) setTaxonomy(next);
      })
      .catch((reason) => {
        if (!cancelled) {
          setTaxonomyError(
            reason instanceof Error ? reason.message : "Could not load community topics.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!typeSheetOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTypeSheetOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [typeSheetOpen]);

  const stepProblem = () => {
    if (step === 0 && idea.trim().length < 15) return "Write at least 15 characters to describe the idea.";
    if (step === 2 && name.trim().length < 3) return "Community names need at least 3 characters.";
    if (step === 2 && !slug) return "Use letters or numbers in the community name.";
    if (step === 3 && description.trim().length < 15) return "Write at least 15 characters for the description.";
    return "";
  };

  const canContinue = !stepProblem() && !busy && !taxonomyBusy;
  const selectedType = COMMUNITY_TYPE_OPTIONS.find((option) => option.value === communityType);

  const continueStep = () => {
    const problem = stepProblem();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const addTopic = async () => {
    const value = topicDraft.trim().replace(/\s+/g, " ");
    if (value.length < 2 || value.length > 50) {
      setError("Topics must be 2 to 50 characters long.");
      return;
    }
    setTaxonomyBusy("topic");
    setError("");
    try {
      const addedTopic = await addCommunityTopic(value);
      setTaxonomy(await fetchCommunityTaxonomy());
      setTopic(addedTopic);
      setSubcategory("General");
      setTopicDraft("");
      setShowTopicInput(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add that topic.");
    } finally {
      setTaxonomyBusy(null);
    }
  };

  const addSubcategory = async () => {
    const value = subcategoryDraft.trim().replace(/\s+/g, " ");
    if (value.length < 3 || value.length > 50) {
      setError("Subcategories must be 3 to 50 characters long.");
      return;
    }
    setTaxonomyBusy("subcategory");
    setError("");
    try {
      const addedSubcategory = await addCommunitySubcategory(topic, value);
      setTaxonomy(await fetchCommunityTaxonomy());
      setSubcategory(addedSubcategory);
      setSubcategoryDraft("");
      setShowSubcategoryInput(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add that subcategory.");
    } finally {
      setTaxonomyBusy(null);
    }
  };

  const submit = async () => {
    const problem = stepProblem();
    if (problem) {
      setError(problem);
      return;
    }
    if (!user) {
      setError("Sign in to create a community.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const community = await createCommunity({
        name: name.trim(),
        slug,
        topic,
        subcategory,
        communityType,
        isMature,
        description: description.trim(),
        idea: idea.trim(),
      });
      trackedReplace(`/communities/${community.slug}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create this community.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <PhoneShell indicator={false}>
        <div className="card animate-pulse p-8 text-center text-[11px] text-muted">Loading…</div>
      </PhoneShell>
    );
  }

  if (!user) {
    return (
      <PhoneShell indicator={false}>
        <div className="card px-5 py-10 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
          <h1 className="mt-2 text-[15px] font-bold text-ink">Sign in to create a community</h1>
          <Link href="/sign-in" className="mt-4 inline-flex rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-dark">
            Sign in
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell indicator={false}>
      <main className="-mx-5 -mt-5 w-[calc(100%+2.5rem)] max-w-[620px] pb-28 md:mx-auto md:mt-0 md:w-full md:pb-0">
        <header className="border-b border-line px-4 pb-3 pt-2 md:mb-5 md:border-0 md:px-0 md:pb-0 md:pt-0">
          <div className="relative flex h-8 items-center justify-between">
            <button
              type="button"
              aria-label={step === 0 ? "Back to communities" : "Previous step"}
              onClick={() => {
                setError("");
                if (step === 0) smartBack();
                else setStep((current) => current - 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-paper"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Wordmark className="absolute left-1/2 -translate-x-1/2 text-[16px]" />
            <span className="h-8 w-8" aria-hidden="true" />
          </div>
          <div
            className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label={`Step ${step + 1} of ${STEPS.length}`}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            <div
              className="h-full rounded-full bg-lime-deep transition-[width] duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </header>

        <section>
          <div className="border-b border-line px-5 py-5 sm:px-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-lime-deep">
              Build a community
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight text-ink">
              Start with what brings people together
            </h1>
            <p className="mt-1 text-[10.5px] leading-[1.6] text-muted">
              A few details help the right people find their way in.
            </p>
          </div>

          <div className="min-h-[320px] px-5 py-6 sm:px-7">
            {step === 0 ? (
              <div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-pale text-lime-deep">
                    <Lightbulb className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink">What do you want to bring to life?</h2>
                    <p className="mt-1 text-[10px] leading-[1.6] text-muted">
                      Start with the problem, interest, or goal you want people to share.
                    </p>
                  </div>
                </div>
                <label className="mt-5 block text-[10px] font-semibold text-ink" htmlFor="community-idea">
                  Your starting idea
                </label>
                <textarea
                  id="community-idea"
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Community idea"
                  className="mt-2 w-full resize-y rounded-xl border border-line bg-cream px-3 py-3 text-[11px] leading-[1.6] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                />
                <div className="mt-1 flex justify-between text-[9px] text-muted">
                  <span>Visible to everyone on the Learn about page. At least 15 characters.</span>
                  <span>{idea.trim().length}/1000</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTypeSheetOpen(true)}
                  className="mt-6 flex w-full items-center gap-3 border-t border-line pt-4 text-left"
                  aria-haspopup="dialog"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
                    {communityType === "public" ? (
                      <Globe className="h-5 w-5" />
                    ) : communityType === "restricted" ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <LockKeyhole className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-ink">Community Type</span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {selectedType?.label ?? "Public"} and {isMature ? "Mature 18+" : "Safe for Everyone"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </button>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h2 className="text-[15px] font-bold text-ink">Choose a topic</h2>
                <p className="mt-1 text-[10px] leading-[1.6] text-muted">
                  This helps people discover your community.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {taxonomy.topics.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={topic === item}
                      onClick={() => {
                        setTopic(item);
                        setSubcategory("General");
                      }}
                      className={`flex min-h-[58px] cursor-pointer items-center justify-between rounded-xl border px-3 text-left text-[10px] font-semibold transition ${
                        topic === item
                          ? "border-lime-deep bg-lime-pale text-ink"
                          : "border-line bg-paper text-inksoft hover:border-lime"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CommunityTopicIcon
                          topic={item}
                          className={`h-4 w-4 shrink-0 ${topic === item ? "text-lime-deep" : "text-muted"}`}
                        />
                        {item}
                      </span>
                      {topic === item ? <Check className="h-4 w-4 text-lime-deep" /> : null}
                    </button>
                  ))}
                  {!showTopicInput ? (
                    <button
                      type="button"
                      onClick={() => setShowTopicInput(true)}
                      className="flex min-h-[58px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-line px-3 text-[10px] font-semibold text-lime-deep transition hover:border-lime-deep"
                    >
                      + Add a topic
                    </button>
                  ) : null}
                </div>
                {showTopicInput ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      value={topicDraft}
                      onChange={(event) => setTopicDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void addTopic();
                        if (event.key === "Escape") setShowTopicInput(false);
                      }}
                      maxLength={50}
                      placeholder="e.g. Science"
                      aria-label="New topic"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 text-[10px] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                    />
                    <button
                      type="button"
                      onClick={() => void addTopic()}
                      disabled={taxonomyBusy !== null}
                      className="rounded-xl bg-lime-deep px-3 text-[10px] font-bold text-dark disabled:opacity-50"
                    >
                      {taxonomyBusy === "topic" ? "Adding…" : "Add"}
                    </button>
                  </div>
                ) : null}
                <p className="mt-1.5 text-[9px] text-muted">
                  New topics are shared so other communities can use them too.
                </p>
                {taxonomyError ? (
                  <p role="alert" className="mt-2 text-[9px] text-danger">{taxonomyError}</p>
                ) : null}
                <div className="mt-5">
                  <h3 className="text-[11px] font-bold text-ink">Choose a subcategory</h3>
                  <p className="mt-1 text-[9px] text-muted">
                    This helps members find the right communities.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subcategories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={subcategory === item}
                        onClick={() => setSubcategory(item)}
                        className={`cursor-pointer rounded-full border px-3 py-2 text-[9px] font-semibold transition ${
                          subcategory === item
                            ? "border-lime-deep bg-lime-pale text-ink"
                            : "border-line bg-paper text-muted hover:border-lime-deep/50 hover:text-ink"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryInput((current) => !current)}
                      className="cursor-pointer rounded-full border border-dashed border-line px-3 py-2 text-[9px] font-semibold text-lime-deep transition hover:border-lime-deep"
                    >
                      + Add a subcategory
                    </button>
                  </div>
                  {showSubcategoryInput ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        autoFocus
                        value={subcategoryDraft}
                        onChange={(event) => setSubcategoryDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void addSubcategory();
                          if (event.key === "Escape") setShowSubcategoryInput(false);
                        }}
                        maxLength={50}
                        placeholder="e.g. Astronomy"
                        aria-label="New subcategory"
                        className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 text-[10px] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                      />
                      <button
                        type="button"
                        onClick={() => void addSubcategory()}
                        disabled={taxonomyBusy !== null}
                        className="rounded-xl bg-lime-deep px-3 text-[10px] font-bold text-dark disabled:opacity-50"
                      >
                        {taxonomyBusy === "subcategory" ? "Adding…" : "Add"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <div className="flex items-start gap-3">
                  <CommunityIcon />
                  <div>
                    <h2 className="text-[15px] font-bold text-ink">Give it a name</h2>
                    <p className="mt-1 text-[10px] leading-[1.6] text-muted">
                      Choose a name people can remember and find.
                    </p>
                  </div>
                </div>
                <label className="mt-5 block text-[10px] font-semibold text-ink" htmlFor="community-name">
                  Community name
                </label>
                <input
                  id="community-name"
                  type="text"
                  autoComplete="off"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  placeholder="e.g. Early Career Designers"
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-cream px-3 text-[11px] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                />
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-[10px] text-muted">
                  <Hash className="h-4 w-4 text-lime-deep" />
                  <span className="truncate">onward/{slug || "your-community-name"}</span>
                </div>
                <p className="mt-2 text-[9px] leading-[1.5] text-muted">
                  Names are public. The link will use lowercase letters, numbers, and hyphens.
                </p>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <h2 className="text-[15px] font-bold text-ink">Tell people what it’s about</h2>
                <p className="mt-1 text-[10px] leading-[1.6] text-muted">
                  This public description helps new members know what to expect.
                </p>
                <label className="mt-5 block text-[10px] font-semibold text-ink" htmlFor="community-description">
                  Community description
                </label>
                <textarea
                  id="community-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  rows={5}
                  placeholder="A welcoming space for people who…"
                  className="mt-2 w-full resize-y rounded-xl border border-line bg-cream px-3 py-3 text-[11px] leading-[1.6] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                />
                <div className="mt-1 flex justify-between text-[9px] text-muted">
                  <span>Visible to everyone.</span>
                  <span>{description.trim().length}/500</span>
                </div>
                <div className="mt-5 rounded-xl bg-lime-pale/70 p-3">
                  <div className="flex items-center gap-2">
                    <CommunityIcon />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-ink">{name || "Your community"}</p>
                      <p className="inline-flex items-center gap-1 text-[9px] text-muted">
                        <CommunityTopicIcon topic={topic} className="h-3 w-3" />
                        {topic} · {subcategory} · {selectedType?.label ?? "Public"}{isMature ? " · 18+" : ""}
                      </p>
                    </div>
                  </div>
                  {description.trim() ? (
                    <p className="mt-2 text-[9.5px] leading-[1.5] text-inksoft">{description}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-4 rounded-lg bg-danger/5 px-3 py-2 text-[10px] text-danger">
                {error}
              </p>
            ) : null}

          </div>
        </section>
      </main>
      <footer
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full border-t border-line bg-paper px-5 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:static md:max-w-[620px] md:border-0 md:px-0 md:pt-4 md:shadow-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <button
          type="button"
          onClick={step === STEPS.length - 1 ? submit : continueStep}
          disabled={!canContinue}
          className={`h-14 w-full rounded-full text-[13px] font-bold transition ${
            canContinue
              ? "bg-lime text-dark hover:bg-lime-deep"
              : "cursor-not-allowed bg-line text-muted"
          }`}
        >
          {step === STEPS.length - 1
            ? busy
              ? "Creating…"
              : "Create community"
            : "Continue"}
        </button>
      </footer>
      {typeSheetOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-dark/50 md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-type-title"
        >
          <button
            type="button"
            aria-label="Close community type settings"
            className="absolute inset-0 cursor-default"
            onClick={() => setTypeSheetOpen(false)}
          />
          <section className="relative max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] bg-paper px-5 pb-6 pt-3 shadow-lift md:rounded-3xl md:px-7">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="community-type-title" className="text-[22px] font-bold tracking-tight text-ink">
                  Community Type
                </h2>
                <p className="mt-1 text-[10.5px] leading-[1.6] text-muted">
                  Choose who your community is intended for.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTypeSheetOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-paper"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 divide-y divide-line">
              {COMMUNITY_TYPE_OPTIONS.map((option) => {
                const selected = communityType === option.value;
                const Icon =
                  option.value === "public" ? Globe : option.value === "restricted" ? Eye : LockKeyhole;
                const description =
                  option.value === "public"
                    ? "Anyone can find and view this community."
                    : option.value === "restricted"
                      ? "Intended for anyone to view, with contributions limited to approved members."
                      : "Intended for approved members only.";
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCommunityType(option.value)}
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-[1.5] text-muted">{description}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-lime-deep" : "border-line"
                      }`}
                    >
                      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-lime-deep" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1 flex items-center gap-3 border-t border-line py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink">Mature 18+</span>
                <span className="mt-0.5 block text-[10px] leading-[1.5] text-muted">
                  Mark this community as intended for adults 18 and over.
                </span>
              </span>
              <Toggle
                checked={isMature}
                onChange={setIsMature}
                label="Mark this community as mature, for adults 18 and over"
              />
            </div>
            <p className="mb-4 text-[9.5px] leading-[1.5] text-muted">
              These settings are saved with your community. Access and age restrictions are not enforced yet.
            </p>
            <button
              type="button"
              onClick={() => setTypeSheetOpen(false)}
              className="h-12 w-full rounded-full bg-ink text-[12px] font-bold text-paper transition hover:bg-ink/90"
            >
              Save
            </button>
          </section>
        </div>
      ) : null}
    </PhoneShell>
  );
}
