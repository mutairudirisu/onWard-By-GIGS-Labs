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
    <span className="relative block h-[46px] w-[46px] shrink-0">
      <Avatar initials={initials} src={src} size="lg" />
      {online !== null ? (
        <span
          role="img"
          aria-label={online ? "Online" : "Offline"}
          title={online ? "Online" : "Offline"}
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-cream ${
            online ? "bg-emerald-500" : "bg-faint"
          }`}
        />
      ) : null}
    </span>
  );
}
