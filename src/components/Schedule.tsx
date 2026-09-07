import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";

interface ScheduleProgram {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  location: string;
  order: number;
  published: boolean;
}

function Schedule() {
  const [programs, setPrograms] = useState<ScheduleProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPublishedPrograms = async () => {
      setLoading(true);
      setError("");

      try {
        const scheduleQuery = query(
          collection(db, "schedule"),
          where("published", "==", true),
        );

        const snapshot = await getDocs(scheduleQuery);

        const loadedPrograms: ScheduleProgram[] =
          snapshot.docs
            .map((scheduleDoc) => {
              const data = scheduleDoc.data();

              return {
                id: scheduleDoc.id,
                time: data.time ?? "",
                type: data.type ?? "",
                title: data.title ?? "",
                description: data.description ?? "",
                location: data.location ?? "",
                order: Number(data.order ?? 0),
                published: data.published === true,
              };
            })
            .sort((a, b) => a.order - b.order);

        setPrograms(loadedPrograms);
      } catch {
        setError(
          "The symposium schedule is currently unavailable.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPublishedPrograms();
  }, []);

  return (
    <section
      id="schedule"
      className="content-section schedule-section"
    >
      <div className="content-container">
        <div className="section-heading-row">
          <div>
            <p className="section-label">PROGRAM</p>

            <h2>Symposium Schedule</h2>

            <p>
              Explore the program, session times, presentation
              topics, and activities planned for MCS Symposium 2026.
            </p>
          </div>

          <a
            href="#schedule"
            className="button button-primary"
          >
            Full Program
          </a>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading symposium schedule...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading && !error && programs.length === 0 && (
          <div className="schedule-message">
            The symposium schedule will be published here once
            programs are confirmed.
          </div>
        )}

        {!loading && !error && programs.length > 0 && (
          <div className="schedule-list">
            {programs.map((item) => (
              <article
                className="schedule-item"
                key={item.id}
              >
                <div className="schedule-time">
                  <strong>{item.time}</strong>
                </div>

                <div className="schedule-details">
                  <span className="schedule-type">
                    {item.type}
                  </span>

                  <h3>{item.title}</h3>

                  {item.description && (
                    <p>{item.description}</p>
                  )}
                </div>

                <div className="schedule-location">
                  {item.location}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Schedule;