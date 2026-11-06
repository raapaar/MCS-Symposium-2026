import { useEffect, useState } from "react";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useMotionPreference } from "../hooks/useMotionPreference";
interface GalleryRecord {
  id: string;
  title: string;
  description: string;
  image: string;
  order: number;
}
export default function Gallery() {
  const { items, loading, error } = useLiveCollection<GalleryRecord>("gallery");
  const slides = items
    .filter((i) => i.image)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const [index, setIndex] = useState(0),
    [paused, pause] = useState(false),
    [open, setOpen] = useState(false),
    [engaged, engage] = useState(false);
  const reduced = useMotionPreference();
  const current = slides.length ? index % slides.length : 0;
  useEffect(() => {
    if (paused || open || engaged || reduced || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => i + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [paused, open, engaged, reduced, slides.length]);
  return (
    <section id="gallery" className="gallery-section">
      <div className="section-container">
        <p className="section-eyebrow">THE MOMENTS</p>
        <h2>Gallery</h2>
        {loading && <p>Loading gallery…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !slides.length && (
          <p>No gallery images are currently available.</p>
        )}
        {!!slides.length && (
          <div
            className="gallery-player"
            onMouseEnter={() => engage(true)}
            onMouseLeave={() => engage(false)}
            onFocusCapture={() => engage(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) engage(false);
            }}
          >
            <div
              className="gallery-stage"
              aria-roledescription="carousel"
              aria-label="Symposium gallery"
            >
              {slides.map((s, i) => (
                <figure key={s.id} hidden={i !== current}>
                  <img src={s.image} alt={s.title || "Symposium highlight"} loading={i === current ? "eager" : "lazy"} />
                  <figcaption>
                    <strong>{s.title}</strong>
                    <p>{s.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="gallery-navigation">
              <button
                aria-label="Previous gallery image"
                onClick={() => {
                  setIndex((current + slides.length - 1) % slides.length);
                  pause(true);
                }}
              >
                ←
              </button>
              <button
                aria-expanded={open}
                aria-controls="gallery-thumbnails"
                onClick={() => setOpen(!open)}
              >
                Browse all images · {current + 1} / {slides.length}{" "}
                {open ? "−" : "+"}
              </button>
              <button
                aria-label="Next gallery image"
                onClick={() => {
                  setIndex(current + 1);
                  pause(true);
                }}
              >
                →
              </button>
              {!reduced && (
                <button onClick={() => pause(!paused)}>
                  {paused ? "Play slideshow" : "Pause slideshow"}
                </button>
              )}
            </div>
            {open && (
              <div id="gallery-thumbnails" className="gallery-thumbnails">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    aria-pressed={i === current}
                    aria-label={`Show ${s.title || `image ${i + 1}`}`}
                    onClick={() => {
                      setIndex(i);
                      pause(true);
                    }}
                  >
                    <img src={s.image} alt="" loading="lazy" />
                    <span>{s.title || `Image ${i + 1}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
