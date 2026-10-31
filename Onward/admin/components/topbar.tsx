"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Plus, Search } from "lucide-react";
import { useAdminSession } from "@/lib/admin-session";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const session = useAdminSession();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        className="btn-ghost !px-2.5 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </button>

      <form
        className="relative hidden max-w-md flex-1 sm:block"
        onSubmit={(event) => {
          event.preventDefault();
          const needle = query.trim();
          router.push(needle ? `/users?q=${encodeURIComponent(needle)}` : "/users");
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          className="field-input !py-2 pl-9 text-[12.5px]"
          placeholder="Search users by name or email…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search users"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => session?.signOut()}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 items-center gap-2 rounded-full border border-line bg-paper pl-1 pr-1 text-[12px] font-semibold text-inksoft transition hover:text-ink lg:pl-1.5 lg:pr-3"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
            {session?.initials ?? "OW"}
          </span>
          <span className="hidden items-center gap-1 lg:flex">
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.1} /> Sign out
          </span>
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
