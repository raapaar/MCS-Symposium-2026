import { useEffect, useRef } from "react";
import { useMotionPreference } from "../hooks/useMotionPreference";
import { useAppearance } from "./appearanceState";
import { useLiveCollection } from "../hooks/useLiveCollection";

export function FrontierMotion() {
  const reduced = useMotionPreference();
  const { motion } = useAppearance();
  useEffect(() => {
    if (reduced || !motion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      document
        .querySelector<HTMLElement>(".frontier-hero-art")
        ?.style.setProperty(
          "--parallax",
          `${Math.min(120, window.scrollY * 0.18)}px`,
        );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
      document
        .querySelector<HTMLElement>(".frontier-hero-art")
        ?.style.removeProperty("--parallax");
    };
  }, [reduced, motion]);
  return null;
}
export function ExperienceMap() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const { motion } = useAppearance();
  return (
    <section className="frontier-experience" aria-labelledby="experience-title">
      <div className="section-container">
        <p className="frontier-kicker">EXPLORE THE SYMPOSIUM / DWU</p>
        <h2 id="experience-title">
          One gathering.
          <br />
          <em>Infinite possibilities.</em>
        </h2>
        <div
          ref={ref}
          className="frontier-bento"
          onPointerMove={(event) => {
            if (reduced || !motion || event.pointerType !== "mouse") return;
            const card = (event.target as HTMLElement).closest<HTMLElement>(
              ".frontier-tile",
            );
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty(
              "--tilt-x",
              `${((event.clientY - rect.top) / rect.height - 0.5) * -4}deg`,
            );
            card.style.setProperty(
              "--tilt-y",
              `${((event.clientX - rect.left) / rect.width - 0.5) * 4}deg`,
            );
          }}
          onPointerLeave={() =>
            ref.current
              ?.querySelectorAll<HTMLElement>(".frontier-tile")
              .forEach((card) => {
                card.style.removeProperty("--tilt-x");
                card.style.removeProperty("--tilt-y");
              })
          }
        >
          <a className="frontier-tile tile-discover" href="#presenters">
            <span>01 / PEOPLE & PROJECTS</span>
            <strong>
              MEET THE
              <br />
              <i>MINDS.</i>
            </strong>
            <p>Discover the ideas shaping what comes next.</p>
            <b aria-hidden="true">↗</b>
            <div className="tile-orbit" aria-hidden="true" />
          </a>
          <a className="frontier-tile tile-programme" href="#schedule">
            <span>02 / THE PROGRAMME</span>
            <strong>
              BE
              <br />
              <i>THERE.</i>
            </strong>
            <p>Your symposium. One live programme.</p>
            <b aria-hidden="true">↗</b>
          </a>
          <a className="frontier-tile tile-store" href="#store">
            <span>03 / SYMPOSIUM STORE</span>
            <strong>
              TAKE IT
              <br />
              <i>WITH YOU.</i>
            </strong>
            <p>Explore merchandise. Make a booking.</p>
            <b aria-hidden="true">↗</b>
            <div className="tile-cube" aria-hidden="true" />
          </a>
          <a className="frontier-tile tile-highlights" href="#gallery">
            <span>04 / THE MOMENTS</span>
            <strong>
              LOOK
              <br />
              <i>BACK.</i>
            </strong>
            <p>Explore the symposium gallery.</p>
            <b aria-hidden="true">↗</b>
          </a>
        </div>
      </div>
    </section>
  );
}
export function LiveSpotlight() {
  const { items } = useLiveCollection<{
    id: string;
    title: string;
    category?: string;
    summary?: string;
  }>("announcements");
  if (!items.length) return null;
  return (
    <aside
      className="frontier-live-strip"
      aria-label="Featured symposium updates"
    >
      <span className="frontier-live-label">
        <i /> LIVE UPDATES
      </span>
      <div className="frontier-live-items">
        {items.slice(0, 4).map((item) => (
          <a
            key={item.id}
            href={
              /store|merchandise/i.test(item.category || "")
                ? "#store"
                : /presenter|speaker/i.test(item.category || "")
                  ? "#presenters"
                  : /schedule|program/i.test(item.category || "")
                    ? "#schedule"
                    : "#announcements"
            }
          >
            <small>{item.category || "SYMPOSIUM"}</small>
            {item.title}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
