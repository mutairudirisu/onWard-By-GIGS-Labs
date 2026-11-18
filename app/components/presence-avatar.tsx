import { Avatar } from "@/components/feed-post";

export function PresenceAvatar({
  initials,
  src,
  online,
}: {
  initials: string;
  src?: string | null;
  online: boolean | null;
}) {
  return (
    <span className="relative block h-10 w-10 shrink-0">
      <Avatar initials={initials} src={src} size="compact" />
      {online !== null ? (
        <span
          role="img"
          aria-label={online ? "Online" : "Offline"}
          title={online ? "Online" : "Offline"}
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-cream ${
            online ? "bg-emerald-500" : "bg-faint"
          }`}
        />
      ) : null}
    </span>
  );
}
