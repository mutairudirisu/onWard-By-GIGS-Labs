import { BookOpen, Mail, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const CARDS = [
  { Icon: BookOpen, t: "Docs", d: "Guides for managing users, broadcasts and roles." },
  { Icon: Users, t: "Community", d: "Talk with other platform admins." },
  { Icon: MessageSquare, t: "Changelog", d: "What shipped in the admin console lately." },
  { Icon: Mail, t: "Contact", d: "Reach the onWard team at team@onward.app." },
];

export default function SupportPage() {
  return (
    <>
      <PageHeader
        title="Help & docs"
        subtitle="Everything you need to run the onWard platform."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map(({ Icon, t, d }) => (
          <div key={t} className="panel p-6 transition hover:shadow-lift">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-soft text-lime-deep">
              <Icon className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <h2 className="h2 mt-4">{t}</h2>
            <p className="sub mt-1">{d}</p>
            <span className="tiny mt-3 inline-block font-semibold text-lime-deep">
              Open →
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
