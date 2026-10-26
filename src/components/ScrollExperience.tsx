import { useEffect, useRef } from "react";
import { useAppearance } from "../v2/appearanceState";
import { useMotionPreference } from "../hooks/useMotionPreference";

/** Progressive enhancement: native scroll and anchors remain in control. */
export default function ScrollExperience() {
  const progressRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionPreference();
  const { motion } = useAppearance();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    resizeObserver?.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !motion || typeof IntersectionObserver === "undefined") return;
    const main = document.getElementById("main-content");
    if (!main) return;
    const targets = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("v2-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    const observeHeadings = () => {
      main.querySelectorAll(".section-heading, .section-heading-row, .staff-heading, .event-about-container, .hod-content")
        .forEach((element) => {
          if (targets.has(element)) return;
          targets.add(element);
          element.classList.add("v2-reveal");
          observer.observe(element);
        });
    };
    observeHeadings();
    // Firebase sections may appear after the first render.
    const mutations = new MutationObserver(observeHeadings);
    mutations.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      targets.forEach((element) => element.classList.remove("v2-reveal", "v2-revealed"));
    };
  }, [reducedMotion, motion]);

  return <div className="v2-scroll-progress" aria-hidden="true"><div ref={progressRef} /></div>;
}
