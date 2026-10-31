import { PageHeader } from "@/components/page-header";
import { BroadcastsView } from "@/components/broadcasts-view";

export default function BroadcastsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Manage", href: "/" }, { label: "Broadcasts" }]}
        title="Notifications"
        subtitle="Broadcast a nudge to the right people at the right moment."
      />
      <BroadcastsView />
    </>
  );
}
