import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { EventInfo as EventInfoType } from "../types/event";

function EventInfo() {
  const [event, setEvent] = useState<EventInfoType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const eventQuery = query(
          collection(db, "event"),
          where("published", "==", true),
        );

        const snapshot = await getDocs(eventQuery);

        if (snapshot.empty) {
          setEvent(null);
          return;
        }

        const document = snapshot.docs[0];
        const data = document.data();

        setEvent({
          id: document.id,
          title: data.title ?? "",
          department: data.department ?? "",
          university: data.university ?? "",
          year: data.year ?? new Date().getFullYear(),
          description: data.description ?? "",
          venue: data.venue ?? "",
          location: data.location ?? "",
          contactEmail: data.contactEmail ?? "",
          contactPhone: data.contactPhone ?? "",
          published: data.published ?? false,
        });
      } catch (error) {
        console.error("Error loading event information:", error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, []);

  if (loading || !event) {
    return null;
  }

  return (
    <section className="event-information">
      <div className="content-container event-grid">
        <div className="event-item">
          <span className="event-label">EVENT</span>
          <strong>{event.title}</strong>
        </div>

        <div className="event-item">
          <span className="event-label">DEPARTMENT</span>
          <strong>{event.department}</strong>
        </div>

        <div className="event-item">
          <span className="event-label">UNIVERSITY</span>
          <strong>{event.university}</strong>
        </div>

        <div className="event-item">
          <span className="event-label">YEAR</span>
          <strong>{event.year}</strong>
        </div>
      </div>
    </section>
  );
}

export default EventInfo;