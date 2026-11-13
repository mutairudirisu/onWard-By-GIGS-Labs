"use client";

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Cpu,
  GraduationCap,
  Heart,
  Hash,
  Palette,
  Plane,
  Sparkles,
  Trophy,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { communityMediaUrl, type Community, type CommunityTopic } from "@/lib/db";

const COMMUNITY_TOPIC_ICONS: Partial<Record<CommunityTopic, LucideIcon>> = {
  Technology: Cpu,
  Business: BriefcaseBusiness,
  "Education & Career": GraduationCap,
  Wellness: Heart,
  "Arts & Design": Palette,
  "Food & Drink": Utensils,
  Sports: Trophy,
  Travel: Plane,
  Lifestyle: Sparkles,
  Other: CircleHelp,
};

export function CommunityTopicIcon({
  topic,
  className = "h-3.5 w-3.5",
}: {
  topic: CommunityTopic;
  className?: string;
}) {
  const Icon = COMMUNITY_TOPIC_ICONS[topic] ?? CircleHelp;
  return <Icon aria-hidden="true" className={className} />;
}

export function CommunityIcon({
  large = false,
}: {
  large?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-lime-pale text-lime-deep ${
        large ? "h-16 w-16" : "h-11 w-11"
      }`}
    >
      <Hash className={large ? "h-7 w-7" : "h-5 w-5"} strokeWidth={2.2} />
    </span>
  );
}

export function LeaveCommunityDialog({
  communityName,
  open,
  busy = false,
  error,
  onClose,
  onConfirm,
}: {
  communityName: string;
  open: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal open={open} onClose={close} title={`Leave ${communityName}?`}>
      <p className="text-[11.5px] leading-[1.6] text-inksoft">
        You can rejoin this community any time.
      </p>
      {error ? <p role="alert" className="mt-3 text-[10px] text-danger">{error}</p> : null}
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream disabled:cursor-wait disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex flex-1 cursor-pointer items-center justify-center rounded-btn bg-lime px-4 py-3 text-[13px] font-semibold text-dark transition hover:bg-lime-deep disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Leaving…" : "Leave community"}
        </button>
      </div>
    </Modal>
  );
}

export function CommunityCard({
  community,
  onJoin,
  onLeave,
  membershipBusy = false,
  previewOnly = false,
}: {
  community: Community;
  onJoin?: (community: Community) => void;
  onLeave: (community: Community) => void;
  membershipBusy?: boolean;
  previewOnly?: boolean;
}) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const identity = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-lime bg-lime-pale text-lime-deep sm:h-10 sm:w-10">
        {community.avatarPath ? (
          <img
            src={communityMediaUrl(community.avatarPath) ?? undefined}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <CommunityTopicIcon topic={community.topic} className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <h3 className="truncate text-[11px] font-bold text-ink group-hover:text-lime-deep">
          {community.name}
        </h3>
        <span className="mt-0.5 block truncate text-[9px] text-muted">
          {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
          <span className="mx-1 text-line">·</span>
          {community.postCount} posts
        </span>
      </span>
    </>
  );

  const action = previewOnly ? (
    <span className="shrink-0 rounded-full bg-lime-pale px-2.5 py-1.5 text-[9px] font-bold text-lime-deep">
      Sample
    </span>
  ) : community.isOwner ? (
    <span className="shrink-0 rounded-full bg-lime-pale px-2.5 py-1.5 text-[9px] font-bold text-lime-deep">
      Owner
    </span>
  ) : community.isMember ? (
    <button
      type="button"
      aria-label={`Leave ${community.name}`}
      aria-haspopup="dialog"
      disabled={membershipBusy}
      onClick={() => setLeaveOpen(true)}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-cream px-2.5 py-1.5 text-[9px] font-bold text-ink hover:bg-lime-pale disabled:cursor-wait disabled:opacity-60"
    >
      <Check className="h-3 w-3" />
      {membershipBusy ? "Leaving…" : "Joined"}
    </button>
  ) : onJoin ? (
    <button
      type="button"
      disabled={membershipBusy}
      onClick={() => onJoin(community)}
      className="shrink-0 cursor-pointer rounded-full bg-cream px-2.5 py-1.5 text-[9px] font-bold text-ink transition hover:bg-lime-pale disabled:cursor-wait disabled:opacity-60"
    >
      {membershipBusy ? "Joining…" : "Join"}
    </button>
  ) : (
    <Link
      href={`/communities/${community.slug}`}
      className="shrink-0 rounded-full bg-cream px-2.5 py-1.5 text-[9px] font-bold text-ink hover:bg-lime-pale"
    >
      Explore
    </Link>
  );

  return (
    <>
      <article className="card flex min-w-0 flex-col gap-1.5 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          {previewOnly ? (
            <div className="group flex min-w-0 flex-1 items-center gap-2">{identity}</div>
          ) : (
            <Link
              href={`/communities/${community.slug}`}
              className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-lime-deep"
            >
              {identity}
            </Link>
          )}
          {action}
        </div>
        {previewOnly ? (
          <p className="line-clamp-2 min-h-[30px] text-[10px] leading-[1.5] text-inksoft">
            {community.description}
          </p>
        ) : (
          <Link
            href={`/communities/${community.slug}`}
            className="line-clamp-2 min-h-[30px] rounded-lg text-[10px] leading-[1.5] text-inksoft outline-none focus-visible:ring-2 focus-visible:ring-lime-deep"
          >
            {community.description}
          </Link>
        )}
      </article>
      <LeaveCommunityDialog
        communityName={community.name}
        open={leaveOpen}
        busy={membershipBusy}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          onLeave(community);
        }}
      />
    </>
  );
}
