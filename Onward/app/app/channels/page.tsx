"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hash, Loader2, Users } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { Modal } from "@/components/modal";
import { useAuth } from "@/components/auth";
import { toastError } from "@/components/toast";
import { createChannel, fetchChannels, type ChannelCard } from "@/lib/db";
import { timeAgo } from "@/lib/dates";

/**
 * The rooms of the Exchange. A channel is a name anybody can join and write in; the
 * posts in it are ordinary Exchange posts, so they stay public and searchable whether or
 * not you are a member. Joining says which rooms are yours, it does not lock a door.
 */
export default function ChannelsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelCard[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchChannels()
      .then((rows) => {
        if (!cancelled) setChannels(rows);
      })
      .catch(() => {
        if (!cancelled) setChannels([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function open() {
    if (busy) return;
    setBusy(true);
    try {
      const made = await createChannel(name, about);
      setChannels((prev) => [made, ...(prev ?? []).filter((row) => row.id !== made.id)]);
      setCreating(false);
      setName("");
      setAbout("");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't open that channel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell tab="feed">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/feed"
          aria-label="Back to the Exchange"
          className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="flex-1 text-[13px] font-bold tracking-tight text-ink">Channels</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="cursor-pointer rounded-full bg-lime px-4 py-2 text-[11.5px] font-bold text-dark transition hover:bg-lime-deep"
        >
          New channel
        </button>
      </div>

      {channels === null ? (
        <p className="py-8 text-center text-[11.5px] text-muted">Loading the rooms…</p>
      ) : channels.length ? (
        <ul className="border-t border-line">
          {channels.map((channel) => (
            <li key={channel.id} className="border-b border-line">
              <Link href={`/channels/${channel.id}`} className="flex cursor-pointer items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-deep">
                  <Hash className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-bold tracking-tight text-ink">
                      {channel.name}
                    </span>
                    {channel.joined ? (
                      <span className="shrink-0 rounded-full bg-lime-pale px-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-lime-deep">
                        Joined
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                    {channel.about || `Opened by ${channel.ownerName || "someone"}`}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[9.5px] text-faint tabular-nums">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" strokeWidth={2} /> {channel.members}
                    </span>
                    <span>{channel.posts} posts</span>
                    <span>{timeAgo(channel.createdAt)}</span>
                  </span>
                </span>
                <Avatar initials={channel.ownerInitials} src={channel.ownerAvatarUrl} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">No channels yet.</p>
          <p className="tiny mt-1">
            Open one for a trade, a city or a craft, and let people join it.
          </p>
        </div>
      )}

      <p className="mt-5 rounded-xl border border-dash px-3.5 py-3 text-[9.5px] leading-[1.55] text-muted">
        A channel is a room with a name. Posts written in it are Exchange posts: public,
        searchable, and yours to delete. Joining puts the room on your own list so you can find it
        again and write in it - it does not hide the room from anybody else.
      </p>

      <Modal open={creating} onClose={() => setCreating(false)} title="Open a channel">
        {!user ? (
          <p className="text-[11.5px] leading-[1.6] text-inksoft">
            <Link href="/sign-in" className="cursor-pointer font-bold text-lime-deep hover:underline">
              Sign in
            </Link>{" "}
            to open a channel.
          </p>
        ) : (
          <>
            <label className="block">
              <span className="text-[10.5px] font-semibold text-muted">Name</span>
              <input
                value={name}
                autoFocus
                onChange={(event) => setName(event.target.value.slice(0, 40))}
                placeholder="Lagos riders"
                aria-label="Channel name"
                className="field-input mt-1 w-full"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-[10.5px] font-semibold text-muted">What is it for</span>
              <textarea
                value={about}
                rows={2}
                onChange={(event) => setAbout(event.target.value.slice(0, 280))}
                placeholder="One line anybody can read before they join"
                aria-label="Channel note"
                className="field-input mt-1 w-full resize-none"
              />
            </label>
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => void open()}
                disabled={name.trim().length < 2 || busy}
                className={`flex flex-1 items-center justify-center gap-2 rounded-btn px-4 py-3 text-[13px] font-semibold transition ${
                  name.trim().length < 2 || busy
                    ? "cursor-not-allowed bg-line text-muted"
                    : "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
                }`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Open it
              </button>
            </div>
            <p className="mt-2 text-center text-[9.5px] leading-[1.5] text-muted">
              Two channels cannot share a name, and you are in it the moment it opens.
            </p>
          </>
        )}
      </Modal>
    </PhoneShell>
  );
}
