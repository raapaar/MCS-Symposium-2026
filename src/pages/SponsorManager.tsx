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

interface SponsorRecord {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  category: string;
  order: number;
  published: boolean;
}

const emptyForm = {
  name: "",
  description: "",
  logo: "",
  website: "",
  category: "",
  order: 1,
  published: false,
};

function SponsorManager() {
  const [sponsors, setSponsors] = useState<SponsorRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSponsors() {
    try {
      setLoading(true);
      setError("");

      const sponsorsQuery = query(
        collection(db, "sponsors"),
        orderBy("order", "asc"),
      );

      const snapshot = await getDocs(sponsorsQuery);

      const records: SponsorRecord[] = snapshot.docs.map((sponsor) => {
        const data = sponsor.data();

        return {
          id: sponsor.id,
          name: data.name ?? "",
          description: data.description ?? "",
          logo: data.logo ?? "",
          website: data.website ?? "",
          category: data.category ?? "",
          order: typeof data.order === "number" ? data.order : 0,
          published: data.published === true,
        };
      });

      setSponsors(records);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load sponsors and partners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSponsors();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = event.target;

    if (type === "checkbox") {
      const checked = (event.target as HTMLInputElement).checked;

      setForm((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: name === "order" ? Number(value) : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(sponsor: SponsorRecord) {
    setEditingId(sponsor.id);

    setForm({
      name: sponsor.name,
      description: sponsor.description,
      logo: sponsor.logo,
      website: sponsor.website,
      category: sponsor.category,
      order: sponsor.order,
      published: sponsor.published,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Sponsor or partner name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!form.logo.trim()) {
      setError("Logo URL is required.");
      return;
    }

    try {
      new URL(form.logo.trim());
    } catch {
      setError("Please enter a valid logo URL.");
      return;
    }

    if (form.website.trim()) {
      try {
        new URL(form.website.trim());
      } catch {
        setError("Please enter a valid website URL.");
        return;
      }
    }

    if (!Number.isFinite(form.order) || form.order < 1) {
      setError("Display order must be a number greater than 0.");
      return;
    }

    const sponsorData = {
      name: form.name.trim(),
      description: form.description.trim(),
      logo: form.logo.trim(),
      website: form.website.trim(),
      category: form.category.trim(),
      order: form.order,
      published: form.published,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateDoc(doc(db, "sponsors", editingId), sponsorData);
        setMessage("Sponsor or partner updated successfully.");
      } else {
        await addDoc(collection(db, "sponsors"), sponsorData);
        setMessage("Sponsor or partner added successfully.");
      }

      resetForm();
      await loadSponsors();
    } catch (saveError) {
      console.error(saveError);
      setError("Unable to save the sponsor or partner.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(sponsor: SponsorRecord) {
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "sponsors", sponsor.id), {
        published: !sponsor.published,
      });

      setMessage(
        sponsor.published
          ? "Sponsor or partner unpublished."
          : "Sponsor or partner published.",
      );

      await loadSponsors();
    } catch (toggleError) {
      console.error(toggleError);
      setError("Unable to change the publication status.");
    }
  }

  async function handleDelete(sponsor: SponsorRecord) {
    const confirmed = window.confirm(
      `Delete "${sponsor.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteDoc(doc(db, "sponsors", sponsor.id));

      if (editingId === sponsor.id) {
        resetForm();
      }

      setMessage("Sponsor or partner deleted successfully.");
      await loadSponsors();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Unable to delete the sponsor or partner.");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">Administration</span>

            <h1>Sponsors & Partners</h1>

            <p>
              Add, edit, publish, unpublish, reorder, and delete sponsors and
              event partners.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                window.location.href = "/admin/dashboard";
              }}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              View Website
            </button>
          </div>
        </div>

        {message && <div className="admin-message">{message}</div>}

        {error && (
          <div className="admin-message admin-message-error">
            {error}
          </div>
        )}

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <span className="section-eyebrow">
                {editingId ? "Edit Sponsor" : "Add Sponsor"}
              </span>

              <h2>
                {editingId
                  ? "Update Sponsor or Partner"
                  : "Create Sponsor or Partner"}
              </h2>
            </div>

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

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-grid">
              <label>
                <span>Name</span>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Organization or sponsor name"
                />
              </label>

              <label>
                <span>Category</span>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Gold Sponsor"
                />
              </label>

              <label>
                <span>Display Order</span>

                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  min="1"
                  step="1"
                />
              </label>

              <label>
                <span>Logo URL</span>

                <input
                  type="url"
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />

                <small>
                  Use a direct, publicly accessible logo image URL.
                </small>
              </label>

              <label className="admin-form-full">
                <span>Website URL</span>

                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </label>

              <label className="admin-form-full">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Brief description of the sponsor or partner."
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                />

                <span>Published</span>
              </label>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Sponsor"
                    : "Add Sponsor"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-list-section">
          <div className="admin-card-heading">
            <div>
              <span className="section-eyebrow">Existing Sponsors</span>

              <h2>Sponsor & Partner Library</h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">Loading sponsors...</div>
          ) : sponsors.length === 0 ? (
            <div className="admin-message">
              No sponsors or partners have been added yet.
            </div>
          ) : (
            <div className="admin-list">
              {sponsors.map((sponsor) => (
                <article className="admin-list-item" key={sponsor.id}>
                  <div className="admin-list-content">
                    <div className="admin-list-meta">
                      <span>{sponsor.category}</span>

                      <span>
                        {sponsor.published ? "Published" : "Draft"}
                      </span>

                      <span>Order {sponsor.order}</span>
                    </div>

                    <h3>{sponsor.name}</h3>

                    <p>{sponsor.description}</p>

                    <div className="admin-list-details">
                      <a
                        href={sponsor.logo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Logo
                      </a>

                      {sponsor.website && (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="admin-list-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => startEdit(sponsor)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => togglePublished(sponsor)}
                    >
                      {sponsor.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => handleDelete(sponsor)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default SponsorManager;