import { PageHeader } from "@/components/page-header";
import { BroadcastsView } from "@/components/broadcasts-view";

export default function NewBroadcastPage() {
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Manage", href: "/" },
          { label: "Broadcasts", href: "/broadcasts" },
          { label: "New" },
        ]}
        title="New broadcast"
        subtitle="Compose, target and schedule a notification."
      />
      <BroadcastsView composeFirst />
    </>
  );
}
