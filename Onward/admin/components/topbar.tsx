"use client";

import Link from "next/link";
import { Bell, Menu, Plus, Search } from "lucide-react";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        className="btn-ghost !px-2.5 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          className="field-input !py-2 pl-9 text-[12.5px]"
          placeholder="Search users, broadcasts, settings…"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-inksoft transition hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" strokeWidth={2.1} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-lime-deep ring-2 ring-paper" />
        </button>
        <Link href="/broadcasts/new" className="btn-lime !py-2">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span className="hidden sm:inline">New broadcast</span>
          <span className="sm:hidden">Broadcast</span>
        </Link>
      </div>
    </header>
  );
}
