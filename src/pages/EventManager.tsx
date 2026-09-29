import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import storageProvider from "../services/storageProvider";
import type { EventInfo } from "../types/event";

type EventForm = Omit<EventInfo, "id">;

const emptyEvent: EventForm = {
  title: "",
  department: "",
  university: "",
  year: new Date().getFullYear(),
  description: "",
  venue: "",
  location: "",

  aboutTitle: "About the Symposium",
  aboutContent: "",

  eventDate: "",
  eventStartTime: "",

  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",

  hodName: "",
  hodTitle: "Head of Department",
  hodMessage: "",
  hodImageUrl: "",
  hodImagePath: "",

  heroTagline: "",
  heroImageUrl: "",
  heroImagePath: "",

  published: false,
};

function EventManager() {
  const [eventRecord, setEventRecord] =
    useState<EventInfo | null>(null);

  const [form, setForm] =
    useState<EventForm>(emptyEvent);

  const [selectedHodImage, setSelectedHodImage] =
    useState<File | null>(null);

  const [selectedHeroImage, setSelectedHeroImage] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const eventQuery = query(
          collection(db, "event"),
        );

        const snapshot = await getDocs(eventQuery);

        if (!snapshot.empty) {
          const document = snapshot.docs[0];
          const data = document.data();

          const loadedEvent: EventInfo = {
            id: document.id,

            title: data.title ?? "",
            department: data.department ?? "",
            university: data.university ?? "",
            year:
              typeof data.year === "number"
                ? data.year
                : new Date().getFullYear(),

            description: data.description ?? "",
            venue: data.venue ?? "",
            location: data.location ?? "",

            aboutTitle:
              data.aboutTitle ?? "About the Symposium",

            aboutContent:
              data.aboutContent ??
              data.description ??
              "",

            eventDate: data.eventDate ?? "",
            eventStartTime:
              data.eventStartTime ?? "",

            contactEmail:
              data.contactEmail ?? "",

            contactPhone:
              data.contactPhone ?? "",

            whatsappNumber:
              data.whatsappNumber ?? "",

            hodName: data.hodName ?? "",

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

          setEventRecord(loadedEvent);

          const {
            id: _id,
            ...eventForm
          } = loadedEvent;

          setForm(eventForm);
        }
      } catch (loadError) {
        console.error(
          "Error loading event:",
          loadError,
        );

        setError(
          "Unable to load event information.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, []);

  function handleChange(
    field: keyof EventForm,
    value: string | number | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateImage(
    file: File,
    label: string,
  ): string | null {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return `${label} must be JPEG, PNG, or WebP.`;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return `${label} must not exceed 5 MB.`;
    }

    return null;
  }

  function handleHodImageChange(
    changeEvent:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const file =
      changeEvent.target.files?.[0] ?? null;

    if (!file) {
      setSelectedHodImage(null);
      return;
    }

    const validationError =
      validateImage(file, "HOD image");

    if (validationError) {
      setSelectedHodImage(null);
      changeEvent.target.value = "";
      setError(validationError);
      return;
    }

    setSelectedHodImage(file);
  }

  function handleHeroImageChange(
    changeEvent:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const file =
      changeEvent.target.files?.[0] ?? null;

    if (!file) {
      setSelectedHeroImage(null);
      return;
    }

    const validationError =
      validateImage(file, "Hero banner");

    if (validationError) {
      setSelectedHeroImage(null);
      changeEvent.target.value = "";
      setError(validationError);
      return;
    }

    setSelectedHeroImage(file);
  }

  async function handleSave() {
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

    if (
      form.whatsappNumber.trim() &&
      !/^[+\d\s()-]+$/.test(
        form.whatsappNumber.trim(),
      )
    ) {
      setError(
        "Please enter a valid WhatsApp phone number.",
      );
      return;
    }

    setSaving(true);

    let newHodImagePath = "";
    let newHeroImagePath = "";

    let oldHodImagePathToDelete = "";
    let oldHeroImagePathToDelete = "";

    try {
      let hodImageUrl = form.hodImageUrl;
      let hodImagePath = form.hodImagePath;

      let heroImageUrl = form.heroImageUrl;
      let heroImagePath = form.heroImagePath;

      if (selectedHodImage) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedHodImage,
            "branding",
          );

        newHodImagePath = uploadResult.path;

        if (form.hodImagePath) {
          oldHodImagePathToDelete =
            form.hodImagePath;
        }

        hodImageUrl = uploadResult.url;
        hodImagePath = uploadResult.path;
      }

      if (selectedHeroImage) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedHeroImage,
            "branding",
          );

        newHeroImagePath = uploadResult.path;

        if (form.heroImagePath) {
          oldHeroImagePathToDelete =
            form.heroImagePath;
        }

        heroImageUrl = uploadResult.url;
        heroImagePath = uploadResult.path;
      }

      const eventData: EventForm = {
        ...form,

        title: form.title.trim(),
        department: form.department.trim(),
        university: form.university.trim(),
        description: form.description.trim(),
        venue: form.venue.trim(),
        location: form.location.trim(),

        aboutTitle:
          form.aboutTitle.trim() ||
          "About the Symposium",

        aboutContent:
          form.aboutContent.trim(),

        eventDate: form.eventDate,
        eventStartTime: form.eventStartTime,

        contactEmail:
          form.contactEmail.trim(),

        contactPhone:
          form.contactPhone.trim(),

        whatsappNumber:
          form.whatsappNumber.trim(),

        hodName: form.hodName.trim(),
        hodTitle: form.hodTitle.trim(),
        hodMessage: form.hodMessage.trim(),

        hodImageUrl,
        hodImagePath,

        heroTagline:
          form.heroTagline.trim(),

        heroImageUrl,
        heroImagePath,

        published: form.published,
      };

      let savedId = eventRecord?.id ?? "";

      if (eventRecord) {
        await updateDoc(
          doc(db, "event", eventRecord.id),
          eventData,
        );

        setMessage(
          "Event and website information updated successfully.",
        );
      } else {
        const document = await addDoc(
          collection(db, "event"),
          eventData,
        );

        savedId = document.id;

        setMessage(
          "Event and website information created successfully.",
        );
      }

      const savedEvent: EventInfo = {
        id: savedId,
        ...eventData,
      };

      setEventRecord(savedEvent);
      setForm(eventData);

      setSelectedHodImage(null);
      setSelectedHeroImage(null);

      if (
        oldHodImagePathToDelete &&
        oldHodImagePathToDelete !==
          hodImagePath
      ) {
        try {
          await storageProvider.deleteFile(
            oldHodImagePathToDelete,
          );
        } catch (deleteError) {
          console.error(
            "Old HOD image could not be deleted:",
            deleteError,
          );
        }
      }

      if (
        oldHeroImagePathToDelete &&
        oldHeroImagePathToDelete !==
          heroImagePath
      ) {
        try {
          await storageProvider.deleteFile(
            oldHeroImagePathToDelete,
          );
        } catch (deleteError) {
          console.error(
            "Old hero image could not be deleted:",
            deleteError,
          );
        }
      }
    } catch (saveError) {
      console.error(
        "Error saving event:",
        saveError,
      );

      if (newHodImagePath) {
        try {
          await storageProvider.deleteFile(
            newHodImagePath,
          );
        } catch (cleanupError) {
          console.error(
            "HOD image cleanup failed:",
            cleanupError,
          );
        }
      }

      if (newHeroImagePath) {
        try {
          await storageProvider.deleteFile(
            newHeroImagePath,
          );
        } catch (cleanupError) {
          console.error(
            "Hero image cleanup failed:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save event information.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <p className="admin-message">
            Loading event information...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <p className="section-label">
              ADMINISTRATION
            </p>

            <h1>
              Event &amp; Website Content
            </h1>

            <p>
              Manage symposium information,
              website content, contact details,
              countdown settings, HOD welcome
              content, and hero branding.
            </p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              window.location.href =
                "/admin/dashboard";
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {message && (
          <p className="admin-success">
            {message}
          </p>
        )}

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-label">
                EVENT DETAILS
              </p>

              <h2>Core Information</h2>
            </div>
          </div>

          <div className="admin-form-grid">
            <label>
              Event Title
              <input
                type="text"
                value={form.title}
                onChange={(changeEvent) =>
                  handleChange(
                    "title",
                    changeEvent.target.value,
                  )
                }
                placeholder="MCS Symposium 2026"
              />
            </label>

            <label>
              Year
              <input
                type="number"
                value={form.year}
                onChange={(changeEvent) =>
                  handleChange(
                    "year",
                    Number(
                      changeEvent.target.value,
                    ),
                  )
                }
              />
            </label>

            <label>
              Department
              <input
                type="text"
                value={form.department}
                onChange={(changeEvent) =>
                  handleChange(
                    "department",
                    changeEvent.target.value,
                  )
                }
                placeholder="Mathematics & Computing Science"
              />
            </label>

            <label>
              University
              <input
                type="text"
                value={form.university}
                onChange={(changeEvent) =>
                  handleChange(
                    "university",
                    changeEvent.target.value,
                  )
                }
                placeholder="Divine Word University"
              />
            </label>

            <label>
              Venue
              <input
                type="text"
                value={form.venue}
                onChange={(changeEvent) =>
                  handleChange(
                    "venue",
                    changeEvent.target.value,
                  )
                }
                placeholder="Symposium venue"
              />
            </label>

            <label>
              Location
              <input
                type="text"
                value={form.location}
                onChange={(changeEvent) =>
                  handleChange(
                    "location",
                    changeEvent.target.value,
                  )
                }
                placeholder="Madang, Papua New Guinea"
              />
            </label>

            <label>
              Event Date
              <input
                type="date"
                value={form.eventDate}
                onChange={(changeEvent) =>
                  handleChange(
                    "eventDate",
                    changeEvent.target.value,
                  )
                }
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                value={form.eventStartTime}
                onChange={(changeEvent) =>
                  handleChange(
                    "eventStartTime",
                    changeEvent.target.value,
                  )
                }
              />
            </label>

            <label className="admin-form-full">
              Description
              <textarea
                value={form.description}
                onChange={(changeEvent) =>
                  handleChange(
                    "description",
                    changeEvent.target.value,
                  )
                }
                placeholder="Short symposium description..."
                rows={5}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-label">
                ABOUT
              </p>

              <h2>About Symposium</h2>

              <p>
                This content will become the
                customizable About Symposium
                section on the public website.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-form-full">
              About Section Heading
              <input
                type="text"
                value={form.aboutTitle}
                onChange={(changeEvent) =>
                  handleChange(
                    "aboutTitle",
                    changeEvent.target.value,
                  )
                }
                placeholder="About the Symposium"
              />
            </label>

            <label className="admin-form-full">
              About Symposium Content
              <textarea
                value={form.aboutContent}
                onChange={(changeEvent) =>
                  handleChange(
                    "aboutContent",
                    changeEvent.target.value,
                  )
                }
                placeholder="Write the full About Symposium content..."
                rows={8}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-label">
                HERO
              </p>

              <h2>Hero Banner</h2>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-form-full">
              Hero Tagline
              <input
                type="text"
                value={form.heroTagline}
                onChange={(changeEvent) =>
                  handleChange(
                    "heroTagline",
                    changeEvent.target.value,
                  )
                }
                placeholder="Innovation, Research and Technology"
              />
            </label>

            <label className="admin-form-full">
              Hero Background Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleHeroImageChange
                }
              />

              <small>
                JPEG, PNG or WebP. Maximum
                file size: 5 MB.
              </small>

              {selectedHeroImage && (
                <p>
                  Selected:{" "}
                  <strong>
                    {selectedHeroImage.name}
                  </strong>
                </p>
              )}

              {!selectedHeroImage &&
                form.heroImageUrl && (
                  <div>
                    <p>Current hero banner:</p>

                    <img
                      src={form.heroImageUrl}
                      alt="Current symposium hero"
                      style={{
                        width: "100%",
                        maxWidth: "600px",
                        height: "220px",
                        objectFit: "cover",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                )}
            </label>
          </div>
        </section>

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-label">
                HEAD OF DEPARTMENT
              </p>

              <h2>Welcome Message</h2>

              <p>
                Manage the Head of Department
                welcome section displayed on the
                symposium website.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label>
              HOD Name
              <input
                type="text"
                value={form.hodName}
                onChange={(changeEvent) =>
                  handleChange(
                    "hodName",
                    changeEvent.target.value,
                  )
                }
                placeholder="Head of Department name"
              />
            </label>

            <label>
              HOD Title
              <input
                type="text"
                value={form.hodTitle}
                onChange={(changeEvent) =>
                  handleChange(
                    "hodTitle",
                    changeEvent.target.value,
                  )
                }
                placeholder="Head of Department"
              />
            </label>

            <label className="admin-form-full">
              HOD Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleHodImageChange
                }
              />

              <small>
                JPEG, PNG or WebP. Maximum
                file size: 5 MB.
              </small>

              {selectedHodImage && (
                <p>
                  Selected:{" "}
                  <strong>
                    {selectedHodImage.name}
                  </strong>
                </p>
              )}

              {!selectedHodImage &&
                form.hodImageUrl && (
                  <div>
                    <p>Current HOD photo:</p>

                    <img
                      src={form.hodImageUrl}
                      alt={
                        form.hodName ||
                        "Head of Department"
                      }
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                )}
            </label>

            <label className="admin-form-full">
              Welcome Message
              <textarea
                value={form.hodMessage}
                onChange={(changeEvent) =>
                  handleChange(
                    "hodMessage",
                    changeEvent.target.value,
                  )
                }
                placeholder="Write the Head of Department welcome message..."
                rows={9}
              />
            </label>
          </div>
        </section>

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-label">
                CONTACT
              </p>

              <h2>Contact &amp; WhatsApp</h2>
            </div>
          </div>

          <div className="admin-form-grid">
            <label>
              Contact Email
              <input
                type="email"
                value={form.contactEmail}
                onChange={(changeEvent) =>
                  handleChange(
                    "contactEmail",
                    changeEvent.target.value,
                  )
                }
                placeholder="mcs@dwu.ac.pg"
              />
            </label>

            <label>
              Contact Phone
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(changeEvent) =>
                  handleChange(
                    "contactPhone",
                    changeEvent.target.value,
                  )
                }
                placeholder="Contact number"
              />
            </label>

            <label className="admin-form-full">
              WhatsApp Number
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={(changeEvent) =>
                  handleChange(
                    "whatsappNumber",
                    changeEvent.target.value,
                  )
                }
                placeholder="+675 ..."
              />

              <small>
                Include the international country
                code. The public website will
                convert this into a WhatsApp chat
                link.
              </small>
            </label>
          </div>
        </section>

        <section className="admin-form-card">
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(changeEvent) =>
                handleChange(
                  "published",
                  changeEvent.target.checked,
                )
              }
            />

            Published
          </label>

          <div className="admin-form-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? selectedHodImage ||
                  selectedHeroImage
                  ? "Uploading & Saving..."
                  : "Saving..."
                : eventRecord
                  ? "Save Event & Website Content"
                  : "Create Event & Website Content"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default EventManager;