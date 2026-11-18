"use client";

import { useParams } from "next/navigation";
import { CommunityDirectoryPage } from "@/components/community-directory-page";

export default function CommunityCategoryRoute() {
  const params = useParams<{ topic: string }>();
  return <CommunityDirectoryPage topicSlug={params.topic} />;
}
