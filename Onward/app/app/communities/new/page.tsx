"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Hash, Lightbulb, LockKeyhole, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import { COMMUNITY_TOPICS, createCommunity, type CommunityTopic } from "@/lib/db";

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
  const { user, ready } = useAuth();
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [topic, setTopic] = useState<CommunityTopic>("Technology");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const slug = useMemo(() => communitySlug(name), [name]);

  const stepProblem = () => {
    if (step === 0 && idea.trim().length < 15) return "Write at least 15 characters to describe the idea.";
    if (step === 2 && name.trim().length < 3) return "Community names need at least 3 characters.";
    if (step === 2 && !slug) return "Use letters or numbers in the community name.";
    if (step === 3 && description.trim().length < 15) return "Write at least 15 characters for the description.";
    return "";
  };

  const continueStep = () => {
    const problem = stepProblem();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
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
        description: description.trim(),
        idea: idea.trim(),
      });
      router.replace(`/communities/${community.slug}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create this community.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <PhoneShell tab="feed">
        <div className="card animate-pulse p-8 text-center text-[11px] text-muted">Loading…</div>
      </PhoneShell>
    );
  }

  if (!user) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-5 py-10 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
          <h1 className="mt-2 text-[15px] font-bold text-ink">Sign in to create a community</h1>
          <Link href="/sign-in" className="mt-4 inline-flex rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-white">
            Sign in
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed">
      <main className="-mx-5 w-[calc(100%+2.5rem)] max-w-[620px] md:mx-auto md:w-full">
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/communities"
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold text-muted hover:bg-paper hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Communities
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-muted">
            <LockKeyhole className="h-3.5 w-3.5" /> Your idea stays private
          </span>
        </header>

        <section className="card overflow-hidden">
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
            <div className="mt-5 grid grid-cols-4 gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
              {STEPS.map((label, index) => (
                <div key={label}>
                  <div className={`h-1 rounded-full ${index <= step ? "bg-lime-deep" : "bg-line"}`} />
                  <span className={`mt-1.5 block text-[8.5px] font-semibold ${index === step ? "text-ink" : "text-muted"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
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
                  placeholder="I want to bring together people who…"
                  className="mt-2 w-full resize-y rounded-xl border border-line bg-cream px-3 py-3 text-[11px] leading-[1.6] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                />
                <div className="mt-1 flex justify-between text-[9px] text-muted">
                  <span>Only you can see this note.</span>
                  <span>{idea.trim().length}/1000</span>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h2 className="text-[15px] font-bold text-ink">Choose a topic</h2>
                <p className="mt-1 text-[10px] leading-[1.6] text-muted">
                  This helps people discover your community.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {COMMUNITY_TOPICS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={topic === item}
                      onClick={() => setTopic(item)}
                      className={`flex min-h-[58px] cursor-pointer items-center justify-between rounded-xl border px-3 text-left text-[10px] font-semibold transition ${
                        topic === item
                          ? "border-lime-deep bg-lime-pale text-ink"
                          : "border-line bg-paper text-inksoft hover:border-lime"
                      }`}
                    >
                      {item}
                      {topic === item ? <Check className="h-4 w-4 text-lime-deep" /> : null}
                    </button>
                  ))}
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
                      <p className="text-[9px] text-muted">{topic} · Public</p>
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

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep((current) => Math.max(0, current - 1));
                }}
                disabled={step === 0 || busy}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold text-muted hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={continueStep}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-lime-deep px-5 text-[10px] font-bold text-white hover:bg-ink"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-lime-deep px-5 text-[10px] font-bold text-white hover:bg-ink disabled:cursor-wait disabled:opacity-60"
                >
                  <Check className="h-4 w-4" /> {busy ? "Creating…" : "Create community"}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </PhoneShell>
  );
}
