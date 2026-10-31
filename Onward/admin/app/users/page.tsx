import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UsersView } from "@/components/users-view";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Manage", href: "/" }, { label: "Users" }]}
        title="Users"
        subtitle="Invite, segment and manage every onWard account."
        actions={
          <button type="button" className="btn-ghost">
            <Download className="h-4 w-4" strokeWidth={2.1} />
            Export CSV
          </button>
        }
      />
      <UsersView />
    </>
  );
}
