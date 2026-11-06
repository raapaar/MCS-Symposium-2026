import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import type { ProgrammeControl } from "./programme";
export default function ProgrammeControlPanel() {
  const [control, setControl] = useState<ProgrammeControl>({
      mode: "auto",
      activeSegment: 0,
    }),
    [message, setMessage] = useState("");
  useEffect(
    () =>
      onSnapshot(
        doc(db, "siteSettings", "programme"),
        (s) => {
          const d = s.data();
          if (d)
            setControl({
              mode: d.mode === "manual" ? "manual" : "auto",
              activeSegment: Number(d.activeSegment) || 0,
            });
        },
        () => setMessage("Programme controls could not be loaded."),
      ),
    [],
  );
  async function save(value: ProgrammeControl) {
    try {
      await setDoc(doc(db, "siteSettings", "programme"), value);
      setMessage("Public timeline updated.");
    } catch {
      setMessage(
        "Unable to update the programme. Check your section privileges.",
      );
    }
  }
  return (
    <section className="control-programme">
      <h2>Live event progression</h2>
      <p>
        Automatic mode follows each published item's PNG start/end times. Manual
        mode holds the selected segment until you advance or return to
        automatic.
      </p>
      <p>
        Mode: {control.mode} ·{" "}
        {control.activeSegment === 0
          ? "Before event"
          : control.activeSegment === 5
            ? "Event complete"
            : `Segment ${control.activeSegment}`}
      </p>
      <div className="control-actions">
        <button onClick={() => void save({ ...control, mode: "auto" })}>
          Use automatic timing
        </button>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-pressed={
              control.mode === "manual" && control.activeSegment === n
            }
            onClick={() => void save({ mode: "manual", activeSegment: n })}
          >
            {n === 0
              ? "Before event"
              : n === 5
                ? "Complete event"
                : `Segment ${n}`}
          </button>
        ))}
        <button
          disabled={control.mode !== "manual" || control.activeSegment >= 5}
          onClick={() =>
            void save({
              mode: "manual",
              activeSegment: Math.min(5, control.activeSegment + 1),
            })
          }
        >
          Skip / next segment →
        </button>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
