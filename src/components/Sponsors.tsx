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

        const loadedSponsors: Sponsor[] =
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
      className="sponsors-section partner-feature-section"
      id="sponsors"
    >
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">
            Partners
          </span>

          <h2>
            Sponsors &amp; Partners
          </h2>

          <p>
            Organizations supporting
            the MCS Symposium 2026 and
            the Mathematics and
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
              No sponsors or partners
              are currently published.
            </p>
          )}

        {!loading &&
          !error &&
          sponsors.length > 0 && (
            <div className="partner-feature-list">
              {sponsors.map(
                (
                  sponsor,
                  index,
                ) => (
                  <article
                    className={`partner-feature-card partner-feature-${sponsor.tier} ${
                      index % 2 === 1
                        ? "partner-feature-reverse"
                        : ""
                    }`}
                    key={
                      sponsor.id
                    }
                  >
                    <div className="partner-feature-image">
                      {sponsor.logo ? (
                        <img
                          src={
                            sponsor.logo
                          }
                          alt={`${sponsor.name} logo`}
                        />
                      ) : (
                        <div className="partner-feature-placeholder">
                          {sponsor.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="partner-feature-content">
                      <div className="partner-feature-meta">
                        <span
                          className={`partner-feature-tier partner-feature-tier-${sponsor.tier}`}
                        >
                          {getSponsorTierLabel(
                            sponsor.tier,
                          )}
                        </span>

                        {sponsor.category && (
                          <span className="partner-feature-category">
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

                      {sponsor.description && (
                        <p className="partner-feature-description">
                          {
                            sponsor.description
                          }
                        </p>
                      )}

                      {sponsor.website && (
                        <a
                          href={
                            sponsor.website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="partner-feature-link"
                        >
                          Visit Website
                          <span
                            aria-hidden="true"
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

export default Sponsors;