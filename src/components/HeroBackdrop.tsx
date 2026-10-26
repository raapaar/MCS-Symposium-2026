import { useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useMotionPreference } from "../hooks/useMotionPreference";
import frontierArt from "../assets/v2-frontier.webp";
import { useAppearance } from "../v2/appearanceState";

interface Slide {
  image: string;
  label: string;
}

const rotationInterval = 6000;

/** Public images only; a failed gallery request leaves the admin banner intact. */
export default function HeroBackdrop({ imageUrl }: { imageUrl: string }) {
  const appearance = useAppearance();
  const [gallery, setGallery] = useState<Slide[]>([]);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionPreference();

  const slides = [
    { image: appearance.heroImageUrl || frontierArt, label: "The frontier of ideas" },
    ...(imageUrl ? [{ image: imageUrl, label: "Symposium banner" }] : []),
    ...(appearance.useGallery ? gallery : []),
  ].filter((slide, position, all) =>
    !failedImages.includes(slide.image) &&
    all.findIndex((item) => item.image === slide.image) === position,
  );
  const activeIndex = slides.length ? index % slides.length : 0;

  useEffect(() => {
    let active = true;
    void getDocs(query(
      collection(db, "gallery"),
      where("published", "==", true),
      limit(3),
    )).then((snapshot) => {
      if (!active) return;
      setGallery(snapshot.docs.flatMap((document) => {
        const data = document.data();
        return typeof data.image === "string" && data.image.trim()
          ? [{ image: data.image, label: typeof data.title === "string" && data.title.trim()
              ? data.title : "Symposium gallery" }]
          : [];
      }));
    }).catch(() => {
      // Enhancement only: the original banner and crimson fallback still work.
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    const stage = stageRef.current;
    const observer = typeof IntersectionObserver === "undefined" ? null
      : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (stage) observer?.observe(stage);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion || !appearance.motion || hovered || focused || !visible || !inView || document.hidden) return;
    const interval = window.setInterval(() => setIndex((current) => current + 1), Math.max(rotationInterval, appearance.rotationSeconds * 1000));
    return () => window.clearInterval(interval);
  }, [slides.length, paused, reducedMotion, hovered, focused, visible, inView, appearance.motion, appearance.rotationSeconds]);

  return (
    <div ref={stageRef} className="v2-hero-stage">
      <div className="v2-hero-backdrops frontier-hero-art" aria-hidden="true">
        {slides.map((slide, position) => (
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            decoding="async"
            fetchPriority={position === 0 ? "high" : "low"}
            className={position === activeIndex ? "is-active" : undefined}
            onError={() => setFailedImages((current) => [...current, slide.image])}
          />
        ))}
      </div>
      {slides.length > 1 && (
        <div
          className="v2-hero-controls"
          role="group"
          aria-label="Hero backgrounds"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
        >
          <span className="v2-hero-position" aria-live="off">
            <b>{String(activeIndex + 1).padStart(2, "0")}</b>
            <span> / {String(slides.length).padStart(2, "0")}</span>
            <span className="v2-hero-caption">{slides[activeIndex].label}</span>
          </span>
          <button type="button" aria-label="Previous background" onClick={() => {
            setIndex((activeIndex + slides.length - 1) % slides.length);
            setPaused(true);
          }}>←</button>
          <button type="button" aria-label="Next background" onClick={() => {
            setIndex(activeIndex + 1);
            setPaused(true);
          }}>→</button>
          {!reducedMotion && appearance.motion && (
            <button type="button" onClick={() => setPaused((current) => !current)}>
              {paused ? "Resume" : "Pause"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
