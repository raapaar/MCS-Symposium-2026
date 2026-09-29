import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type {
  Sponsor,
  SponsorTier,
} from "../types/sponsor";

function getSponsorTier(
  value: unknown,
): SponsorTier {
  if (
    value === "gold" ||
    value === "silver" ||
    value === "bronze"
  ) {
    return value;
  }

  // Backward compatibility for sponsor records
  // created before Phase 7.1C.
  return "partner";
}

function getSponsorTierLabel(
  tier: SponsorTier,
) {
  switch (tier) {
    case "gold":
      return "Gold Sponsor";

    case "silver":
      return "Silver Sponsor";

    case "bronze":
      return "Bronze Sponsor";

    default:
      return "Partner";
  }
}

function Sponsors() {
  const [sponsors, setSponsors] =
    useState<Sponsor[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadSponsors() {
      try {
        setLoading(true);
        setError("");

        const sponsorsQuery = query(
          collection(db, "sponsors"),
          where(
            "published",
            "==",
            true,
          ),
        );

        const snapshot =
          await getDocs(
            sponsorsQuery,
          );

        const loadedSponsors:
          Sponsor[] =
          snapshot.docs.map(
            (sponsorDocument) => {
              const data =
                sponsorDocument.data();

              return {
                id:
                  sponsorDocument.id,

                name:
                  data.name ?? "",

                description:
                  data.description ??
                  "",

                logo:
                  data.logo ?? "",

                logoPath:
                  data.logoPath ?? "",

                website:
                  data.website ?? "",

                category:
                  data.category ?? "",

                tier:
                  getSponsorTier(
                    data.tier,
                  ),

                order:
                  typeof data.order ===
                  "number"
                    ? data.order
                    : 0,

                published:
                  data.published ===
                  true,
              };
            },
          );

        loadedSponsors.sort(
          (a, b) =>
            a.order - b.order,
        );

        setSponsors(
          loadedSponsors,
        );
      } catch (err) {
        console.error(
          "Error loading sponsors:",
          err,
        );

        setError(
          "Unable to load sponsors and partners.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSponsors();
  }, []);

  return (
    <section
      className="sponsors-section"
      id="sponsors"
    >
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">
            Partners
          </span>

          <h2>
            Sponsors &amp;
            Partners
          </h2>

          <p>
            Organizations supporting
            the MCS Symposium 2026
            and the Mathematics and
            Computing Science
            community.
          </p>
        </div>

        {loading && (
          <p className="admin-message">
            Loading sponsors and
            partners...
          </p>
        )}

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          sponsors.length === 0 && (
            <p className="admin-message">
              No sponsors or
              partners are currently
              published.
            </p>
          )}

        {!loading &&
          !error &&
          sponsors.length > 0 && (
            <div className="sponsors-grid">
              {sponsors.map(
                (sponsor) => (
                  <article
                    className={`sponsor-card sponsor-card-${sponsor.tier}`}
                    key={
                      sponsor.id
                    }
                  >
                    <div className="sponsor-logo-wrapper">
                      {sponsor.logo ? (
                        <img
                          src={
                            sponsor.logo
                          }
                          alt={`${sponsor.name} logo`}
                          className="sponsor-logo"
                        />
                      ) : (
                        <div className="sponsor-logo-placeholder">
                          {sponsor.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="sponsor-content">
                      <div className="sponsor-meta">
                        <span
                          className={`sponsor-tier sponsor-tier-${sponsor.tier}`}
                        >
                          {getSponsorTierLabel(
                            sponsor.tier,
                          )}
                        </span>

                        {sponsor.category && (
                          <span className="sponsor-category">
                            {
                              sponsor.category
                            }
                          </span>
                        )}
                      </div>

                      <h3>
                        {
                          sponsor.name
                        }
                      </h3>

                      <p>
                        {
                          sponsor.description
                        }
                      </p>

                      {sponsor.website ? (
                        <a
                          href={
                            sponsor.website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sponsor-link"
                        >
                          Visit Website
                        </a>
                      ) : (
                        <span className="sponsor-link">
                          Website
                          information
                          coming soon
                        </span>
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

export default Sponsors;