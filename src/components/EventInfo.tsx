import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { EventInfo as EventInfoType } from "../types/event";
import SponsorLogos from "./SponsorLogos";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  started: boolean;
}

function calculateCountdown(
  eventDate: string,
  eventStartTime: string,
): Countdown {
  if (!eventDate || !eventStartTime) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: false,
    };
  }

  /*
   * DWU/Madang uses Papua New Guinea time (UTC+10).
   * Explicitly supplying the offset prevents the countdown
   * from changing according to the visitor's local timezone.
   */
  const target = new Date(
    `${eventDate}T${eventStartTime}:00+10:00`,
  ).getTime();

  if (Number.isNaN(target)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: false,
    };
  }

  const difference = target - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: true,
    };
  }

  return {
    days: Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ),

    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24,
    ),

    minutes: Math.floor(
      (difference / (1000 * 60)) % 60,
    ),

    seconds: Math.floor(
      (difference / 1000) % 60,
    ),

    started: false,
  };
}

function EventInfo() {
  const [event, setEvent] =
    useState<EventInfoType | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [countdown, setCountdown] =
    useState<Countdown>({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      started: false,
    });

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      try {
        const eventQuery = query(
          collection(db, "event"),
          where(
            "published",
            "==",
            true,
          ),
        );

        const snapshot =
          await getDocs(eventQuery);

        if (
          !active ||
          snapshot.empty
        ) {
          if (active) {
            setEvent(null);
          }

          return;
        }

        const document =
          snapshot.docs[0];

        const data =
          document.data();

        const loadedEvent: EventInfoType = {
          id: document.id,

          title:
            data.title ?? "",

          department:
            data.department ?? "",

          university:
            data.university ?? "",

          year:
            typeof data.year ===
            "number"
              ? data.year
              : new Date().getFullYear(),

          description:
            data.description ?? "",

          venue:
            data.venue ?? "",

          location:
            data.location ?? "",

          aboutTitle:
            data.aboutTitle ??
            "About the Symposium",

          aboutContent:
            data.aboutContent ??
            data.description ??
            "",

          eventDate:
            data.eventDate ?? "",

          eventStartTime:
            data.eventStartTime ?? "",

          contactEmail:
            data.contactEmail ?? "",

          contactPhone:
            data.contactPhone ?? "",

          whatsappNumber:
            data.whatsappNumber ?? "",

          hodName:
            data.hodName ?? "",

          hodTitle:
            data.hodTitle ??
            "Head of Department",

          hodMessage:
            data.hodMessage ?? "",

          hodImageUrl:
            data.hodImageUrl ?? "",

          hodImagePath:
            data.hodImagePath ?? "",

          heroTagline:
            data.heroTagline ?? "",

          heroImageUrl:
            data.heroImageUrl ?? "",

          heroImagePath:
            data.heroImagePath ?? "",

          published:
            data.published === true,
        };

        if (active) {
          setEvent(loadedEvent);
        }
      } catch (error) {
        console.error(
          "Error loading event information:",
          error,
        );

        if (active) {
          setEvent(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadEvent();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !event?.eventDate ||
      !event.eventStartTime
    ) {
      return;
    }

    const updateCountdown = () => {
      setCountdown(
        calculateCountdown(
          event.eventDate,
          event.eventStartTime,
        ),
      );
    };

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    event?.eventDate,
    event?.eventStartTime,
  ]);

  const formattedDate =
    useMemo(() => {
      if (!event?.eventDate) {
        return "";
      }

      const date = new Date(
        `${event.eventDate}T00:00:00+10:00`,
      );

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return event.eventDate;
      }

      return new Intl.DateTimeFormat(
        "en-PG",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone:
            "Pacific/Port_Moresby",
        },
      ).format(date);
    }, [event?.eventDate]);

  const formattedTime =
    useMemo(() => {
      if (
        !event?.eventDate ||
        !event.eventStartTime
      ) {
        return "";
      }

      const date = new Date(
        `${event.eventDate}T${event.eventStartTime}:00+10:00`,
      );

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return event.eventStartTime;
      }

      return new Intl.DateTimeFormat(
        "en-PG",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone:
            "Pacific/Port_Moresby",
        },
      ).format(date);
    }, [
      event?.eventDate,
      event?.eventStartTime,
    ]);

  const whatsappUrl =
    useMemo(() => {
      if (!event?.whatsappNumber) {
        return "";
      }

      const digits =
        event.whatsappNumber.replace(
          /\D/g,
          "",
        );

      if (!digits) {
        return "";
      }

      const message =
        encodeURIComponent(
          `Hello, I would like to enquire about ${event.title || "MCS Symposium 2026"}.`,
        );

      return `https://wa.me/${digits}?text=${message}`;
    }, [
      event?.whatsappNumber,
      event?.title,
    ]);

  if (loading || !event) {
    return null;
  }

  return (
    <>
      {/* Dynamic Event Hero */}
      <section
        className="event-hero"
        style={
          event.heroImageUrl
            ? {
                backgroundImage: `linear-gradient(
                  110deg,
                  rgba(45, 0, 12, 0.94),
                  rgba(115, 0, 30, 0.82),
                  rgba(35, 0, 9, 0.88)
                ),
                url("${event.heroImageUrl}")`,
              }
            : undefined
        }
      >
        <div className="event-hero-inner">
          <p className="event-hero-eyebrow">
  DIVINE WORD UNIVERSITY
</p>

          <h1>
            {event.title ||
              "MCS Symposium 2026"}
          </h1>

          {event.heroTagline && (
            <p className="event-hero-tagline">
              {event.heroTagline}
            </p>
          )}

          <div className="event-hero-meta">
            {formattedDate && (
              <span>
                {formattedDate}
              </span>
            )}

            {formattedTime && (
              <span>
                {formattedTime} PNG Time
              </span>
            )}

            {event.venue && (
              <span>
                {event.venue}
              </span>
            )}

            {event.location && (
              <span>
                {event.location}
              </span>
            )}
          </div>

          <div className="event-hero-actions">
            <a
              href="#presenters"
              className="button event-primary-button"
            >
              Explore Symposium
            </a>

            <a
              href="#schedule"
              className="button event-secondary-button"
            >
              View Schedule
            </a>
          </div>

       {event.eventDate &&
  event.eventStartTime && (
    <div className="event-countdown">
      {countdown.started ? (
        <div className="event-live-message">
          The Symposium Is Underway
        </div>
      ) : (
        <>
          <div className="countdown-heading">
            Symposium Begins In
          </div>

          <div className="countdown-grid">
            <div className="countdown-item">
              <strong>{countdown.days}</strong>
              <span>Days</span>
            </div>

            <div className="countdown-item">
              <strong>
                {String(countdown.hours).padStart(2, "0")}
              </strong>
              <span>Hours</span>
            </div>

            <div className="countdown-item">
              <strong>
                {String(countdown.minutes).padStart(2, "0")}
              </strong>
              <span>Minutes</span>
            </div>

            <div className="countdown-item">
              <strong>
                {String(countdown.seconds).padStart(2, "0")}
              </strong>
              <span>Seconds</span>
            </div>
          </div>

          <div className="countdown-sponsors">
            <SponsorLogos mode="gold" />
          </div>
        </>
      )}
    </div>
  )}
        </div>
      </section>

      {/* Event Summary */}
      <section className="event-information">
        <div className="content-container event-grid">
          <div className="event-item">
            <span className="event-label">
              EVENT
            </span>

            <strong>
              {event.title}
            </strong>
          </div>

          <div className="event-item">
            <span className="event-label">
              DATE
            </span>

            <strong>
              {formattedDate ||
                "To be confirmed"}
            </strong>
          </div>

          <div className="event-item">
            <span className="event-label">
              VENUE
            </span>

            <strong>
              {event.venue ||
                "To be confirmed"}
            </strong>
          </div>

          <div className="event-item">
            <span className="event-label">
              DEPARTMENT
            </span>

            <strong>
              {event.department}
            </strong>
          </div>
        </div>
      </section>

      {/* Dynamic About */}
      <section
        id="symposium"
        className="content-section event-about-section"
      >
        <div className="content-container event-about-container">
          <p className="section-label">
            ABOUT THE SYMPOSIUM
          </p>

          <h2>
            {event.aboutTitle ||
              "About the Symposium"}
          </h2>

          <p className="event-about-content">
            {event.aboutContent ||
              event.description}
          </p>
        </div>
      </section>

      {/* Head of Department Welcome */}
      {(event.hodName ||
        event.hodMessage ||
        event.hodImageUrl) && (
        <section
          id="hod-welcome"
          className="hod-section"
        >
          <div className="content-container hod-container">
            <div className="hod-image-column">
              {event.hodImageUrl ? (
                <img
                  src={
                    event.hodImageUrl
                  }
                  alt={
                    event.hodName ||
                    "Head of Department"
                  }
                  className="hod-image"
                />
              ) : (
                <div className="hod-image-placeholder">
                  MCS
                </div>
              )}
            </div>

            <div className="hod-content">
              <p className="section-label">
                WELCOME MESSAGE
              </p>

              <h2>
                From the Head of
                Department
              </h2>

              {event.hodMessage && (
                <p className="hod-message">
                  {event.hodMessage}
                </p>
              )}

              {event.hodName && (
                <div className="hod-signature">
                  <strong>
                    {event.hodName}
                  </strong>

                  <span>
                    {event.hodTitle ||
                      "Head of Department"}
                  </span>

                  <span>
                    {event.department}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      {whatsappUrl && (
         <section
    id="whatsapp-contact"
    className="event-whatsapp-cta"
  >
          <div className="content-container event-whatsapp-inner">
            <div>
              <p className="section-label">
                SYMPOSIUM ENQUIRIES
              </p>

              <h2>
                Have a Question?
              </h2>

              <p>
                Chat with the Mathematics
                and Computing Science
                Department about the
                symposium.
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button event-whatsapp-button"
            >
              Chat on WhatsApp
            </a>
          </div>
        </section>
      )}
    </>
  );
}

export default EventInfo;