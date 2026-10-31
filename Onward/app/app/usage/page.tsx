"use client";

import { useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { ArrowIcon, Button } from "@/components/ui";
import { AuthTop } from "@/components/auth-decor";
import {
  Briefcase,
  Check,
  GraduationCap,
  MoreHorizontal,
  Search,
  Sprout,
  Zap,
} from "lucide-react";

const ROLES = [
  { id: "student", label: "Student", meta: "Learning, coursework & growth", icon: GraduationCap },
  { id: "employee", label: "Employee", meta: "Work tasks, projects & goals", icon: Briefcase },
  { id: "freelancer", label: "Freelancer", meta: "Clients, contracts & creative work", icon: Zap },
  { id: "jobseeker", label: "Job seeker", meta: "Applications, prep & interviews", icon: Search },
  { id: "other", label: "Other", meta: "Something else entirely", icon: MoreHorizontal },
];

export default function UsagePage() {
  const [selected, setSelected] = useState("student");

  return (
    <PhoneShell>
      <AuthTop />
      <p className="eyebrow mb-3">One last thing</p>
      <h1 className="h1 mb-3">
        How will you use
        <br />
        onWard?
      </h1>
      <p className="sub mb-7">This helps us tailor your experience from day one.</p>

      <div className="space-y-2.5">
        {ROLES.map((role) => {
          const active = role.id === selected;
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelected(role.id)}
              aria-pressed={active}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.99] ${
                active
                  ? "border-ink bg-ink text-paper shadow-lift"
                  : "border-line bg-paper text-ink hover:bg-cream"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active ? "bg-lime text-dark" : "bg-cream text-inksoft"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.1} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold">{role.label}</span>
                <span
                  className={`block truncate text-[10px] ${active ? "text-paper/70" : "text-muted"}`}
                >
                  {role.meta}
                </span>
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  active ? "border-lime bg-lime" : "border-dash"
                }`}
              >
                {active ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <Button href="/today" icon={<ArrowIcon />}>
          Start my onWard
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted">
          <Sprout className="h-3 w-3 text-lime-deep" strokeWidth={2.2} />
          You can change this anytime in settings.
        </p>
      </div>
    </PhoneShell>
  );
}
