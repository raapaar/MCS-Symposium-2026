import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";

interface AnnouncementForm {
  title: string;
  summary: string;
  date: string;
  category: string;
  published: boolean;
}

interface AnnouncementRecord extends AnnouncementForm {
  id: string;
}

const emptyForm: AnnouncementForm = {
  title: "",
  summary: "",
  date: "",
  category: "General",
  published: false,
};

function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<
    AnnouncementRecord[]
  >([]);

  const [form, setForm] =
    useState<AnnouncementForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAnnouncements = async () => {
    setLoading(true);
    setError("");

    try {
      const announcementsQuery = query(
        collection(db, "announcements"),
        orderBy("date", "desc"),
      );

      const snapshot = await getDocs(
        announcementsQuery,
      );

      const loadedAnnouncements: AnnouncementRecord[] =
        snapshot.docs.map((announcementDoc) => {
          const data = announcementDoc.data();

          return {
            id: announcementDoc.id,
            title: data.title ?? "",
            summary: data.summary ?? "",
            date: data.date ?? "",
            category: data.category ?? "",
            published: data.published === true,
          };
        });

      setAnnouncements(loadedAnnouncements);
    } catch {
      setError("Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const handleInputChange = (
    field: keyof AnnouncementForm,
    value: string | boolean,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Announcement title is required.");
      return;
    }

    if (!form.summary.trim()) {
      setError("Announcement summary is required.");
      return;
    }

    if (!form.date.trim()) {
      setError("Announcement date is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Announcement category is required.");
      return;
    }

    setSaving(true);

    try {
      const announcementData = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        date: form.date.trim(),
        category: form.category.trim(),
        published: form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "announcements", editingId),
          announcementData,
        );

        setMessage(
          "Announcement updated successfully.",
        );
      } else {
        await addDoc(
          collection(db, "announcements"),
          announcementData,
        );

        setMessage(
          "Announcement added successfully.",
        );
      }

      resetForm();
      await loadAnnouncements();
    } catch {
      setError("Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (
    announcement: AnnouncementRecord,
  ) => {
    setEditingId(announcement.id);

    setForm({
      title: announcement.title,
      summary: announcement.summary,
      date: announcement.date,
      category: announcement.category,
      published: announcement.published,
    });

    setMessage("");
    setError("");
  };

  const handleDelete = async (
    announcementId: string,
  ) => {
    const confirmed = window.confirm(
      "Delete this announcement?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteDoc(
        doc(db, "announcements", announcementId),
      );

      setMessage("Announcement deleted.");
      await loadAnnouncements();
    } catch {
      setError("Unable to delete announcement.");
    }
  };

  const handlePublishToggle = async (
    announcement: AnnouncementRecord,
  ) => {
    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "announcements", announcement.id),
        {
          published: !announcement.published,
        },
      );

      setMessage(
        announcement.published
          ? "Announcement moved to draft."
          : "Announcement published successfully.",
      );

      await loadAnnouncements();
    } catch {
      setError(
        "Unable to update announcement publication status.",
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="section-eyebrow">
            MCS Symposium 2026
          </p>

          <h1>Announcement Manager</h1>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={() => {
            window.location.href =
              "/admin/dashboard";
          }}
        >
          ← Dashboard
        </button>
      </header>

      <main className="admin-dashboard-main">
        <section className="admin-welcome">
          <p className="section-eyebrow">
            Symposium Announcements
          </p>

          <h2>
            {editingId
              ? "Edit Announcement"
              : "Add Announcement"}
          </h2>

          <p>
            Create and manage official symposium
            announcements. Keep announcements as drafts
            until the information is ready for publication.
          </p>
        </section>

        <section className="admin-form-section">
          <form
            onSubmit={handleSubmit}
            className="admin-management-form"
          >
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="announcement-title">
                  Title
                </label>

                <input
                  id="announcement-title"
                  type="text"
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(event) =>
                    handleInputChange(
                      "title",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="announcement-category">
                  Category
                </label>

                <input
                  id="announcement-category"
                  type="text"
                  placeholder="General"
                  value={form.category}
                  onChange={(event) =>
                    handleInputChange(
                      "category",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="announcement-date">
                  Date
                </label>

                <input
                  id="announcement-date"
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    handleInputChange(
                      "date",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="announcement-summary">
                  Summary
                </label>

                <textarea
                  id="announcement-summary"
                  rows={4}
                  placeholder="Short announcement summary"
                  value={form.summary}
                  onChange={(event) =>
                    handleInputChange(
                      "summary",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>
            </div>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  handleInputChange(
                    "published",
                    event.target.checked,
                  )
                }
              />

              <span>
                Publish this announcement immediately
              </span>
            </label>

            {error && (
              <div className="admin-message admin-message-error">
                {error}
              </div>
            )}

            {message && (
              <div className="admin-message admin-message-success">
                {message}
              </div>
            )}

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-login-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Announcement"
                    : "Add Announcement"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-schedule-section">
          <div className="admin-section-header">
            <div>
              <p className="section-eyebrow">
                Current Announcements
              </p>

              <h2>Announcement List</h2>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                resetForm();
                setMessage("");
              }}
            >
              + Add New Announcement
            </button>
          </div>

          {loading ? (
            <p>Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p>
              No announcements have been added yet.
            </p>
          ) : (
            <div className="admin-schedule-list">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="admin-schedule-card"
                >
                  <div className="admin-schedule-card-time">
                    {announcement.date}
                  </div>

                  <div className="admin-schedule-card-content">
                    <div className="admin-schedule-card-heading">
                      <span className="admin-program-type">
                        {announcement.category}
                      </span>

                      <span
                        className={
                          announcement.published
                            ? "admin-status admin-status-published"
                            : "admin-status admin-status-draft"
                        }
                      >
                        {announcement.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <h3>{announcement.title}</h3>

                    <p>
                      {announcement.summary}
                    </p>

                    <div className="admin-schedule-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handleEdit(announcement)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handlePublishToggle(
                            announcement,
                          )
                        }
                      >
                        {announcement.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(
                            announcement.id,
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AnnouncementManager;