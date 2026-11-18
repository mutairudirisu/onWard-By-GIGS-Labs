import { PageHeader } from "@/components/page-header";
import { FeedbackView } from "@/components/feedback-view";

export default function FeedbackPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Manage", href: "/" }, { label: "Feedback" }]}
        title="Feedback"
        subtitle="What people say when onWard asks how it is going."
      />
      <FeedbackView />
    </>
  );
}
