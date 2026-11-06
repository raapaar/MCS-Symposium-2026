import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useLiveCollection } from "../hooks/useLiveCollection";
import type { ScheduleItem } from "../types/schedule";
import DetailDialog from "../v2/DetailDialog";
import { programmeStatus } from "../v2/programme";
import type { ProgrammeControl } from "../v2/programme";
export default function Schedule() {
  const { items, loading, error } = useLiveCollection<ScheduleItem>("schedule");
  const [control, setControl] = useState<ProgrammeControl>({
    mode: "auto",
    activeSegment: 0,
  });
  const [now, tick] = useState(Date.now),
    [selected, select] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => tick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () =>
      onSnapshot(
        doc(db, "siteSettings", "programme"),
        (s) => {
          const d = s.data();
          setControl({
            mode: d?.mode === "manual" ? "manual" : "auto",
            activeSegment: Number(d?.activeSegment) || 0,
          });
        },
        () => {},
      ),
    [],
  );
  const segments = [1, 2, 3, 4].map((number) => {
    const programs = items
      .filter((p) => (p.segment || 1) === number)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const statuses = programs.map((p) => programmeStatus(p, control, now));
    const status = statuses.includes("active")
      ? "active"
      : programs.length && statuses.every((s) => s === "completed")
        ? "completed"
        : "upcoming";
    return { number, programs, status };
  });
  const active = segments.find((s) => s.status === "active");
  return (
    <section id="schedule" className="content-section schedule-section">
      <div className="content-container">
        <p className="section-label">THE PROGRAMME / PNG TIME</p>
        <h2>Your day. In motion.</h2>
        <p>Swipe through the segments. Open a card for the full programme.</p>
        {loading && <p>Loading schedule…</p>}
        {error && <p role="alert">{error}</p>}
        <div className="programme-timeline" aria-label="Event progress">
          {segments.map((s) => (
            <button
              key={s.number}
              className={`timeline-${s.status}`}
              aria-current={s.status === "active" ? "step" : undefined}
              onClick={() => select(s.number)}
            >
              <b>0{s.number}</b>
              <span>Segment {s.number}</span>
              <small>{s.programs[0]?.title || "To be announced"}</small>
              <em>{s.status === "active" ? "Live" : s.status}</em>
            </button>
          ))}
        </div>
        <p className="programme-current" role="status">
          {active
            ? `Now: Segment ${active.number}`
            : segments.some((s) => s.status === "completed")
              ? "Programme progress shown above."
              : "Waiting for the published programme to begin."}{" "}
          ·{" "}
          {control.mode === "manual"
            ? "Staff-controlled progress"
            : "Automatic progress from published timings"}
        </p>
        <div className="programme-cards">
          {segments.map((s) => (
            <button
              key={s.number}
              className={`programme-card timeline-${s.status}`}
              onClick={() => select(s.number)}
            >
              <small>SEGMENT / 0{s.number}</small>
              <strong>{s.programs[0]?.type || `Segment ${s.number}`}</strong>
              <span>{s.programs[0]?.title || "Details coming soon"}</span>
              <p>{s.programs.length} programme items</p>
              <b>Open programme ↗</b>
            </button>
          ))}
        </div>
        {selected !== null && (
          <DetailDialog
            title={`Segment ${selected} programme`}
            close={() => select(null)}
          >
            <div className="programme-details">
              <p className="section-label">SYMPOSIUM PROGRAMME</p>
              <h2>Segment {selected}</h2>
              {segments[selected - 1].programs.length === 0 && (
                <p>No programmes published for this segment yet.</p>
              )}
              {segments[selected - 1].programs.map((p) => (
                <article key={p.id}>
                  <time>{p.time}</time>
                  <div>
                    <h3>{p.title}</h3>
                    <p>{p.presenterName || p.type}</p>
                    <p>{p.location}</p>
                    <p>{p.description}</p>
                    <span className="store-status">
                      {programmeStatus(p, control, now)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </DetailDialog>
        )}
      </div>
    </section>
  );
}
