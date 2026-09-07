import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { EventInfo } from "../types/event";

const emptyEvent: Omit<EventInfo, "id"> = {
  title: "",
  department: "",
  university: "",
  year: new Date().getFullYear(),
  description: "",
  venue: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
  published: false,
};

function EventManager() {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const eventQuery = query(collection(db, "event"));
        const snapshot = await getDocs(eventQuery);

        if (!snapshot.empty) {
          const document = snapshot.docs[0];
          const data = document.data();

          const loadedEvent: EventInfo = {
            id: document.id,
            title: data.title ?? "",
            department: data.department ?? "",
            university: data.university ?? "",
            year: data.year ?? new Date().getFullYear(),
            description: data.description ?? "",
            venue: data.venue ?? "",
            location: data.location ?? "",
            contactEmail: data.contactEmail ?? "",
            contactPhone: data.contactPhone ?? "",
            published: data.published ?? false,
          };

          setEvent(loadedEvent);
          setForm({
            title: loadedEvent.title,
            department: loadedEvent.department,
            university: loadedEvent.university,
            year: loadedEvent.year,
            description: loadedEvent.description,
            venue: loadedEvent.venue,
            location: loadedEvent.location,
            contactEmail: loadedEvent.contactEmail,
            contactPhone: loadedEvent.contactPhone,
            published: loadedEvent.published,
          });
        }
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Unable to load event information.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, []);

  function handleChange(
    field: keyof Omit<EventInfo, "id">,
    value: string | number | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.title.trim()) {
        setError("Event title is required.");
        return;
      }

      if (!form.department.trim()) {
        setError("Department is required.");
        return;
      }

      if (!form.university.trim()) {
        setError("University is required.");
        return;
      }

      if (event) {
        await updateDoc(doc(db, "event", event.id), form);

        setEvent({
          id: event.id,
          ...form,
        });

        setMessage("Event information updated successfully.");
      } else {
        const document = await addDoc(collection(db, "event"), form);

        setEvent({
          id: document.id,
          ...form,
        });

        setMessage("Event information created successfully.");
      }
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Unable to save event information.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <p className="admin-message">Loading event information...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <p className="section-label">ADMINISTRATION</p>
            <h1>Event Information</h1>
            <p>
              Manage the main information displayed for MCS Symposium 2026.
            </p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              window.location.href = "/admin/dashboard";
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {message && <p className="admin-success">{message}</p>}

        {error && <p className="admin-error">{error}</p>}

        <section className="admin-form-card">
          <div className="admin-form-grid">
            <label>
              Event Title
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  handleChange("title", event.target.value)
                }
                placeholder="MCS Symposium 2026"
              />
            </label>

            <label>
              Department
              <input
                type="text"
                value={form.department}
                onChange={(event) =>
                  handleChange("department", event.target.value)
                }
                placeholder="Mathematics & Computing Science"
              />
            </label>

            <label>
              University
              <input
                type="text"
                value={form.university}
                onChange={(event) =>
                  handleChange("university", event.target.value)
                }
                placeholder="Divine Word University"
              />
            </label>

            <label>
              Year
              <input
                type="number"
                value={form.year}
                onChange={(event) =>
                  handleChange("year", Number(event.target.value))
                }
              />
            </label>

            <label>
              Venue
              <input
                type="text"
                value={form.venue}
                onChange={(event) =>
                  handleChange("venue", event.target.value)
                }
                placeholder="To be confirmed"
              />
            </label>

            <label>
              Location
              <input
                type="text"
                value={form.location}
                onChange={(event) =>
                  handleChange("location", event.target.value)
                }
                placeholder="To be confirmed"
              />
            </label>

            <label>
              Contact Email
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  handleChange("contactEmail", event.target.value)
                }
                placeholder="mcs@dwu.ac.pg"
              />
            </label>

            <label>
              Contact Phone
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) =>
                  handleChange("contactPhone", event.target.value)
                }
                placeholder="Contact number"
              />
            </label>

            <label className="admin-form-full">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleChange("description", event.target.value)
                }
                placeholder="Describe the symposium..."
                rows={6}
              />
            </label>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  handleChange("published", event.target.checked)
                }
              />
              Published
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : event
                  ? "Save Event Information"
                  : "Create Event Information"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default EventManager;