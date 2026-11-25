"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { Avatar } from "@/components/feed/feed-post";
import { PhoneShell } from "@/components/layout/phone-shell";
import { BackLink, TextInput } from "@/components/ui/ui";
import { toastError } from "@/components/ui/toast";
import {
  fetchDirectMessageInbox,
  openDirectConversation,
  searchPeople,
  type ExchangePerson,
} from "@/lib/db";
import { Loader2, Search } from "lucide-react";

export default function NewMessagePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<ExchangePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void Promise.all([searchPeople(query.trim()), fetchDirectMessageInbox()])
        .then(([results, threads]) => {
          if (!cancelled) {
            const existingContacts = new Set(threads.map((thread) => thread.person.id));
            setPeople(results.filter((person) => !existingContacts.has(person.id)));
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            toastError(error instanceof Error ? error.message : "Couldn't search people.");
            setPeople([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, ready, user]);

  async function startConversation(person: ExchangePerson) {
    setOpeningId(person.id);
    try {
      const conversationId = await openDirectConversation(person.id);
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't open this conversation.");
      setOpeningId(null);
    }
  }

  if (!ready || !user) {
    return (
      <PhoneShell>
        <div className="card px-4 py-8 text-center text-[11px] text-muted">
          Sign in to start a conversation.
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center gap-1">
        <BackLink href="/messages" label="Back to messages" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">New message</h1>
      </div>

      <label className="mb-4 flex h-11 items-center gap-2 rounded-full border border-line bg-paper px-3 text-muted focus-within:border-lime-deep">
        <Search className="h-4 w-4 shrink-0" />
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people to message"
          aria-label="Search people to message"
          className="h-full min-w-0 border-0 bg-transparent px-0 py-0 text-[11px] focus:border-0 focus:ring-0"
        />
      </label>

      <section className="-mx-5 md:mx-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 border-b border-line px-5 py-8 text-[10px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching people…
          </div>
        ) : people.length ? (
          people.map((person, index) => (
            <button
              key={person.id}
              type="button"
              onClick={() => void startConversation(person)}
              disabled={openingId !== null}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-paper/50 disabled:opacity-60 ${
                index < people.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <Avatar initials={person.initials} src={person.avatarUrl} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-ink">
                  {person.name || "onWard member"}
                </span>
                {person.role ? (
                  <span className="mt-0.5 block max-w-[65vw] truncate text-[10px] text-muted">
                    {person.role}
                  </span>
                ) : null}
              </span>
              {openingId === person.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-lime-deep" />
              ) : null}
            </button>
          ))
        ) : (
          <div className="border-y border-line px-5 py-10 text-center">
            <p className="text-[11px] font-semibold text-ink">No new people found</p>
            <p className="mt-1 text-[9px] text-muted">
              People already in your message history are hidden here.
            </p>
          </div>
        )}
      </section>
    </PhoneShell>
  );
}
