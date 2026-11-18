"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import {
  hasUpdateWaiting,
  reloadWithUpdate,
  subscribeToWaitingWorker,
} from "@/lib/app-update";

/**
 * A deploy swaps the bundle on disk while the installed app keeps running the
 * old one. The worker holds the new version until this dialog lets the user
 * choose when to hand over.
 */
export function UpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(
    () => subscribeToWaitingWorker(() => setAvailable(hasUpdateWaiting())),
    [],
  );

  if (!available || dismissed) return null;

  return (
    <Modal open onClose={() => setDismissed(true)} title="A new onWard is ready">
      <p className="text-[12.5px] leading-[1.6] text-muted">
        We shipped changes. Reload to pick them up — anything you have logged is
        on your account, nothing gets left behind.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" onClick={() => setDismissed(true)}>
          Later
        </Button>
        <Button onClick={reloadWithUpdate}>Reload now</Button>
      </div>
    </Modal>
  );
}
