import {
  useEffect,
  useState,
} from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type {
  Presenter,
  PresenterScreenshot,
  SpeakerType,
} from "../types/presenter";

function Presenters() {
  const [presenters, setPresenters] = useState<
    Presenter[]
  >([]);

  const [selectedPresenter, setSelectedPresenter] =
    useState<Presenter | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPublishedPresenters = async () => {
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
              const data = presenterDoc.data();

              const speakerType: SpeakerType =
                data.speakerType === "keynote"
                  ? "keynote"
                  : "presenter";

              const screenshots: PresenterScreenshot[] =
                Array.isArray(data.screenshots)
                  ? data.screenshots
                      .filter(
                        (
                          screenshot: unknown,
                        ): screenshot is {
                          url?: unknown;
                          path?: unknown;
                        } =>
                          typeof screenshot ===
                            "object" &&
                          screenshot !== null,
                      )
                      .map((screenshot) => ({
                        url:
                          typeof screenshot.url ===
                          "string"
                            ? screenshot.url
                            : "",
                        path:
                          typeof screenshot.path ===
                          "string"
                            ? screenshot.path
                            : "",
                      }))
                      .filter(
                        (screenshot) =>
                          Boolean(screenshot.url),
                      )
                  : [];

              return {
                id: presenterDoc.id,
                name: data.name ?? "",
                role: data.role ?? "",
                category:
                  data.category ?? "",
                speakerType,
                topic: data.topic ?? "",
                biography:
                  data.biography ?? "",
                projectDescription:
                  data.projectDescription ?? "",
                projectUrl:
                  data.projectUrl ?? "",
                imageUrl:
                  data.imageUrl ?? "",
                imagePath:
                  data.imagePath ?? "",
                screenshots,
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

        setPresenters(loadedPresenters);
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

  useEffect(() => {
    if (!selectedPresenter) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setSelectedPresenter(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [selectedPresenter]);

  const keynoteSpeakers = presenters.filter(
    (presenter) =>
      presenter.speakerType === "keynote",
  );

  const symposiumPresenters = presenters.filter(
    (presenter) =>
      presenter.speakerType === "presenter",
  );

  const renderPresenterCard = (
    presenter: Presenter,
  ) => {
    const isKeynote =
      presenter.speakerType === "keynote";

    return (
      <article
        className="presenter-card"
        key={presenter.id}
      >
        <div className="presenter-image-placeholder">
          {presenter.imageUrl ? (
            <img
              src={presenter.imageUrl}
              alt={presenter.name}
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
                {isKeynote
                  ? "Keynote Speaker"
                  : "Presenter"}
              </span>
            </div>
          )}
        </div>

        <div className="presenter-content">
          <div className="presenter-card-labels">
            <span className="presenter-category">
              {isKeynote
                ? "Keynote Speaker"
                : presenter.category ||
                  "Presenter"}
            </span>
          </div>

          <h3>{presenter.name}</h3>

          {presenter.role && (
            <p className="presenter-role">
              {presenter.role}
            </p>
          )}

          {presenter.topic && (
            <div className="presenter-topic-block">
              <span className="presenter-topic-label">
                {isKeynote
                  ? "Keynote Presentation"
                  : "Project / Presentation"}
              </span>

              <p className="presenter-topic">
                {presenter.topic}
              </p>
            </div>
          )}

    

          <div className="presenter-card-actions">
            <button
              type="button"
              className="button button-primary presenter-view-button"
              onClick={() =>
                setSelectedPresenter(presenter)
              }
            >
              {isKeynote
                ? "View Presentation"
                : "View Project"}
            </button>

            {presenter.linkedinUrl && (
              <a
                href={presenter.linkedinUrl}
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
        </div>
      </article>
    );
  };

  return (
    <>
      {loading && (
        <section className="content-section presenters-section">
          <div className="content-container">
            <div className="schedule-message">
              Loading symposium presenters...
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="content-section presenters-section">
          <div className="content-container">
            <div className="schedule-message schedule-message-error">
              {error}
            </div>
          </div>
        </section>
      )}

      {!loading &&
        !error &&
        keynoteSpeakers.length > 0 && (
          <section
            id="keynote-speakers"
            className="content-section keynote-section"
          >
            <div className="content-container">
              <div className="section-heading-row">
                <div>
                  <p className="section-label">
                    KEYNOTE SPEAKERS
                  </p>

                  <h2>
                    Symposium Keynote Speakers
                  </h2>

                  <p>
                    Meet the invited keynote
                    speakers sharing expertise,
                    research, and industry
                    perspectives at the MCS
                    Symposium 2026.
                  </p>
                </div>
              </div>

              <div className="presenter-grid keynote-grid">
                {keynoteSpeakers.map(
                  renderPresenterCard,
                )}
              </div>
            </div>
          </section>
        )}

      {!loading && !error && (
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
                  professionals, and invited
                  guests contributing to the MCS
                  Symposium 2026.
                </p>
              </div>
            </div>

            {symposiumPresenters.length ===
              0 && (
              <div className="schedule-message">
                Presenter information will be
                published here once presenters
                are confirmed.
              </div>
            )}

            {symposiumPresenters.length >
              0 && (
              <div className="presenter-grid">
                {symposiumPresenters.map(
                  renderPresenterCard,
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {selectedPresenter && (
        <div
          className="presenter-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedPresenter(null);
            }
          }}
        >
          <div
            className="presenter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="presenter-modal-title"
          >
            <button
              type="button"
              className="presenter-modal-close"
              aria-label="Close presenter details"
              onClick={() =>
                setSelectedPresenter(null)
              }
            >
              ×
            </button>

            <div className="presenter-modal-header">
              <div className="presenter-modal-profile">
                <div className="presenter-modal-image">
                  {selectedPresenter.imageUrl ? (
                    <img
                      src={
                        selectedPresenter.imageUrl
                      }
                      alt={
                        selectedPresenter.name
                      }
                    />
                  ) : (
                    <div className="presenter-placeholder-content">
                      <span
                        className="presenter-placeholder-icon"
                        aria-hidden="true"
                      >
                        MCS
                      </span>
                    </div>
                  )}
                </div>

                <div className="presenter-modal-person">
                  <span className="presenter-category">
                    {selectedPresenter.speakerType ===
                    "keynote"
                      ? "Keynote Speaker"
                      : selectedPresenter.category ||
                        "Presenter"}
                  </span>

                  <h2 id="presenter-modal-title">
                    {selectedPresenter.name}
                  </h2>

                  {selectedPresenter.role && (
                    <p className="presenter-role">
                      {selectedPresenter.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="presenter-modal-body">
              {selectedPresenter.topic && (
                <section className="presenter-modal-section">
                  <p className="presenter-topic-label">
                    {selectedPresenter.speakerType ===
                    "keynote"
                      ? "Keynote Presentation"
                      : "Project / Presentation"}
                  </p>

                  <h3>
                    {selectedPresenter.topic}
                  </h3>
                </section>
              )}

              {selectedPresenter.projectDescription && (
                <section className="presenter-modal-section">
                  <h3>
                    {selectedPresenter.speakerType ===
                    "keynote"
                      ? "Presentation Details"
                      : "Project Details"}
                  </h3>

                  <p className="presenter-modal-description">
                    {
                      selectedPresenter.projectDescription
                    }
                  </p>
                </section>
              )}

              {selectedPresenter.biography && (
                <section className="presenter-modal-section">
                  <h3>
                    About{" "}
                    {selectedPresenter.name}
                  </h3>

                  <p className="presenter-modal-description">
                    {
                      selectedPresenter.biography
                    }
                  </p>
                </section>
              )}

              {selectedPresenter.screenshots
                .length > 0 && (
                <section className="presenter-modal-section">
                  <h3>
                    {selectedPresenter.speakerType ===
                    "keynote"
                      ? "Presentation Gallery"
                      : "Project Screenshots"}
                  </h3>

                  <div className="presenter-screenshot-grid">
                    {selectedPresenter.screenshots.map(
                      (screenshot, index) => (
                        <a
                          key={`${screenshot.path}-${index}`}
                          href={screenshot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="presenter-screenshot-link"
                        >
                          <img
                            src={screenshot.url}
                            alt={`${selectedPresenter.name} ${
                              selectedPresenter.speakerType ===
                              "keynote"
                                ? "presentation"
                                : "project"
                            } screenshot ${index + 1}`}
                            loading="lazy"
                          />
                        </a>
                      ),
                    )}
                  </div>
                </section>
              )}

              <div className="presenter-modal-actions">
                {selectedPresenter.projectUrl && (
                  <a
                    href={
                      selectedPresenter.projectUrl
                    }
                    className="button button-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedPresenter.speakerType ===
                    "keynote"
                      ? "Open Presentation Link"
                      : "Visit Project"}
                  </a>
                )}

                {selectedPresenter.linkedinUrl && (
                  <a
                    href={
                      selectedPresenter.linkedinUrl
                    }
                    className="button button-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Presenters;