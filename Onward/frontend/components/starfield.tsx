function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t * 16807) % 2147483647;
    return t / 2147483647;
  };
}

const STARS = (() => {
  const rand = seeded(42);
  return Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    r: 0.6 + rand() * 1.4,
    o: 0.15 + rand() * 0.55,
  }));
})();

export function Starfield({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {STARS.map((s) => (
        <circle key={s.id} cx={s.x} cy={s.y} r={s.r / 12} fill="#F3FAD9" opacity={s.o} />
      ))}
    </svg>
  );
}
