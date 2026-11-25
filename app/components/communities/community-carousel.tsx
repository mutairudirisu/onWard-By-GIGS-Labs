"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CommunityCard } from "@/components/communities/community-card";
import type { Community } from "@/lib/db";

export function CommunityCarousel({
  id,
  title,
  communities,
  moreHref,
  membershipBusyId,
  onJoin,
  onLeave,
  previewOnly,
}: {
  id: string;
  title: string;
  communities: Community[];
  moreHref?: string;
  membershipBusyId: string | null;
  onJoin: (community: Community) => void;
  onLeave: (community: Community) => void;
  previewOnly: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => setOverflows(row.scrollWidth > row.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    Array.from(row.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [communities.length]);

  return (
    <section aria-label={`${title} communities`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="text-[12px] font-bold text-ink">
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[9px] text-muted">
            {communities.length} {communities.length === 1 ? "community" : "communities"}
          </span>
          {moreHref && overflows ? (
            <Link
              href={moreHref}
              aria-label={`View all ${title} communities`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-lime-pale"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
      <div
        ref={rowRef}
        id={id}
        aria-labelledby={`${id}-title`}
        className="wheel -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
      >
        {communities.map((community) => (
          <div key={community.id} className="w-[86%] shrink-0 snap-start sm:w-[250px]">
            <CommunityCard
              community={community}
              membershipBusy={membershipBusyId === community.id}
              onJoin={onJoin}
              onLeave={onLeave}
              previewOnly={previewOnly}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
