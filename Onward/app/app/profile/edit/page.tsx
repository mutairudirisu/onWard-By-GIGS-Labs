"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button, Field, TextArea, TextInput } from "@/components/ui";
import { useAuth, useCurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, updateProfile, changeEmail } = useAuth();
  const profile = useCurrentUser();
  const { skills, addSkill } = useStore();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The profile card links here asking for the bio alone, so it should arrive in the
  // bio, not at the top of a long form. Read from the location rather than
  // useSearchParams so the page stays a plain client render.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("field") !== "bio") return;
    (document.getElementById("profile-bio") as HTMLTextAreaElement | null)?.focus();
  }, []);

  function commitSkill() {
    const skill = skillDraft.trim();
    if (!skill) return;
    addSkill(skill);
    setSkillDraft("");
    setShowSkillInput(false);
  }

  async function save() {
    setBusy(true);
    setError("");
    const result = await updateProfile({
      displayName: name.trim() || profile.name,
      location: location.trim(),
      bio: bio.trim(),
    });
    let emailError = "";
    const nextEmail = email.trim();
    if (!result.error && nextEmail && nextEmail !== authUser?.email) {
      emailError = (await changeEmail(nextEmail)).error ?? "";
    }
    setBusy(false);
    if (result.error || emailError) {
      setError(result.error || emailError);
      return;
    }
    router.push("/profile");
  }

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Edit profile</h1>
      </div>

      <div className="mb-5 flex items-center gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full bg-lime-soft object-cover"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-soft text-[15px] font-bold text-ink">
            {profile.initials}
          </span>
        )}
        <p className="text-[10px] leading-[1.5] text-muted">
          {profile.avatarUrl
            ? "Your Google photo is your avatar."
            : "Your avatar uses your initials."}
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Full name" uppercase>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>

        <Field label="Email" uppercase>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field label="Role" uppercase>
          <Link
            href="/profile/role"
            className="field-input flex items-center justify-between text-left"
          >
            <span className="text-ink">{profile.role || "Not set"}</span>
            <span className="text-[10px] font-semibold text-lime-deep">Change</span>
          </Link>
        </Field>

        <Field label="Location" uppercase>
          <TextInput
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="London, UK · Open to hybrid work"
            maxLength={80}
          />
        </Field>

        <Field label="About you" uppercase>
          <TextArea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What kind of work do you do, and what do you want next?"
            maxLength={280}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            My skills
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-lime-soft px-2.5 py-1 text-[10px] font-semibold text-ink"
              >
                {s}
              </span>
            ))}
            {!showSkillInput ? (
              <button
                type="button"
                onClick={() => setShowSkillInput(true)}
                className="tag border border-dashed border-dash bg-transparent py-1"
              >
                + Add skill
              </button>
            ) : null}
          </div>

          {showSkillInput ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                autoFocus
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSkill();
                  if (e.key === "Escape") {
                    setShowSkillInput(false);
                    setSkillDraft("");
                  }
                }}
                placeholder="Type a skill"
                className="field-input flex-1"
                aria-label="New skill"
              />
              <button
                type="button"
                onClick={commitSkill}
                className="rounded-btn bg-lime px-3 py-2 text-[11px] font-bold text-dark"
              >
                Add
              </button>
            </div>
          ) : null}

          <p className="mt-2 text-[9px] text-muted">
            Anything you tag on an onWard lands here too.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-[1.5] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </PhoneShell>
  );
}
