import { useState } from "react";
import { useLiveCollection } from "../hooks/useLiveCollection";
import type { Presenter, SpeakerType } from "../types/presenter";
import DetailDialog from "../v2/DetailDialog";
const groups: [SpeakerType, string][] = [
  ["keynote", "Keynote Speakers"],
  ["guest", "Guest Speakers"],
  ["presenter", "Student Presenters"],
];
const safeLink = (url: string | undefined) =>
  !!url && /^https?:\/\//i.test(url);
export default function Presenters() {
  const { items, loading, error } = useLiveCollection<Presenter>("presenters");
  const [selected, select] = useState<Presenter | null>(null);
  return (
    <section id="presenters" className="content-section poster-section">
      <div className="content-container">
        <p className="section-label">PEOPLE / IDEAS / IMPACT</p>
        <h2>Meet the minds.</h2>
        {loading && <p>Loading speakers and presenters…</p>}
        {error && <p role="alert">{error}</p>}
        {groups.map(([type, label]) => (
          <div
            key={type}
            id={type === "keynote" ? "keynote-speakers" : `${type}-speakers`}
            className={`poster-group poster-${type}`}
          >
            <h3>{label}</h3>
            <div className="poster-grid">
              {items
                .filter((p) => (p.speakerType || "presenter") === type)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((p) => (
                  <article key={p.id} className="speaker-poster">
                    <button
                      className="poster-open"
                      onClick={() => select(p)}
                      aria-label={`View ${p.name}'s ${type === "presenter" ? "project" : "speaker"} details`}
                    >
                      <span className="poster-kicker">
                        MCS /{" "}
                        {type === "presenter"
                          ? "STUDENT PROJECT"
                          : `${type.toUpperCase()} SPEAKER`}
                      </span>
                      <strong className="poster-topic">
                        {p.topic || label}
                      </strong>
                      <span className="poster-photo">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} loading="lazy" />
                        ) : (
                          <span>MCS</span>
                        )}
                      </span>
                      <span className="poster-person">
                        <strong>{p.name}</strong>
                        <span>{p.role || label}</span>
                      </span>
                      <span className="poster-expand">Explore details ↗</span>
                    </button>
                    {safeLink(p.linkedinUrl) && (
                      <a
                        className="poster-linkedin"
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </article>
                ))}
            </div>
            {!loading &&
              !error &&
              !items.some((p) => (p.speakerType || "presenter") === type) && (
                <p>Details will appear when published.</p>
              )}
          </div>
        ))}
        {selected && (
          <DetailDialog
            title={`${selected.name} details`}
            close={() => select(null)}
          >
            <div
              className={`speaker-landscape poster-${selected.speakerType || "presenter"}`}
            >
              <div className="landscape-copy">
                <p className="section-label">
                  {groups.find(([t]) => t === selected.speakerType)?.[1] ||
                    "Student Presenter"}
                </p>
                <h2>{selected.topic || selected.name}</h2>
                <h3>{selected.name}</h3>
                <p>{selected.role}</p>
                <p>{selected.biography}</p>
                <p>{selected.projectDescription}</p>
                {safeLink(selected.linkedinUrl) && (
                  <a
                    href={selected.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn profile ↗
                  </a>
                )}
                {safeLink(selected.projectUrl) && (
                  <a
                    href={selected.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore project ↗
                  </a>
                )}
                {selected.projectLogoUrl && (
                  <img
                    className="project-logo"
                    src={selected.projectLogoUrl}
                    alt={`${selected.topic || selected.name} project logo`}
                  />
                )}
              </div>
              <div className="landscape-photo">
                {selected.imageUrl && (
                  <img src={selected.imageUrl} alt={selected.name} />
                )}
              </div>
            </div>
            {!!selected.screenshots?.length && (
              <div className="project-screenshots">
                {selected.screenshots.map((s, i) => (
                  <figure key={s.url}>
                    <img
                      src={s.url}
                      alt={`${selected.topic} project screenshot ${i + 1}`}
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            )}
          </DetailDialog>
        )}
      </div>
    </section>
  );
}
