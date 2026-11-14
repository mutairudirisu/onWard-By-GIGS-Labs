"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { PhoneShell } from "@/components/phone-shell";
import { toastError } from "@/components/toast";
import { openDirectConversation } from "@/lib/db";
import { Loader2 } from "lucide-react";

export default function NewMessagePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    const recipient = new URLSearchParams(window.location.search).get("to");
    if (!recipient) {
      router.replace("/messages");
      return;
    }
    let cancelled = false;
    void openDirectConversation(recipient)
      .then((conversationId) => {
        if (!cancelled) router.replace(`/messages/${conversationId}`);
      })
      .catch((openError: unknown) => {
        if (!cancelled) {
          const message =
            openError instanceof Error ? openError.message : "Couldn't open this conversation.";
          setError(message);
          toastError(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, router, user]);

  return (
    <PhoneShell>
      <div className="card flex flex-col items-center px-4 py-10 text-center">
        {error ? null : <Loader2 className="h-5 w-5 animate-spin text-lime-deep" />}
        <p className="mt-2 text-[11px] font-semibold text-ink">
          {error || "Opening conversation…"}
        </p>
        {error ? (
          <button
            type="button"
            onClick={() => router.replace("/messages")}
            className="mt-3 text-[10px] font-semibold text-lime-deep"
          >
            Back to messages
          </button>
        ) : null}
      </div>
    </PhoneShell>
  );
}
