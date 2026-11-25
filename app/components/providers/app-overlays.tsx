"use client";

import { InstallInstructionsOnRequest } from "@/components/overlays/install-instructions-on-request";
import { UpdatePrompt } from "@/components/overlays/update-prompt";
import { FeedbackPrompt } from "@/components/overlays/feedback-prompt";

/**
 * AppOverlays renders global user prompts and banner overlays.
 */
export function AppOverlays() {
  return (
    <>
      <InstallInstructionsOnRequest />
      <UpdatePrompt />
      <FeedbackPrompt />
    </>
  );
}

export default AppOverlays;
