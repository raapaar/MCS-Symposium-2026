import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { Announcement } from "../types/announcement";

function Announcements() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPublishedAnnouncements = async () => {
      setLoading(true);
      setError("");

      try {
        const announcementsQuery = query(
          collection(db, "announcements"),
          where("published", "==", true),
        );

        const snapshot = await getDocs(
          announcementsQuery,
        );

        const loadedAnnouncements: Announcement[] =
          snapshot.docs.map((announcementDoc) => {
            const data = announcementDoc.data();

            return {
              id: announcementDoc.id,
              title: data.title ?? "",
              summary: data.summary ?? "",
              date: data.date ?? "",
              category: data.category ?? "",
              published: data.published === true,
            };
          });

        loadedAnnouncements.sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime(),
        );

        setAnnouncements(loadedAnnouncements);
      } catch {
        setError(
          "Announcement information is currently unavailable.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPublishedAnnouncements();
  }, []);

  return (
    <section
      className="announcements-section"
      id="announcements"
    >
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">
            Latest Updates
          </span>

          <h2>Announcements</h2>

          <p>
            Stay informed about the latest updates, program
            information, and developments for MCS Symposium
            2026.
          </p>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading announcements...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          announcements.length === 0 && (
            <div className="schedule-message">
              No announcements have been published yet.
            </div>
          )}

        {!loading &&
          !error &&
          announcements.length > 0 && (
            <div className="announcements-grid">
              {announcements.map((announcement) => (
                <article
                  className="announcement-card"
                  key={announcement.id}
                >
                  <div className="announcement-card-header">
                    <span className="announcement-category">
                      {announcement.category}
                    </span>

                    <time
                      dateTime={announcement.date}
                    >
                      {new Date(
                        announcement.date,
                      ).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <div className="announcement-card-content">
                    <h3>{announcement.title}</h3>

                    <p>{announcement.summary}</p>
                  </div>

                  <button
                    type="button"
                    className="announcement-link"
                  >
                    Read More
                  </button>
                </article>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}

export default Announcements;