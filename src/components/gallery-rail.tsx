"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { GalleryImage } from "@/content/home";
import { withBasePath } from "@/lib/asset-path";

type GalleryRailProps = Readonly<{
  images: readonly GalleryImage[];
}>;

const padIndex = (index: number) => String(index + 1).padStart(2, "0");

export function GalleryRail({ images }: GalleryRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

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

  function handleTrackKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" && activeIndex < images.length - 1) {
      event.preventDefault();
      scrollToSlide(activeIndex + 1);
    } else if (event.key === "ArrowLeft" && activeIndex > 0) {
      event.preventDefault();
      scrollToSlide(activeIndex - 1);
    }
  }

  const progress = images.length === 0 ? 0 : (activeIndex + 1) / images.length;

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
            <div
              className="gallery-image"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={withBasePath(image.src)}
                alt={image.alt}
                fill
                sizes="(max-width: 48rem) 84vw, (max-width: 120rem) 76vw, 96rem"
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
