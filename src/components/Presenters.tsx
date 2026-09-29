import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { Presenter } from "../types/presenter";

function Presenters() {
  const [presenters, setPresenters] =
    useState<Presenter[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPublishedPresenters =
      async () => {
        setLoading(true);
        setError("");

        try {
          const presentersQuery = query(
            collection(db, "presenters"),
            where("published", "==", true),
          );

          const snapshot =
            await getDocs(presentersQuery);

          const loadedPresenters: Presenter[] =
            snapshot.docs
              .map((presenterDoc) => {
                const data =
                  presenterDoc.data();

                return {
                  id: presenterDoc.id,
                  name: data.name ?? "",
                  role: data.role ?? "",
                  category:
                    data.category ?? "",
                  topic: data.topic ?? "",
                  biography:
                    data.biography ?? "",
                  imageUrl:
                    data.imageUrl ?? "",
                  linkedinUrl:
                    data.linkedinUrl ?? "",
                  order: Number(
                    data.order ?? 0,
                  ),
                  published:
                    data.published === true,
                };
              })
              .sort(
                (a, b) =>
                  a.order - b.order,
              );

          setPresenters(
            loadedPresenters,
          );
        } catch (loadError) {
          console.error(
            "Unable to load presenters:",
            loadError,
          );

          setError(
            "Presenter information is currently unavailable.",
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPublishedPresenters();
  }, []);

  return (
    <section
      id="presenters"
      className="content-section presenters-section"
    >
      <div className="content-container">
        <div className="section-heading-row">
          <div>
            <p className="section-label">
              PRESENTERS
            </p>

            <h2>
              Meet the Symposium Presenters
            </h2>

            <p>
              Discover the academics,
              researchers, students, industry
              professionals, and invited guests
              contributing to the MCS Symposium
              2026.
            </p>
          </div>

          <a
            href="#presenters"
            className="button button-primary"
          >
            View All Presenters
          </a>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading symposium presenters...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          presenters.length === 0 && (
            <div className="schedule-message">
              Presenter information will be
              published here once presenters
              are confirmed.
            </div>
          )}

        {!loading &&
          !error &&
          presenters.length > 0 && (
            <div className="presenter-grid">
              {presenters.map(
                (presenter) => (
                  <article
                    className="presenter-card"
                    key={presenter.id}
                  >
                    <div className="presenter-image-placeholder">
                      {presenter.imageUrl ? (
                        <img
                          src={
                            presenter.imageUrl
                          }
                          alt={
                            presenter.name
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="presenter-placeholder-content">
                          <span
                            className="presenter-placeholder-icon"
                            aria-hidden="true"
                          >
                            MCS
                          </span>

                          <span>
                            Presenter
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="presenter-content">
                      {presenter.category && (
                        <span className="presenter-category">
                          {
                            presenter.category
                          }
                        </span>
                      )}

                      <h3>
                        {presenter.name}
                      </h3>

                      {presenter.role && (
                        <p className="presenter-role">
                          {presenter.role}
                        </p>
                      )}

                      {presenter.topic && (
                        <div className="presenter-topic-block">
                          <span className="presenter-topic-label">
                            Presentation
                          </span>

                          <p className="presenter-topic">
                            {presenter.topic}
                          </p>
                        </div>
                      )}

                      {presenter.biography && (
                        <p className="presenter-biography">
                          {
                            presenter.biography
                          }
                        </p>
                      )}

                      {presenter.linkedinUrl && (
                        <a
                          href={
                            presenter.linkedinUrl
                          }
                          className="presenter-linkedin"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${presenter.name}'s LinkedIn profile`}
                        >
                          LinkedIn
                          <span
                            aria-hidden="true"
                            className="presenter-link-arrow"
                          >
                            ↗
                          </span>
                        </a>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
      </div>
    </section>
  );
}

export default Presenters;