"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { BackLink, Button, Field, TextArea, TextInput } from "@/components/ui";
import { useAuth, useCurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";
import { toastError, toastSuccess } from "@/components/toast";
import { uploadAvatar } from "@/lib/db";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // The preview is a local blob: let it go once the saved photo takes over.
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

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

  // The photo saves on its own, the moment it is picked - it is not part of the
  // form below, so leaving without Save still keeps the new face.
  async function pickPhoto(list: FileList | null) {
    const file = list?.[0];
    if (!file || !authUser || avatarBusy) return;
    if (!file.type.startsWith("image/")) {
      toastError("Pick an image for your photo");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("Keep the photo under 5MB");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(authUser.id, file);
      const result = await updateProfile({ avatarUrl: url });
      setPhotoPreview(null);
      if (result.error) {
        toastError(result.error);
        return;
      }
      toastSuccess("Photo updated");
    } catch {
      setPhotoPreview(null);
      toastError("Couldn't upload that photo");
    } finally {
      setAvatarBusy(false);
    }
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
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarBusy}
          aria-label={avatarBusy ? "Uploading profile photo" : "Edit profile photo"}
          className="group relative shrink-0 cursor-pointer rounded-full disabled:cursor-wait"
        >
          <Avatar initials={profile.initials} src={photoPreview ?? profile.avatarUrl} size="md" />
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-lime text-dark shadow-md transition group-hover:bg-lime-deep">
            {avatarBusy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Pencil className="h-3 w-3" strokeWidth={2.2} />
            )}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="mt-1.5 text-[10px] leading-[1.5] text-muted">
            {avatarBusy
              ? "Uploading your photo…"
              : profile.avatarUrl
              ? "This is the face people see on your posts and profile."
              : "Tap your photo to add one."}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Profile photo"
          className="hidden"
          onChange={(event) => {
            void pickPhoto(event.target.files);
            event.target.value = "";
          }}
        />
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
