"use client";

import { useParams } from "next/navigation";
import { ExchangeAchievementsPage } from "@/components/feed/exchange-achievements-page";

export default function ExchangeAchievementCategoryPage() {
  const { id, category } = useParams<{ id: string; category: string }>();
  return <ExchangeAchievementsPage profileId={id} categoryId={category} />;
}
