import { useLiveCollection } from "../hooks/useLiveCollection";
import type { EventInfo } from "../types/event";
export default function Contact() {
  const { items } = useLiveCollection<EventInfo>("event");
  const event = items[0];
  if (!event) return null;
  const digits = event.whatsappNumber?.replace(/\D/g, "");
  const whatsapp = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hello, I would like to enquire about ${event.title || "the MCS Symposium"}.`)}`
    : "";
  return (
    <section
      id="whatsapp-contact"
      className="event-whatsapp-cta frontier-contact"
    >
      <div className="section-container">
        <p className="frontier-kicker">
          THE NEXT IDEA STARTS WITH A CONVERSATION
        </p>
        <div className="frontier-contact-grid">
          <h2>
            LET’S
            <br />
            <em>TALK.</em>
          </h2>
          <div>
            <p>
              Connect with the Mathematics and Computing Science Department
              about the symposium.
            </p>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="button event-whatsapp-button"
              >
                Chat on WhatsApp ↗
              </a>
            )}
            {event.contactEmail && (
              <a
                className="frontier-contact-detail"
                href={`mailto:${encodeURIComponent(event.contactEmail)}`}
              >
                {event.contactEmail} ↗
              </a>
            )}
            {event.contactPhone && (
              <a
                className="frontier-contact-detail"
                href={`tel:${event.contactPhone.replace(/[^+\d]/g, "")}`}
              >
                {event.contactPhone}
              </a>
            )}
            {!whatsapp && !event.contactEmail && !event.contactPhone && (
              <p>Contact information will be published here when confirmed.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
