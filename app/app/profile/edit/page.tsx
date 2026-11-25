"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { PhoneShell } from "@/components/layout/phone-shell";
import { Avatar } from "@/components/feed/feed-post";
import { Modal } from "@/components/ui/modal";
import { BackLink, Button, Field, TextArea, TextInput, Toggle } from "@/components/ui/ui";
import { useAuth, useCurrentUser } from "@/components/providers/auth";
import { useStore } from "@/components/providers/store";
import { toastError, toastSuccess } from "@/components/ui/toast";
import {
  fetchNetworkProfileDetails,
  saveNetworkProfileDetails,
  uploadAvatar,
  type NetworkProfileDetails,
} from "@/lib/db";

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, profile: authProfile, updateProfile, changeEmail } = useAuth();
  const profile = useCurrentUser();
  const { skills, addSkill } = useStore();

  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username ?? "");
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [networkDetails, setNetworkDetails] = useState<NetworkProfileDetails | null>(null);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const cropStageRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const initializedFor = useRef<string | null>(null);
  const editedFields = useRef(new Set<string>());

  useEffect(() => {
    if (!authUser || !authProfile || authProfile.id !== authUser.id) return;
    if (initializedFor.current && initializedFor.current !== authUser.id) {
      editedFields.current.clear();
    }
    initializedFor.current = authUser.id;
    if (!editedFields.current.has("name")) setName(authProfile.displayName);
    if (!editedFields.current.has("username")) setUsername(authProfile.username ?? "");
    if (!editedFields.current.has("email")) setEmail(authUser.email ?? "");
    if (!editedFields.current.has("location")) setLocation(authProfile.location);
    if (!editedFields.current.has("bio")) setBio(authProfile.bio);
  }, [authProfile, authUser]);

  useEffect(() => {
    if (!authUser) {
      setNetworkDetails(null);
      return;
    }
    setNetworkDetails(null);
    let cancelled = false;
    void fetchNetworkProfileDetails(authUser.id)
      .then((details) => {
        if (!cancelled) setNetworkDetails(details);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          toastError(
            loadError instanceof Error
              ? loadError.message
              : "Couldn't load your network information.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // The preview is a local blob: let it go once the saved photo takes over.
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    if (!cropUrl) return;
    return () => URL.revokeObjectURL(cropUrl);
  }, [cropUrl]);

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

  async function pickPhoto(list: FileList | null) {
    const file = list?.[0];
    if (!file || avatarBusy) return;
    if (!file.type.startsWith("image/")) {
      toastError("Pick an image for your photo");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("Keep the photo under 5MB");
      return;
    }
    setCropFile(file);
    setCropUrl(URL.createObjectURL(file));
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setImageSize(null);
  }

  function closeCrop() {
    if (avatarBusy) return;
    setCropFile(null);
    setCropUrl(null);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setImageSize(null);
  }

  function clampOffset(offset: { x: number; y: number }, scale: number) {
    const stage = cropStageRef.current?.getBoundingClientRect();
    if (!stage || !imageSize) return offset;
    const fitScale = Math.max(stage.width / imageSize.width, stage.height / imageSize.height);
    const maxX = Math.max(0, (imageSize.width * fitScale * scale - stage.width) / 2);
    const maxY = Math.max(0, (imageSize.height * fitScale * scale - stage.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    };
  }

  function startCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (!imageSize || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    };
    setDragging(true);
  }

  function moveCrop(event: PointerEvent<HTMLDivElement>) {
    const origin = dragOrigin.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    setCropOffset(
      clampOffset(
        {
          x: origin.offsetX + event.clientX - origin.clientX,
          y: origin.offsetY + event.clientY - origin.clientY,
        },
        cropScale,
      ),
    );
  }

  function stopCropDrag() {
    dragOrigin.current = null;
    setDragging(false);
  }

  async function croppedPhoto(): Promise<File> {
    if (!cropUrl) throw new Error("Choose a photo to crop.");
    const image = new Image();
    image.src = cropUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This photo could not be opened."));
    });

    const stage = cropStageRef.current?.getBoundingClientRect();
    if (!stage?.width) throw new Error("The photo crop area is not ready.");
    const fitScale = Math.max(stage.width / image.naturalWidth, stage.height / image.naturalHeight);
    const sourceScale = fitScale * cropScale;
    const sourceSize = stage.width / sourceScale;
    const sourceX = (image.naturalWidth - sourceSize) / 2 - cropOffset.x / sourceScale;
    const sourceY = (image.naturalHeight - sourceSize) / 2 - cropOffset.y / sourceScale;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The photo could not be prepared.");
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) throw new Error("The photo could not be prepared.");
    return new File([blob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() });
  }

  async function savePhoto() {
    if (!cropFile || !authUser || avatarBusy) return;
    setAvatarBusy(true);
    try {
      const file = await croppedPhoto();
      setPhotoPreview(URL.createObjectURL(file));
      const url = await uploadAvatar(authUser.id, file);
      const result = await updateProfile({ avatarUrl: url });
      if (result.error) throw new Error(result.error);
      setCropFile(null);
      setCropUrl(null);
      setCropScale(1);
      setCropOffset({ x: 0, y: 0 });
      setImageSize(null);
      toastSuccess("Photo updated");
    } catch (error) {
      setPhotoPreview(null);
      toastError(error instanceof Error ? error.message : "Couldn't upload that photo");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function save() {
    const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
    if (normalizedUsername && !/^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/.test(normalizedUsername)) {
      setError(
        "Use 3-20 letters, numbers, periods, or underscores. Start and end with a letter or number.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const result = await updateProfile({
      displayName: name.trim() || profile.name,
      username: normalizedUsername || null,
      location: location.trim(),
      bio: bio.trim(),
    });
    if (!result.error && networkDetails) {
      try {
        await saveNetworkProfileDetails(networkDetails);
      } catch (saveError) {
        setBusy(false);
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Couldn't save your network information.",
        );
        return;
      }
    }
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
              ? "Tap your photo to edit, crop and save it."
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
        <Field label="Full Name" uppercase>
          <TextInput
            value={name}
            onChange={(e) => {
              editedFields.current.add("name");
              setName(e.target.value);
            }}
            maxLength={80}
          />
          <p className="mt-1.5 text-[10px] leading-[1.5] text-muted">
            Use the name you want people to see on your profile.
          </p>
        </Field>

        <Field label="Username" uppercase>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              @
            </span>
            <TextInput
              value={username}
              onChange={(e) => {
                editedFields.current.add("username");
                setUsername(e.target.value.replace(/^@/, "").toLowerCase());
              }}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="yourname"
              className="pl-8"
              aria-label="Username"
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-[1.5] text-muted">
            Optional. Choose a unique username to display on your profile.
          </p>
        </Field>

        <Field label="Email" uppercase>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => {
              editedFields.current.add("email");
              setEmail(e.target.value);
            }}
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
            onChange={(e) => {
              editedFields.current.add("location");
              setLocation(e.target.value);
            }}
            placeholder="London, UK · Open to hybrid work"
            maxLength={80}
          />
        </Field>

        <Field label="About you" uppercase>
          <TextArea
            id="profile-bio"
            value={bio}
            onChange={(e) => {
              editedFields.current.add("bio");
              setBio(e.target.value);
            }}
            placeholder="What kind of work do you do, and what do you want next?"
            maxLength={280}
          />
        </Field>

        <section className="space-y-4 rounded-2xl border border-line bg-paper p-4">
          <div>
            <h2 className="text-[13px] font-bold text-ink">Network information</h2>
            <p className="mt-1 text-[10px] leading-[1.5] text-muted">
              These details improve suggestions. School information stays off your public profile.
            </p>
          </div>
          {networkDetails ? (
            <>
              <Field label="School or institution" uppercase>
                <TextInput
                  value={networkDetails.school}
                  onChange={(event) =>
                    setNetworkDetails({ ...networkDetails, school: event.target.value })
                  }
                  maxLength={160}
                  placeholder="School, college or university"
                />
              </Field>
              <Field label="Birthday" uppercase>
                <TextInput
                  type="date"
                  value={networkDetails.birthday}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    setNetworkDetails({ ...networkDetails, birthday: event.target.value })
                  }
                />
              </Field>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] leading-[1.5] text-inksoft">
                  Share birthday with connections
                  <span className="mt-0.5 block text-[9px] text-muted">
                    Your birth year is never shown.
                  </span>
                </span>
                <Toggle
                  checked={networkDetails.shareBirthday}
                  onChange={(shareBirthday) =>
                    setNetworkDetails({ ...networkDetails, shareBirthday })
                  }
                  label="Share birthday with connections"
                />
              </div>
              <Field label="Current employer" uppercase>
                <TextInput
                  value={networkDetails.currentEmployer}
                  onChange={(event) =>
                    setNetworkDetails({ ...networkDetails, currentEmployer: event.target.value })
                  }
                  maxLength={160}
                  placeholder="Company or organization"
                />
              </Field>
              <Field label="Started at this employer" uppercase>
                <TextInput
                  type="date"
                  value={networkDetails.employmentStartDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    setNetworkDetails({
                      ...networkDetails,
                      employmentStartDate: event.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] leading-[1.5] text-inksoft">
                  Share work milestones
                  <span className="mt-0.5 block text-[9px] text-muted">
                    Job changes and anniversaries are visible only to connections.
                  </span>
                </span>
                <Toggle
                  checked={networkDetails.shareWorkEvents}
                  onChange={(shareWorkEvents) =>
                    setNetworkDetails({ ...networkDetails, shareWorkEvents })
                  }
                  label="Share work milestones with connections"
                />
              </div>
            </>
          ) : (
            <p className="text-[10px] text-muted">Loading your network details…</p>
          )}
        </section>

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
        <Button onClick={save} disabled={busy || !networkDetails}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Modal open={Boolean(cropUrl)} onClose={closeCrop} title="Crop profile photo">
        <div className="flex flex-col items-center">
          <p className="mb-3 text-center text-[11px] leading-[1.5] text-muted">
            Drag to position your photo, then adjust the zoom.
          </p>
          <div
            ref={cropStageRef}
            className={`relative aspect-square w-72 max-w-full touch-none overflow-hidden rounded-full bg-cream ${
              imageSize ? (dragging ? "cursor-grabbing" : "cursor-grab") : "animate-pulse"
            }`}
            style={{ touchAction: "none" }}
            onPointerDown={startCropDrag}
            onPointerMove={moveCrop}
            onPointerUp={stopCropDrag}
            onPointerCancel={stopCropDrag}
          >
            {cropUrl ? (
              <img
                src={cropUrl}
                alt="Profile photo crop preview"
                draggable={false}
                onLoad={(event) =>
                  setImageSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                onError={() => toastError("This photo could not be opened. Try another image.")}
                className="h-full w-full select-none object-cover"
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                  transformOrigin: "center",
                }}
              />
            ) : null}
          </div>
          <label className="mt-5 w-full max-w-xs">
            <span className="mb-2 block text-[10px] font-semibold text-muted">Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={cropScale}
              aria-label="Zoom profile photo"
              disabled={!imageSize || avatarBusy}
              onChange={(event) => {
                const nextScale = Number(event.target.value);
                setCropScale(nextScale);
                setCropOffset((current) => clampOffset(current, nextScale));
              }}
              className="w-full accent-lime-deep"
            />
          </label>
          <div className="mt-5 flex w-full gap-2">
            <button
              type="button"
              onClick={closeCrop}
              disabled={avatarBusy}
              className="flex-1 rounded-btn border border-line bg-paper px-4 py-3 text-[12px] font-semibold text-inksoft transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void savePhoto()}
              disabled={!cropFile || !imageSize || avatarBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3 text-[12px] font-bold text-dark transition hover:bg-lime-deep disabled:cursor-not-allowed disabled:bg-lime-pale disabled:text-muted"
            >
              {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {avatarBusy ? "Saving…" : "Save photo"}
            </button>
          </div>
        </div>
      </Modal>
    </PhoneShell>
  );
}
