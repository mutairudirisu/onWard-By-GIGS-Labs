import Image from "next/image";

export function ProductPhone({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 270px, (min-width: 640px) 250px, 84vw",
  compact = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  compact?: boolean;
}) {
  const frameStyle = compact
    ? "rounded-[25px] border-[4px] p-px"
    : "rounded-[36px] border-[7px] p-[2px]";
  const screenStyle = compact ? "rounded-[20px]" : "rounded-[27px]";

  return (
    <div
      className={`relative mx-auto aspect-[9/19.3] w-full overflow-hidden border-[#171813] bg-[#171813] shadow-[0_32px_80px_rgba(0,0,0,0.2)] ${frameStyle} ${className}`}
    >
      <div className={`relative h-full w-full overflow-hidden ${screenStyle}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-contain"
        />
      </div>
    </div>
  );
}
