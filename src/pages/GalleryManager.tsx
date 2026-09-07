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

interface GalleryRecord {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  order: number;
  published: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  image: "",
  category: "",
  order: 1,
  published: false,
};

function GalleryManager() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadGallery() {
    try {
      setLoading(true);
      setError("");

      const galleryQuery = query(
        collection(db, "gallery"),
        orderBy("order", "asc"),
      );

      const snapshot = await getDocs(galleryQuery);

      const records: GalleryRecord[] = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          title: data.title ?? "",
          description: data.description ?? "",
          image: data.image ?? "",
          category: data.category ?? "",
          order: typeof data.order === "number" ? data.order : 0,
          published: data.published === true,
        };
      });

      setItems(records);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load gallery items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
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

  function startEdit(item: GalleryRecord) {
    setEditingId(item.id);

    setForm({
      title: item.title,
      description: item.description,
      image: item.image,
      category: item.category,
      order: item.order,
      published: item.published,
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

    if (!form.title.trim()) {
      setError("Gallery title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Gallery description is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Gallery category is required.");
      return;
    }

    if (!form.image.trim()) {
      setError("Image URL is required.");
      return;
    }

    try {
      new URL(form.image.trim());
    } catch {
      setError("Please enter a valid image URL.");
      return;
    }

    if (!Number.isFinite(form.order) || form.order < 1) {
      setError("Display order must be a number greater than 0.");
      return;
    }

    const galleryData = {
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      category: form.category.trim(),
      order: form.order,
      published: form.published,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateDoc(doc(db, "gallery", editingId), galleryData);
        setMessage("Gallery item updated successfully.");
      } else {
        await addDoc(collection(db, "gallery"), galleryData);
        setMessage("Gallery item added successfully.");
      }

      resetForm();
      await loadGallery();
    } catch (saveError) {
      console.error(saveError);
      setError("Unable to save the gallery item.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: GalleryRecord) {
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "gallery", item.id), {
        published: !item.published,
      });

      setMessage(
        item.published
          ? "Gallery item unpublished."
          : "Gallery item published.",
      );

      await loadGallery();
    } catch (toggleError) {
      console.error(toggleError);
      setError("Unable to change the publication status.");
    }
  }

  async function handleDelete(item: GalleryRecord) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteDoc(doc(db, "gallery", item.id));

      if (editingId === item.id) {
        resetForm();
      }

      setMessage("Gallery item deleted successfully.");
      await loadGallery();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Unable to delete the gallery item.");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">Administration</span>

            <h1>Gallery Manager</h1>

            <p>
              Add, edit, publish, unpublish, reorder, and delete gallery items.
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
                {editingId ? "Edit Gallery Item" : "Add Gallery Item"}
              </span>

              <h2>
                {editingId ? "Update Gallery Item" : "Create Gallery Item"}
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
                <span>Title</span>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="MCS Symposium 2026"
                />
              </label>

              <label>
                <span>Category</span>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Symposium"
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

              <label className="admin-form-full">
                <span>Image URL</span>

                <input
                  type="url"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />

                <small>
                  Enter the image URL for now. Image uploads can be connected
                  later when storage is provisioned.
                </small>
              </label>

              <label className="admin-form-full">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Brief description of the gallery image."
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
                    ? "Update Gallery Item"
                    : "Add Gallery Item"}
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
              <span className="section-eyebrow">Existing Gallery Items</span>

              <h2>Gallery Library</h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">Loading gallery...</div>
          ) : items.length === 0 ? (
            <div className="admin-message">
              No gallery items have been added yet.
            </div>
          ) : (
            <div className="admin-list">
              {items.map((item) => (
                <article className="admin-list-item" key={item.id}>
                  <div className="admin-list-content">
                    <div className="admin-list-meta">
                      <span>{item.category}</span>

                      <span>
                        {item.published ? "Published" : "Draft"}
                      </span>

                      <span>Order {item.order}</span>
                    </div>

                    <h3>{item.title}</h3>

                    <p>{item.description}</p>

                    <div className="admin-list-details">
                      <a
                        href={item.image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Image
                      </a>
                    </div>
                  </div>

                  <div className="admin-list-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => togglePublished(item)}
                    >
                      {item.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => handleDelete(item)}
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

export default GalleryManager;