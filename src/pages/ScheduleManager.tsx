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

interface ScheduleProgram {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  location: string;
  order: number;
  published: boolean;
}

interface ScheduleForm {
  time: string;
  type: string;
  title: string;
  description: string;
  location: string;
  order: number;
  published: boolean;
}

const emptyForm: ScheduleForm = {
  time: "",
  type: "",
  title: "",
  description: "",
  location: "",
  order: 1,
  published: false,
};

function ScheduleManager() {
  const [programs, setPrograms] = useState<ScheduleProgram[]>([]);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPrograms = async () => {
    setLoading(true);
    setError("");

    try {
      const scheduleQuery = query(
        collection(db, "schedule"),
        orderBy("order", "asc"),
      );

      const snapshot = await getDocs(scheduleQuery);

      const loadedPrograms: ScheduleProgram[] = snapshot.docs.map(
        (scheduleDoc) => {
          const data = scheduleDoc.data();

          return {
            id: scheduleDoc.id,
            time: data.time ?? "",
            type: data.type ?? "",
            title: data.title ?? "",
            description: data.description ?? "",
            location: data.location ?? "",
            order: Number(data.order ?? 0),
            published: data.published === true,
          };
        },
      );

      setPrograms(loadedPrograms);
    } catch {
      setError("Unable to load the symposium schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPrograms();
  }, []);

  const handleInputChange = (
    field: keyof ScheduleForm,
    value: string | boolean | number,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      order: programs.length + 1,
    });

    setEditingId(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Program title is required.");
      return;
    }

    if (!form.time.trim()) {
      setError("Program time is required.");
      return;
    }

    if (!form.type.trim()) {
      setError("Program type is required.");
      return;
    }

    setSaving(true);

    try {
      const programData = {
        time: form.time.trim(),
        type: form.type.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        order: Number(form.order),
        published: form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "schedule", editingId),
          programData,
        );

        setMessage("Schedule program updated successfully.");
      } else {
        await addDoc(
          collection(db, "schedule"),
          programData,
        );

        setMessage("Schedule program added successfully.");
      }

      resetForm();
      await loadPrograms();
    } catch {
      setError("Unable to save the schedule program.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (program: ScheduleProgram) => {
    setEditingId(program.id);

    setForm({
      time: program.time,
      type: program.type,
      title: program.title,
      description: program.description,
      location: program.location,
      order: program.order,
      published: program.published,
    });

    setMessage("");
    setError("");
  };

  const handleDelete = async (programId: string) => {
    const confirmed = window.confirm(
      "Delete this schedule program?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteDoc(doc(db, "schedule", programId));

      setMessage("Schedule program deleted.");
      await loadPrograms();
    } catch {
      setError("Unable to delete the schedule program.");
    }
  };

  const handlePublishToggle = async (
    program: ScheduleProgram,
  ) => {
    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "schedule", program.id),
        {
          published: !program.published,
        },
      );

      setMessage(
        program.published
          ? "Program moved to draft."
          : "Program published successfully.",
      );

      await loadPrograms();
    } catch {
      setError("Unable to update publication status.");
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="section-eyebrow">MCS Symposium 2026</p>
          <h1>Schedule Manager</h1>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={() => {
            window.location.href = "/admin/dashboard";
          }}
        >
          ← Dashboard
        </button>
      </header>

      <main className="admin-dashboard-main">
        <section className="admin-welcome">
          <p className="section-eyebrow">
            Event Schedule
          </p>

          <h2>
            {editingId
              ? "Edit Program"
              : "Add Program"}
          </h2>

          <p>
            Add and manage symposium programs. Programs can
            remain as drafts until the information is confirmed.
          </p>
        </section>

        <section className="admin-form-section">
          <form
            onSubmit={handleSubmit}
            className="admin-management-form"
          >
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="schedule-time">
                  Time
                </label>

                <input
                  id="schedule-time"
                  type="text"
                  placeholder="09:00 AM"
                  value={form.time}
                  onChange={(event) =>
                    handleInputChange(
                      "time",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="schedule-type">
                  Program Type
                </label>

                <input
                  id="schedule-type"
                  type="text"
                  placeholder="Keynote"
                  value={form.type}
                  onChange={(event) =>
                    handleInputChange(
                      "type",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="schedule-title">
                  Program Title
                </label>

                <input
                  id="schedule-title"
                  type="text"
                  placeholder="Keynote Presentation"
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

              <div className="admin-form-group admin-form-full">
                <label htmlFor="schedule-description">
                  Description
                </label>

                <textarea
                  id="schedule-description"
                  rows={4}
                  placeholder="Program description"
                  value={form.description}
                  onChange={(event) =>
                    handleInputChange(
                      "description",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="schedule-location">
                  Location
                </label>

                <input
                  id="schedule-location"
                  type="text"
                  placeholder="Main Venue"
                  value={form.location}
                  onChange={(event) =>
                    handleInputChange(
                      "location",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="schedule-order">
                  Display Order
                </label>

                <input
                  id="schedule-order"
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(event) =>
                    handleInputChange(
                      "order",
                      Number(event.target.value),
                    )
                  }
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
                Publish this program immediately
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
                    ? "Update Program"
                    : "Add Program"}
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
                Current Programs
              </p>

              <h2>Schedule Timeline</h2>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                resetForm();
                setMessage("");
                setError("");
              }}
            >
              + Add New Program
            </button>
          </div>

          {loading ? (
            <p>Loading schedule...</p>
          ) : programs.length === 0 ? (
            <p>
              No schedule programs have been added yet.
            </p>
          ) : (
            <div className="admin-schedule-list">
              {programs.map((program) => (
                <article
                  key={program.id}
                  className="admin-schedule-card"
                >
                  <div className="admin-schedule-card-time">
                    {program.time}
                  </div>

                  <div className="admin-schedule-card-content">
                    <div className="admin-schedule-card-heading">
                      <span className="admin-program-type">
                        {program.type}
                      </span>

                      <span
                        className={
                          program.published
                            ? "admin-status admin-status-published"
                            : "admin-status admin-status-draft"
                        }
                      >
                        {program.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <h3>{program.title}</h3>

                    {program.description && (
                      <p>{program.description}</p>
                    )}

                    {program.location && (
                      <small>
                        Location: {program.location}
                      </small>
                    )}

                    <div className="admin-schedule-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handleEdit(program)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handlePublishToggle(program)
                        }
                      >
                        {program.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(program.id)
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

export default ScheduleManager;