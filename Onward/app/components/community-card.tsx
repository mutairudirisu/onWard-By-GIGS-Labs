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
import type { Community, CommunityTopic } from "@/lib/db";

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
    <article className="relative min-h-[158px] min-w-0 rounded-[24px] border border-line bg-paper p-4">
      <Link
        href={`/communities/${community.slug}`}
        aria-label={`View ${community.name}`}
        className="absolute inset-0 z-0 rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-lime-deep"
      >
        <span className="sr-only">Open community</span>
      </Link>
      <div className="pointer-events-none relative z-10">
        <div className="flex items-start gap-3 pr-20">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
            <CommunityTopicIcon topic={community.topic} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold leading-tight text-ink">
              {community.name}
            </h3>
            <p className="mt-1 text-[13px] leading-tight text-muted">
              {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] leading-[1.45] text-inksoft">
          {community.description}
        </p>
      </div>
      <div className="absolute right-4 top-4 z-20">
        {community.isOwner ? (
          <span className="rounded-full bg-lime-pale px-4 py-2.5 text-[13px] font-semibold text-lime-deep">
            Owner
          </span>
        ) : community.isMember ? (
          <Link
            href={`/communities/${community.slug}`}
            className="rounded-full bg-[#e9eef2] px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-lime-soft"
          >
            Open
          </Link>
        ) : onJoin ? (
          <button
            type="button"
            disabled={joining}
            onClick={() => onJoin(community)}
            className="cursor-pointer rounded-full bg-[#e9eef2] px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-lime-soft disabled:cursor-wait disabled:opacity-60"
          >
            {joining ? "Joining…" : "Join"}
          </button>
        ) : (
          <Link
            href={`/communities/${community.slug}`}
            className="rounded-full bg-[#e9eef2] px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-lime-soft"
          >
            Explore
          </Link>
        )}
      </div>
    </article>
  );
}
