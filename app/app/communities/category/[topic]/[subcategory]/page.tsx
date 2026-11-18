"use client";

import { useParams } from "next/navigation";
import { CommunityDirectoryPage } from "@/components/community-directory-page";

export default function CommunitySubcategoryRoute() {
  const params = useParams<{ topic: string; subcategory: string }>();
  return (
    <CommunityDirectoryPage
      topicSlug={params.topic}
      subcategorySlug={params.subcategory}
    />
  );
}
