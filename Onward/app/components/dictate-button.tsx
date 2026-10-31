"use client";

import { Mic } from "lucide-react";
import { useDictation } from "@/lib/dictation";

export function DictateButton({
  onText,
  label = "Dictate",
  className = "",
}: {
  onText: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const { supported, listening, error, toggle } = useDictation(onText);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop dictating" : label}
      aria-pressed={listening}
      title={error ?? (listening ? "Stop dictating" : label)}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
        listening ? "bg-lime text-dark" : "text-inksoft hover:bg-cream"
      } ${error ? "ring-1 ring-red-300" : ""} ${className}`}
    >
      <Mic className="h-[16px] w-[16px]" strokeWidth={2.2} />
    </button>
  );
}
