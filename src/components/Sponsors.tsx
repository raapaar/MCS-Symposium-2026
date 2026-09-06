import { sponsors } from "../data/sponsors";

function Sponsors() {
  const publishedSponsors = sponsors.filter(
    (sponsor) => sponsor.published,
  );

  return (
    <section className="sponsors-section" id="sponsors">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Partners</span>

          <h2>Sponsors &amp; Partners</h2>

          <p>
            Organizations supporting the MCS Symposium 2026 and the
            Mathematics and Computing Science community.
          </p>
        </div>

        <div className="sponsors-grid">
          {publishedSponsors.map((sponsor) => (
            <article className="sponsor-card" key={sponsor.id}>
              <div className="sponsor-logo-wrapper">
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="sponsor-logo"
                />
              </div>

              <div className="sponsor-content">
                <span className="sponsor-category">
                  {sponsor.category}
                </span>

                <h3>{sponsor.name}</h3>

                <p>{sponsor.description}</p>

                <span className="sponsor-link">
                  Website information coming soon
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Sponsors;