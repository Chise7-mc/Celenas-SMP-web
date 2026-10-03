"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { GalleryImage } from "@/content/home";
import { withBasePath } from "@/lib/asset-path";

type GalleryRailProps = Readonly<{
  images: readonly GalleryImage[];
}>;

type GalleryViewerImageProps = Readonly<{
  image: GalleryImage;
  canAdvance: boolean;
  onAdvance: () => void;
}>;

const padIndex = (index: number) => String(index + 1).padStart(2, "0");

function GalleryViewerImage({
  image,
  canAdvance,
  onAdvance,
}: GalleryViewerImageProps) {
  const content = (
    <Image
      key={image.id}
      className="gallery-viewer-image-content"
      src={withBasePath(image.src)}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes="min(92vw, 120rem)"
    />
  );

  return (
    <button
      className="gallery-viewer-image"
      type="button"
      aria-label="次の画像を表示"
      disabled={!canAdvance}
      onClick={onAdvance}
    >
      {content}
    </button>
  );
}

export function GalleryRail({ images }: GalleryRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const slidesRef = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) => right.intersectionRatio - left.intersectionRatio,
          )
          .at(0);

        if (mostVisible && mostVisible.intersectionRatio >= 0.5) {
          const index = Number(
            (mostVisible.target as HTMLElement).dataset.index,
          );
          if (Number.isInteger(index)) setActiveIndex(index);
        }
      },
      { root: track, threshold: [0.5, 0.75, 1] },
    );

    slidesRef.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    const dialog = viewerRef.current;
    if (viewerIndex !== null && dialog && !dialog.open) dialog.showModal();
  }, [viewerIndex]);

  useEffect(() => {
    if (viewerIndex === null) return;

    function handleViewerKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setViewerIndex((index) =>
          index === null ? null : Math.min(images.length - 1, index + 1),
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setViewerIndex((index) =>
          index === null ? null : Math.max(0, index - 1),
        );
      }
    }

    window.addEventListener("keydown", handleViewerKeyDown, true);
    return () =>
      window.removeEventListener("keydown", handleViewerKeyDown, true);
  }, [images.length, viewerIndex]);

  function scrollToSlide(index: number) {
    const slide = slidesRef.current[index];
    if (!slide) return;

    slide.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  function handleTrackKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" && activeIndex < images.length - 1) {
      event.preventDefault();
      scrollToSlide(activeIndex + 1);
    } else if (event.key === "ArrowLeft" && activeIndex > 0) {
      event.preventDefault();
      scrollToSlide(activeIndex - 1);
    }
  }

  function closeViewer() {
    viewerRef.current?.close();
    setViewerIndex(null);
  }

  const progress = images.length === 0 ? 0 : (activeIndex + 1) / images.length;
  const viewerImage = viewerIndex === null ? null : images[viewerIndex];

  return (
    <div className="gallery-rail">
      <div className="gallery-rail-toolbar">
        <div className="gallery-rail-status">
          <output
            className="gallery-counter"
            aria-live="polite"
            aria-atomic="true"
          >
            {padIndex(activeIndex)} / {String(images.length).padStart(2, "0")}
          </output>
          <span
            className="gallery-progress"
            role="progressbar"
            aria-label="Gallery progress"
            aria-valuemin={1}
            aria-valuemax={images.length}
            aria-valuenow={activeIndex + 1}
            aria-valuetext={`${activeIndex + 1} / ${images.length}`}
          >
            <span
              className="gallery-progress-value"
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>
        </div>
        <div className="gallery-rail-controls">
          <button
            className="gallery-rail-button"
            type="button"
            aria-label="前の画像"
            disabled={activeIndex === 0}
            onClick={() => scrollToSlide(activeIndex - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            className="gallery-rail-button"
            type="button"
            aria-label="次の画像"
            disabled={activeIndex >= images.length - 1}
            onClick={() => scrollToSlide(activeIndex + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        className="gallery-track"
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="Celenas Gallery"
        onKeyDown={handleTrackKeyDown}
      >
        {images.map((image, index) => (
          <figure
            key={image.id}
            className="gallery-slide"
            data-index={index}
            data-active={index === activeIndex ? "true" : "false"}
            ref={(node) => {
              slidesRef.current[index] = node;
            }}
          >
            <button
              className="gallery-image-button"
              type="button"
              aria-label={`画像を拡大: ${image.alt}`}
              onClick={() => setViewerIndex(index)}
            >
              <span className="gallery-image">
                <Image
                  src={withBasePath(image.src)}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 48rem) 84vw, (max-width: 120rem) 76vw, 96rem"
                />
              </span>
            </button>
          </figure>
        ))}
      </div>

      <dialog
        className="gallery-viewer"
        ref={viewerRef}
        aria-label="Gallery image viewer"
        onClose={() => setViewerIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
      >
        {viewerIndex !== null && viewerImage ? (
          <>
            <div className="gallery-viewer-media">
              <GalleryViewerImage
                image={viewerImage}
                canAdvance={viewerIndex < images.length - 1}
                onAdvance={() =>
                  setViewerIndex(Math.min(images.length - 1, viewerIndex + 1))
                }
              />
            </div>
            <button
              className="gallery-rail-button gallery-viewer-nav gallery-viewer-prev"
              type="button"
              aria-label="前の画像"
              disabled={viewerIndex === 0}
              onClick={() => setViewerIndex(Math.max(0, viewerIndex - 1))}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              className="gallery-rail-button gallery-viewer-nav gallery-viewer-next"
              type="button"
              aria-label="次の画像"
              disabled={viewerIndex >= images.length - 1}
              onClick={() =>
                setViewerIndex(Math.min(images.length - 1, viewerIndex + 1))
              }
            >
              <span aria-hidden="true">→</span>
            </button>
            <output
              className="gallery-counter gallery-viewer-counter"
              aria-live="polite"
              aria-atomic="true"
            >
              {padIndex(viewerIndex)} / {String(images.length).padStart(2, "0")}
            </output>
            <button
              className="gallery-rail-button gallery-viewer-close"
              type="button"
              aria-label="画像ビューアーを閉じる"
              onClick={closeViewer}
            >
              <span aria-hidden="true">×</span>
            </button>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
