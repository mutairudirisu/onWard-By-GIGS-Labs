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

const COMMUNITY_TOPIC_ICONS: Record<CommunityTopic, LucideIcon> = {
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
  const Icon = COMMUNITY_TOPIC_ICONS[topic];
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
}: {
  community: Community;
  onJoin?: (community: Community) => void;
  joining?: boolean;
}) {
  return (
    <article className="card flex min-w-0 flex-col gap-3 p-4">
      <Link
        href={`/communities/${community.slug}`}
        className="group min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-lime-deep"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-lime bg-lime-pale text-lime-deep">
            {community.avatarPath ? (
              <img
                src={communityMediaUrl(community.avatarPath) ?? undefined}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <CommunityTopicIcon topic={community.topic} className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold text-ink group-hover:text-lime-deep">
              {community.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted">
              <CommunityTopicIcon topic={community.topic} className="h-3 w-3" />
              {community.topic}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[34px] text-[11px] leading-[1.55] text-inksoft">
          {community.description}
        </p>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-[10px] text-muted">
          <span className="font-semibold tabular-nums text-ink">{community.memberCount}</span>{" "}
          {community.memberCount === 1 ? "member" : "members"}
          <span className="mx-1.5 text-line">·</span>
          <span className="font-semibold tabular-nums text-ink">{community.postCount}</span>{" "}
          posts
        </p>
        {community.isOwner ? (
          <span className="rounded-full bg-lime-pale px-3 py-1.5 text-[9px] font-bold text-lime-deep">
            Owner
          </span>
        ) : community.isMember ? (
          <Link
            href={`/communities/${community.slug}`}
            className="rounded-full bg-cream px-3 py-1.5 text-[9px] font-bold text-ink hover:bg-lime-pale"
          >
            Open
          </Link>
        ) : onJoin ? (
          <button
            type="button"
            disabled={joining}
            onClick={() => onJoin(community)}
            className="cursor-pointer rounded-full bg-lime-deep px-3 py-1.5 text-[9px] font-bold text-dark transition hover:bg-dark hover:text-on-panel disabled:cursor-wait disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join"}
          </button>
        ) : (
          <Link
            href={`/communities/${community.slug}`}
            className="rounded-full bg-cream px-3 py-1.5 text-[9px] font-bold text-ink hover:bg-lime-pale"
          >
            Explore
          </Link>
        )}
      </div>
    </article>
  );
}
