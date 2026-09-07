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

interface PresenterForm {
  name: string;
  role: string;
  category: string;
  topic: string;
  biography: string;
  imageUrl: string;
  linkedinUrl: string;
  order: number;
  published: boolean;
}

interface PresenterRecord extends PresenterForm {
  id: string;
}

const emptyForm: PresenterForm = {
  name: "",
  role: "",
  category: "Featured Presenter",
  topic: "",
  biography: "",
  imageUrl: "",
  linkedinUrl: "",
  order: 1,
  published: false,
};

function PresenterManager() {
  const [presenters, setPresenters] = useState<PresenterRecord[]>([]);
  const [form, setForm] = useState<PresenterForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPresenters = async () => {
    setLoading(true);
    setError("");

    try {
      const presentersQuery = query(
        collection(db, "presenters"),
        orderBy("order", "asc"),
      );

      const snapshot = await getDocs(presentersQuery);

      const loadedPresenters: PresenterRecord[] =
        snapshot.docs.map((presenterDoc) => {
          const data = presenterDoc.data();

          return {
            id: presenterDoc.id,
            name: data.name ?? "",
            role: data.role ?? "",
            category: data.category ?? "",
            topic: data.topic ?? "",
            biography: data.biography ?? "",
            imageUrl: data.imageUrl ?? "",
            linkedinUrl: data.linkedinUrl ?? "",
            order: Number(data.order ?? 0),
            published: data.published === true,
          };
        });

      setPresenters(loadedPresenters);
    } catch {
      setError("Unable to load presenters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPresenters();
  }, []);

  const handleInputChange = (
    field: keyof PresenterForm,
    value: string | number | boolean,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      order: presenters.length + 1,
    });

    setEditingId(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Presenter name is required.");
      return;
    }

    if (!form.role.trim()) {
      setError("Presenter role is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Presenter category is required.");
      return;
    }

    if (!form.topic.trim()) {
      setError("Presentation topic is required.");
      return;
    }

    if (
      form.linkedinUrl.trim() &&
      !/^https:\/\/(www\.)?linkedin\.com\/.+/i.test(
        form.linkedinUrl.trim(),
      )
    ) {
      setError(
        "LinkedIn URL must be a valid https://linkedin.com/ address.",
      );
      return;
    }

    setSaving(true);

    try {
      const presenterData = {
        name: form.name.trim(),
        role: form.role.trim(),
        category: form.category.trim(),
        topic: form.topic.trim(),
        biography: form.biography.trim(),
        imageUrl: form.imageUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        order: Number(form.order),
        published: form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "presenters", editingId),
          presenterData,
        );

        setMessage("Presenter updated successfully.");
      } else {
        await addDoc(
          collection(db, "presenters"),
          presenterData,
        );

        setMessage("Presenter added successfully.");
      }

      resetForm();
      await loadPresenters();
    } catch {
      setError("Unable to save presenter.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (presenter: PresenterRecord) => {
    setEditingId(presenter.id);

    setForm({
      name: presenter.name,
      role: presenter.role,
      category: presenter.category,
      topic: presenter.topic,
      biography: presenter.biography,
      imageUrl: presenter.imageUrl,
      linkedinUrl: presenter.linkedinUrl,
      order: presenter.order,
      published: presenter.published,
    });

    setMessage("");
    setError("");
  };

  const handleDelete = async (presenterId: string) => {
    const confirmed = window.confirm(
      "Delete this presenter?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteDoc(doc(db, "presenters", presenterId));

      setMessage("Presenter deleted.");
      await loadPresenters();
    } catch {
      setError("Unable to delete presenter.");
    }
  };

  const handlePublishToggle = async (
    presenter: PresenterRecord,
  ) => {
    setError("");
    setMessage("");

    try {
      await updateDoc(
        doc(db, "presenters", presenter.id),
        {
          published: !presenter.published,
        },
      );

      setMessage(
        presenter.published
          ? "Presenter moved to draft."
          : "Presenter published successfully.",
      );

      await loadPresenters();
    } catch {
      setError(
        "Unable to update presenter publication status.",
      );
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="section-eyebrow">MCS Symposium 2026</p>
          <h1>Presenter Manager</h1>
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
            Symposium Presenters
          </p>

          <h2>
            {editingId
              ? "Edit Presenter"
              : "Add Presenter"}
          </h2>

          <p>
            Add and manage presenter information. Keep records
            as drafts until official presenter details are
            confirmed.
          </p>
        </section>

        <section className="admin-form-section">
          <form
            onSubmit={handleSubmit}
            className="admin-management-form"
          >
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="presenter-name">
                  Name
                </label>

                <input
                  id="presenter-name"
                  type="text"
                  placeholder="Presenter Name"
                  value={form.name}
                  onChange={(event) =>
                    handleInputChange(
                      "name",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="presenter-role">
                  Role / Position
                </label>

                <input
                  id="presenter-role"
                  type="text"
                  placeholder="Academic / Researcher"
                  value={form.role}
                  onChange={(event) =>
                    handleInputChange(
                      "role",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="presenter-category">
                  Category
                </label>

                <input
                  id="presenter-category"
                  type="text"
                  placeholder="Featured Presenter"
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
                <label htmlFor="presenter-order">
                  Display Order
                </label>

                <input
                  id="presenter-order"
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

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-topic">
                  Presentation Topic
                </label>

                <input
                  id="presenter-topic"
                  type="text"
                  placeholder="Presentation topic"
                  value={form.topic}
                  onChange={(event) =>
                    handleInputChange(
                      "topic",
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-biography">
                  Biography
                </label>

                <textarea
                  id="presenter-biography"
                  rows={5}
                  placeholder="Short presenter biography"
                  value={form.biography}
                  onChange={(event) =>
                    handleInputChange(
                      "biography",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="presenter-image">
                  Image URL
                </label>

                <input
                  id="presenter-image"
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(event) =>
                    handleInputChange(
                      "imageUrl",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="presenter-linkedin">
                  LinkedIn Profile URL
                </label>

                <input
                  id="presenter-linkedin"
                  type="url"
                  placeholder="https://www.linkedin.com/in/..."
                  value={form.linkedinUrl}
                  onChange={(event) =>
                    handleInputChange(
                      "linkedinUrl",
                      event.target.value,
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
                Publish this presenter immediately
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
                    ? "Update Presenter"
                    : "Add Presenter"}
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
                Current Presenters
              </p>

              <h2>Presenter List</h2>
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
              + Add New Presenter
            </button>
          </div>

          {loading ? (
            <p>Loading presenters...</p>
          ) : presenters.length === 0 ? (
            <p>
              No presenters have been added yet.
            </p>
          ) : (
            <div className="admin-schedule-list">
              {presenters.map((presenter) => (
                <article
                  key={presenter.id}
                  className="admin-schedule-card"
                >
                  <div className="admin-schedule-card-time">
                    {presenter.order}
                  </div>

                  <div className="admin-schedule-card-content">
                    <div className="admin-schedule-card-heading">
                      <span className="admin-program-type">
                        {presenter.category}
                      </span>

                      <span
                        className={
                          presenter.published
                            ? "admin-status admin-status-published"
                            : "admin-status admin-status-draft"
                        }
                      >
                        {presenter.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <h3>{presenter.name}</h3>

                    <p>
                      {presenter.role}
                    </p>

                    <p>
                      {presenter.topic}
                    </p>

                    {presenter.linkedinUrl && (
                      <small>
                        LinkedIn profile added
                      </small>
                    )}

                    <div className="admin-schedule-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handleEdit(presenter)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          handlePublishToggle(
                            presenter,
                          )
                        }
                      >
                        {presenter.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(presenter.id)
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

export default PresenterManager;