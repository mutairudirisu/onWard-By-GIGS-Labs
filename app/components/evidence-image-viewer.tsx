"use client";

import { Modal } from "@/components/modal";
import { PostMediaFrame } from "@/components/post-media-carousel";

export type EvidenceImagePreview = {
  src: string;
  label: string;
};

export function EvidenceImageViewer({
  image,
  onClose,
}: {
  image: EvidenceImagePreview | null;
  onClose: () => void;
}) {
  return (
    <Modal open={image !== null} onClose={onClose} title={image?.label ?? "Image preview"} wide>
      {image ? (
        <div
          className="min-h-[220px] w-full overflow-hidden rounded-xl bg-black"
          style={{ height: "min(70vh, 560px)" }}
        >
          <PostMediaFrame
            src={image.src}
            kind="image"
            alt={image.label}
            loading="eager"
            preload="metadata"
            mode="viewer"
          />
        </div>
      ) : null}
    </Modal>
  );
}
