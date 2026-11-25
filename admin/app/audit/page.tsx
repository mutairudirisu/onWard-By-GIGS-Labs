import { PageHeader } from "@/components/page-header";

const LOG = [
  { who: "Mutairu Dirisu", action: "Sent broadcast 'Sunday reset'", target: "1,840 users", when: "2h ago", kind: "broadcast" },
  { who: "Grace Etim", action: "Suspended account", target: "Ken Watanabe", when: "1d ago", kind: "user" },
  { who: "Mutairu Dirisu", action: "Invited teammate", target: "sam@onward.app", when: "1d ago", kind: "user" },
  { who: "System", action: "Scheduled job 'weekly digest'", target: "all admins", when: "2d ago", kind: "system" },
  { who: "Grace Etim", action: "Updated plan defaults", target: "Workspace", when: "3d ago", kind: "settings" },
  { who: "Sam Lee", action: "Exported user CSV", target: "12,480 rows", when: "4d ago", kind: "export" },
];

const kindCls: Record<string, string> = {
  broadcast: "bg-lime-soft text-good",
  user: "bg-[#E7E2F5] text-[#6D5AA8]",
  settings: "bg-[#F3E3CF] text-warn",
  system: "bg-[#EFEFE6] text-inksoft",
  export: "bg-[#DDEAE2] text-inksoft",
};

export default function AuditPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Insights", href: "/" }, { label: "Audit log" }]}
        title="Audit log"
        subtitle="Every admin action, kept for compliance."
      />
      <div className="panel overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                <th className="th">Admin</th>
                <th className="th">Action</th>
                <th className="th">Target</th>
                <th className="th">Type</th>
                <th className="th text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {LOG.map((l, i) => (
                <tr key={i} className="border-b border-line/70 last:border-0 hover:bg-cream/50">
                  <td className="td font-semibold text-ink">{l.who}</td>
                  <td className="td">{l.action}</td>
                  <td className="td text-muted">{l.target}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${kindCls[l.kind]}`}>{l.kind}</span>
                  </td>
                  <td className="td text-right whitespace-nowrap">{l.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
