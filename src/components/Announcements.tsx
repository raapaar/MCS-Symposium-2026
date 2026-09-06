import { announcements } from "../data/announcements";

function Announcements() {
  const publishedAnnouncements = announcements.filter(
    (announcement) => announcement.published,
  );

  return (
    <section className="announcements-section" id="announcements">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Latest Updates</span>

          <h2>Announcements</h2>

          <p>
            Stay informed about the latest updates, program information, and
            developments for MCS Symposium 2026.
          </p>
        </div>

        <div className="announcements-grid">
          {publishedAnnouncements.map((announcement) => (
            <article
              className="announcement-card"
              key={announcement.id}
            >
              <div className="announcement-card-header">
                <span className="announcement-category">
                  {announcement.category}
                </span>

                <time dateTime={announcement.date}>
                  {new Date(announcement.date).toLocaleDateString("en-AU", {
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

              <button type="button" className="announcement-link">
                Read More
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Announcements;