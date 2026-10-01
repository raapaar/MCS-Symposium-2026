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

interface SponsorLogosProps {
  mode: "gold" | "footer";
}

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

function SponsorLogos({
  mode,
}: SponsorLogosProps) {
  const [sponsors, setSponsors] =
    useState<Sponsor[]>([]);

  useEffect(() => {
    let active = true;

    async function loadSponsors() {
      try {
        const sponsorQuery = query(
          collection(db, "sponsors"),
          where(
            "published",
            "==",
            true,
          ),
        );

        const snapshot =
          await getDocs(sponsorQuery);

        if (!active) {
          return;
        }

        const loadedSponsors: Sponsor[] =
          snapshot.docs
            .map((document) => {
              const data =
                document.data();

              return {
                id: document.id,
                name:
                  data.name ?? "",
                description:
                  data.description ?? "",
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
                  data.published === true,
              };
            })
            .sort(
              (a, b) =>
                a.order - b.order,
            );

        setSponsors(
          mode === "gold"
            ? loadedSponsors.filter(
                (sponsor) =>
                  sponsor.tier ===
                  "gold",
              )
            : loadedSponsors,
        );
      } catch (error) {
        console.error(
          "Unable to load sponsor logos:",
          error,
        );

        if (active) {
          setSponsors([]);
        }
      }
    }

    void loadSponsors();

    return () => {
      active = false;
    };
  }, [mode]);

  if (sponsors.length === 0) {
    return null;
  }

  if (mode === "gold") {
    return (
      <div className="hero-gold-sponsors">
        <span className="hero-sponsor-label">
          Gold Sponsors
        </span>

        <div className="hero-sponsor-logos">
          {sponsors.map((sponsor) => {
            const logo = sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
              />
            ) : (
              <span className="hero-sponsor-name">
                {sponsor.name}
              </span>
            );

            return sponsor.website ? (
              <a
                key={sponsor.id}
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-sponsor-logo"
                aria-label={`Visit ${sponsor.name}`}
              >
                {logo}
              </a>
            ) : (
              <div
                key={sponsor.id}
                className="hero-sponsor-logo"
              >
                {logo}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="footer-sponsors">
      <p className="footer-sponsor-heading">
        Sponsors &amp; Partners
      </p>

      <div className="footer-sponsor-logos">
        {sponsors.map((sponsor) => {
          const logo = sponsor.logo ? (
            <img
              src={sponsor.logo}
              alt={`${sponsor.name} logo`}
              loading="lazy"
            />
          ) : (
            <span className="footer-sponsor-name">
              {sponsor.name}
            </span>
          );

          return sponsor.website ? (
            <a
              key={sponsor.id}
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-sponsor-logo"
              aria-label={`Visit ${sponsor.name}`}
            >
              {logo}
            </a>
          ) : (
            <div
              key={sponsor.id}
              className="footer-sponsor-logo"
            >
              {logo}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SponsorLogos;