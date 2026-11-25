"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, ImageOff, LoaderCircle } from "lucide-react";
import { mediaUrl, type PostMedia } from "@/lib/db";

type PostMediaCarouselProps = {
  media: PostMedia[];
  index: number;
  onIndexChange: (index: number) => void;
  mode: "feed" | "viewer";
  onOpen?: (index: number) => void;
  alt: string;
  rounded?: boolean;
};

const DEFAULT_FRAME_RATIO = 4 / 5;

export function mediaAspectRatio(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return Math.min(4, Math.max(0.25, width / height));
}

export function PostMediaFrame({
  src,
  kind,
  alt,
  loading,
  preload,
  mode,
  onOpen,
  onDimensions,
  controls = true,
  muted = false,
}: {
  src: string;
  kind: PostMedia["kind"];
  alt: string;
  loading: "eager" | "lazy";
  preload: "none" | "metadata";
  mode: "feed" | "viewer";
  onOpen?: () => void;
  onDimensions?: (width: number, height: number) => void;
  controls?: boolean;
  muted?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    kind === "video" ? "ready" : "loading",
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(preload === "metadata");

  useEffect(() => {
    if (kind !== "video" || preload === "metadata") {
      if (preload === "metadata") setNearViewport(true);
      return;
    }

    const frame = frameRef.current;
    if (!frame) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "160px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [kind, preload]);

  useEffect(() => {
    if (kind !== "image") return;
    const image = frameRef.current?.querySelector("img");
    if (!image?.complete) return;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setStatus("ready");
      onDimensions?.(image.naturalWidth, image.naturalHeight);
    } else {
      setStatus("error");
    }
  }, [kind, onDimensions, src]);

  const content =
    kind === "video" ? (
      <video
        src={src}
        controls={controls}
        muted={muted}
        playsInline
        preload={nearViewport ? "metadata" : "none"}
        aria-label={alt}
        onLoadedMetadata={(event) => {
          setStatus("ready");
          onDimensions?.(event.currentTarget.videoWidth, event.currentTarget.videoHeight);
        }}
        onError={() => setStatus("error")}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
    ) : (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={loading === "eager" ? "high" : "auto"}
        onLoad={(event) => {
          setStatus("ready");
          onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight);
        }}
        onError={() => setStatus("error")}
        className={`absolute inset-0 h-full w-full object-contain ${
          mode === "viewer" ? "bg-[#0a0b0c]" : "bg-cream"
        }`}
      />
    );

  return (
    <div ref={frameRef} className="relative h-full w-full overflow-hidden bg-black">
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-white/65">
          <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Loading media" />
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-ink text-white/70">
          {kind === "video" ? <Film className="h-7 w-7" /> : <ImageOff className="h-7 w-7" />}
          <span className="text-xs">Media couldn&apos;t be loaded</span>
        </div>
      ) : null}
      {kind === "image" && onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open image: ${alt}`}
          className="absolute inset-0 h-full w-full cursor-zoom-in"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </div>
  );
}

export function PostMediaCarousel({
  media,
  index,
  onIndexChange,
  mode,
  onOpen,
  alt,
  rounded = true,
}: PostMediaCarouselProps) {
  const isViewer = mode === "viewer";
  const railRef = useRef<HTMLDivElement>(null);
  const firstItemId = media[0]?.id;
  const [frame, setFrame] = useState({ itemId: firstItemId, ratio: DEFAULT_FRAME_RATIO });
  const frameRatio = frame.itemId === firstItemId ? frame.ratio : DEFAULT_FRAME_RATIO;
  const [viewerBounds, setViewerBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isViewer) return;
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      const width = rail.clientWidth;
      const height = rail.clientHeight;
      setViewerBounds((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [isViewer]);

  const updateFrameRatio = useCallback(
    (width: number, height: number) => {
      const ratio = mediaAspectRatio(width, height);
      if (ratio === null) return;
      setFrame((current) =>
        current.itemId === firstItemId && Math.abs(current.ratio - ratio) < 0.01
          ? current
          : { itemId: firstItemId, ratio },
      );
    },
    [firstItemId],
  );

  const updateIndexFromScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail?.clientWidth) return;
    const next = Math.min(media.length - 1, Math.max(0, Math.round(rail.scrollLeft / rail.clientWidth)));
    if (next !== index) onIndexChange(next);
  }, [index, media.length, onIndexChange]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail?.clientWidth) return;
    const current = Math.round(rail.scrollLeft / rail.clientWidth);
    if (current !== index) rail.scrollTo({ left: index * rail.clientWidth, behavior: "smooth" });
  }, [index]);

  const moveTo = (next: number) => {
    const safeIndex = Math.min(media.length - 1, Math.max(0, next));
    railRef.current?.scrollTo({
      left: safeIndex * (railRef.current?.clientWidth ?? 0),
      behavior: "smooth",
    });
    onIndexChange(safeIndex);
  };

  if (!media.length) return null;

  const viewerFrameWidth =
    viewerBounds.width && viewerBounds.height
      ? Math.min(viewerBounds.width, viewerBounds.height * frameRatio)
      : undefined;
  const viewerFrameHeight = viewerFrameWidth ? viewerFrameWidth / frameRatio : undefined;

  return (
    <div
      className={`relative w-full overflow-hidden ${
        isViewer ? "h-full min-h-0" : `${rounded ? "rounded-2xl" : ""} bg-ink lg:bg-cream`
      }`}
      style={
        isViewer
          ? undefined
          : { aspectRatio: String(frameRatio), maxHeight: "min(78dvh, 560px)" }
      }
    >
      <div
        ref={railRef}
        className="wheel flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        onScroll={updateIndexFromScroll}
      >
        {media.map((item, itemIndex) => (
          <div
            key={item.id}
            className="relative flex h-full w-full shrink-0 snap-center items-center justify-center"
          >
            <div
              className={isViewer ? "relative max-h-full max-w-full" : "relative h-full w-full"}
              style={
                isViewer && viewerFrameWidth && viewerFrameHeight
                  ? { width: viewerFrameWidth, height: viewerFrameHeight }
                  : undefined
              }
            >
              <PostMediaFrame
                src={mediaUrl(item.path)}
                kind={item.kind}
                alt={`${alt}, ${itemIndex + 1} of ${media.length}`}
                loading={
                  isViewer && (itemIndex === 0 || itemIndex === index || itemIndex === index + 1)
                    ? "eager"
                    : "lazy"
                }
                mode={mode}
                preload={
                  isViewer && (itemIndex === 0 || itemIndex === index || itemIndex === index + 1)
                    ? "metadata"
                    : "none"
                }
                onOpen={onOpen ? () => onOpen(itemIndex) : undefined}
                onDimensions={itemIndex === 0 ? updateFrameRatio : undefined}
              />
            </div>
          </div>
        ))}
      </div>

      {media.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            disabled={index === 0}
            onClick={() => moveTo(index - 1)}
            className={`absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75 disabled:cursor-default disabled:opacity-35 ${
              isViewer ? "left-3 sm:left-6" : "hidden md:flex"
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            disabled={index >= media.length - 1}
            onClick={() => moveTo(index + 1)}
            className={`absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75 disabled:cursor-default disabled:opacity-35 ${
              isViewer ? "right-3 sm:right-6" : "hidden md:flex"
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {isViewer ? null : (
            <>
              <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
                {index + 1}/{media.length}
              </span>
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
                {media.map((item, itemIndex) => (
                  <span
                    key={item.id}
                    className={`h-1.5 w-1.5 rounded-full ${
                      itemIndex === index ? "bg-white" : "bg-white/45"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
