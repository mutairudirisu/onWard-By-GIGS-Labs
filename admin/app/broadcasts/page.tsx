import { PageHeader } from "@/components/page-header";
import { NotificationAutomations } from "@/components/notification-automations";

export default function BroadcastsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Manage", href: "/" }, { label: "Notifications" }]}
        title="Automatic notifications"
        subtitle="Review the usage-based schedule and decide which messages are active."
      />
      <NotificationAutomations />
    </>
  );
}
