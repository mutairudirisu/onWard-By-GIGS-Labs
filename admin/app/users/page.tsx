import { PageHeader } from "@/components/page-header";
import { UsersView } from "@/components/users-view";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Manage", href: "/" }, { label: "Users" }]}
        title="Users"
        subtitle="Every onWard account, live from Supabase."
      />
      <UsersView />
    </>
  );
}
