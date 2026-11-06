import { useState } from "react";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { answerEnquiry } from "./enquiry";
import type { KnowledgeEntry } from "./enquiry";
interface PublicRecord {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  summary?: string;
  question?: string;
  answer?: string;
  topic?: string;
  role?: string;
  biography?: string;
  projectDescription?: string;
  time?: string;
  location?: string;
  venue?: string;
  eventDate?: string;
  eventStartTime?: string;
  aboutContent?: string;
  priceCents?: number;
}
function knowledge(
  items: PublicRecord[],
  href: string,
  kind: string,
): KnowledgeEntry[] {
  return items.map((i) => ({
    id: `${kind}-${i.id}`,
    title: i.title || i.question || i.name || kind,
    text: [
      i.description,
      i.content,
      i.summary,
      i.answer,
      i.topic,
      i.role,
      i.biography,
      i.projectDescription,
      i.time,
      i.venue,
      i.location,
      i.eventDate,
      i.eventStartTime ? `${i.eventStartTime} PNG time` : "",
      i.aboutContent,
      typeof i.priceCents === "number"
        ? `Price: PGK ${(i.priceCents / 100).toFixed(2)}`
        : "",
    ]
      .filter(Boolean)
      .join(". "),
    href,
  }));
}
export default function Contact() {
  const event = useLiveCollection<PublicRecord>("event"),
    schedule = useLiveCollection<PublicRecord>("schedule"),
    presenters = useLiveCollection<PublicRecord>("presenters"),
    announcements = useLiveCollection<PublicRecord>("announcements"),
    merchandise = useLiveCollection<PublicRecord>("merchandise"),
    faq = useLiveCollection<PublicRecord>("enquiries"),
    documents = useLiveCollection<PublicRecord>("documents"),
    sponsors = useLiveCollection<PublicRecord>("sponsors");
  const [question, setQuestion] = useState(""),
    [history, setHistory] = useState<
      { question: string; matches: KnowledgeEntry[] }[]
    >([]);
  const entries = [
    ...knowledge(event.items, "/#symposium", "Event"),
    ...knowledge(schedule.items, "/#schedule", "Schedule"),
    ...knowledge(presenters.items, "/#presenters", "Speakers & projects"),
    ...knowledge(announcements.items, "/#announcements", "Announcements"),
    ...knowledge(merchandise.items, "/store", "Store"),
    ...knowledge(faq.items, "/#whatsapp-contact", "FAQ"),
    ...knowledge(documents.items, "/#documents", "Documents"),
    ...knowledge(sponsors.items, "/#sponsors", "Sponsors"),
    {
      id: "store-policy",
      title: "Store payment, reservation and account help",
      text: "Browse merchandise at /store. Create an account or sign in, add products to your cart, then submit a booking at checkout. Reservations last 24 hours from submission. Wait for staff to confirm availability before paying. Upload payment proof from Bookings & payment. Proof is verified by staff, not automatically. Card checkout is not connected.",
      href: "/store/policies",
    },
  ];
  const loading = [
    event,
    schedule,
    presenters,
    announcements,
    merchandise,
    faq,
    documents,
    sponsors,
  ].some((s) => s.loading);
  const unavailable = [
    event,
    schedule,
    presenters,
    announcements,
    merchandise,
    faq,
    documents,
    sponsors,
  ].some((s) => s.error);
  return (
    <section id="whatsapp-contact" className="frontier-contact">
      <div className="section-container">
        <p className="frontier-kicker">YOUR SYMPOSIUM GUIDE</p>
        <div className="frontier-contact-grid">
          <div>
            <h2>
              LET’S
              <br />
              <em>TALK.</em>
            </h2>
            <p>Ask about the event, speakers, programme or store.</p>
            <small>
              Answers come from published symposium information. If a detail is
              missing, I’ll say so.
            </small>
          </div>
          <div className="enquiry-bot">
            <div
              className="enquiry-history"
              role="log"
              aria-label="Symposium conversation"
              aria-live="polite"
            >
              {history.length === 0 && (
                <p>Hello! What would you like to know about the symposium?</p>
              )}
              {history.map((turn, i) => (
                <article key={i}>
                  <p className="enquiry-question">{turn.question}</p>
                  {turn.matches.length ? (
                    turn.matches.map((m) => (
                      <div key={m.id}>
                        <strong>{m.title}</strong>
                        <p>
                          {m.text ||
                            "See the published section for the latest details."}
                        </p>
                        <a href={m.href}>View source ↗</a>
                      </div>
                    ))
                  ) : (
                    <p>
                      I couldn’t find a confirmed answer in the available
                      published information. Try a specific topic, or check
                      again when the team publishes more details.
                    </p>
                  )}
                </article>
              ))}
            </div>
            {loading && <p>Loading the latest symposium information…</p>}
            {unavailable && (
              <p>
                Some information is unavailable. Answers use the published
                sections that loaded successfully.
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = question.trim();
                if (!q) return;
                setHistory((h) => [
                  ...h.slice(-9),
                  { question: q, matches: answerEnquiry(q, entries) },
                ]);
                setQuestion("");
              }}
            >
              <label htmlFor="symposium-question">Your question</label>
              <input
                id="symposium-question"
                value={question}
                maxLength={500}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="When and where is the symposium?"
                required
              />
              <button className="frontier-button" disabled={loading}>
                Ask the guide ↗
              </button>
            </form>
            <div className="enquiry-prompts">
              {[
                "When is the symposium?",
                "Who are the speakers?",
                "How do I pay for merchandise?",
              ].map((q) => (
                <button key={q} onClick={() => setQuestion(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
