import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { Sponsor } from "../types/sponsor";

function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSponsors() {
      try {
        setLoading(true);
        setError("");

    const sponsorsQuery = query(
  collection(db, "sponsors"),
  where("published", "==", true),
);

        const snapshot = await getDocs(sponsorsQuery);

        const loadedSponsors: Sponsor[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name ?? "",
          description: doc.data().description ?? "",
          logo: doc.data().logo ?? "",
          website: doc.data().website ?? "",
          category: doc.data().category ?? "",
          order: doc.data().order ?? 0,
          published: doc.data().published ?? false,
        }));

       loadedSponsors.sort((a, b) => a.order - b.order);

setSponsors(loadedSponsors);
      } catch (err) {
        console.error("Error loading sponsors:", err);
        setError("Unable to load sponsors and partners.");
      } finally {
        setLoading(false);
      }
    }

    loadSponsors();
  }, []);

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

        {loading && (
          <p className="admin-message">Loading sponsors and partners...</p>
        )}

        {error && <p className="admin-error">{error}</p>}

        {!loading && !error && sponsors.length === 0 && (
          <p className="admin-message">
            No sponsors or partners are currently published.
          </p>
        )}

        {!loading && !error && sponsors.length > 0 && (
          <div className="sponsors-grid">
            {sponsors.map((sponsor) => (
              <article className="sponsor-card" key={sponsor.id}>
                <div className="sponsor-logo-wrapper">
                  {sponsor.logo ? (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="sponsor-logo"
                    />
                  ) : (
                    <div className="sponsor-logo-placeholder">
                      {sponsor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="sponsor-content">
                  <span className="sponsor-category">
                    {sponsor.category}
                  </span>

                  <h3>{sponsor.name}</h3>

                  <p>{sponsor.description}</p>

                  {sponsor.website ? (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sponsor-link"
                    >
                      Visit Website
                    </a>
                  ) : (
                    <span className="sponsor-link">
                      Website information coming soon
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Sponsors;