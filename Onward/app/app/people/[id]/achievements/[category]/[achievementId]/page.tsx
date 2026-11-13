"use client";

import { useParams } from "next/navigation";
import { ExchangeAchievementsPage } from "@/components/exchange-achievements-page";

export default function ExchangeAchievementDetailPage() {
  const { id, category, achievementId } = useParams<{
    id: string;
    category: string;
    achievementId: string;
  }>();
  return (
    <ExchangeAchievementsPage
      profileId={id}
      categoryId={category}
      achievementId={achievementId}
    />
  );
}
