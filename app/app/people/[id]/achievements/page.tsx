"use client";

import { useParams } from "next/navigation";
import { ExchangeAchievementsPage } from "@/components/feed/exchange-achievements-page";

export default function ExchangeAchievementsOverview() {
  const { id } = useParams<{ id: string }>();
  return <ExchangeAchievementsPage profileId={id} />;
}
