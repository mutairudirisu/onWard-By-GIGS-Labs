"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
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

export function CommunityCard({
  community,
  onJoin,
  joining = false,
  previewOnly = false,
}: {
  community: Community;
  onJoin?: (community: Community) => void;
  joining?: boolean;
  previewOnly?: boolean;
}) {
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
    <Link
      href={`/communities/${community.slug}`}
      className="shrink-0 rounded-full bg-cream px-2.5 py-1.5 text-[9px] font-bold text-ink hover:bg-lime-pale"
    >
      Open
    </Link>
  ) : onJoin ? (
    <button
      type="button"
      disabled={joining}
      onClick={() => onJoin(community)}
      className="shrink-0 cursor-pointer rounded-full bg-cream px-2.5 py-1.5 text-[9px] font-bold text-ink transition hover:bg-lime-pale disabled:cursor-wait disabled:opacity-60"
    >
      {joining ? "Joining…" : "Join"}
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
  );
}
