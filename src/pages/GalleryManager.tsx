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
import storageProvider from "../services/storageProvider";

interface GalleryRecord {
  id: string;
  title: string;
  description: string;
  image: string;
  imagePath: string;
  category: string;
  order: number;
  published: boolean;
}

interface GalleryForm {
  title: string;
  description: string;
  image: string;
  imagePath: string;
  category: string;
  order: number;
  published: boolean;
}

const emptyForm: GalleryForm = {
  title: "",
  description: "",
  image: "",
  imagePath: "",
  category: "",
  order: 1,
  published: false,
};

function GalleryManager() {
  const [items, setItems] =
    useState<GalleryRecord[]>([]);

  const [form, setForm] =
    useState<GalleryForm>(emptyForm);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

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

      const snapshot =
        await getDocs(galleryQuery);

      const records: GalleryRecord[] =
        snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            title: data.title ?? "",
            description: data.description ?? "",
            image: data.image ?? "",
            imagePath: data.imagePath ?? "",
            category: data.category ?? "",
            order:
              typeof data.order === "number"
                ? data.order
                : 0,
            published: data.published === true,
          };
        });

      setItems(records);
    } catch (loadError) {
      console.error(loadError);

      setError(
        "Unable to load gallery items.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGallery();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) {
    const { name, value, type } =
      event.target;

    if (type === "checkbox") {
      const checked = (
        event.target as HTMLInputElement
      ).checked;

      setForm((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]:
        name === "order"
          ? Number(value)
          : value,
    }));
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedImage(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedImage(null);
      event.target.value = "";

      setError(
        "Gallery image must be JPEG, PNG, or WebP.",
      );

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedImage(null);
      event.target.value = "";

      setError(
        "Gallery image must not exceed 5 MB.",
      );

      return;
    }

    setSelectedImage(file);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      order: items.length + 1,
    });

    setSelectedImage(null);
    setEditingId(null);
  }

  function startEdit(item: GalleryRecord) {
    setEditingId(item.id);

    setForm({
      title: item.title,
      description: item.description,
      image: item.image,
      imagePath: item.imagePath,
      category: item.category,
      order: item.order,
      published: item.published,
    });

    setSelectedImage(null);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError(
        "Gallery title is required.",
      );
      return;
    }

    if (!form.description.trim()) {
      setError(
        "Gallery description is required.",
      );
      return;
    }

    if (!form.category.trim()) {
      setError(
        "Gallery category is required.",
      );
      return;
    }

    if (
      !editingId &&
      !selectedImage
    ) {
      setError(
        "Please select a gallery image.",
      );
      return;
    }

    if (
      editingId &&
      !selectedImage &&
      !form.image
    ) {
      setError(
        "Please select a gallery image.",
      );
      return;
    }

    if (
      !Number.isFinite(form.order) ||
      form.order < 1
    ) {
      setError(
        "Display order must be a number greater than 0.",
      );
      return;
    }

    setSaving(true);

    let newImagePath = "";
    let oldImagePathToDelete = "";

    try {
      let image = form.image;
      let imagePath = form.imagePath;

      if (selectedImage) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedImage,
            "gallery",
          );

        newImagePath = uploadResult.path;

        if (
          editingId &&
          form.imagePath
        ) {
          oldImagePathToDelete =
            form.imagePath;
        }

        image = uploadResult.url;
        imagePath = uploadResult.path;
      }

      const galleryData = {
        title: form.title.trim(),
        description:
          form.description.trim(),
        image,
        imagePath,
        category: form.category.trim(),
        order: form.order,
        published: form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "gallery", editingId),
          galleryData,
        );

        setMessage(
          "Gallery item updated successfully.",
        );
      } else {
        await addDoc(
          collection(db, "gallery"),
          galleryData,
        );

        setMessage(
          "Gallery item added successfully.",
        );
      }

      if (
        oldImagePathToDelete &&
        oldImagePathToDelete !== imagePath
      ) {
        try {
          await storageProvider.deleteFile(
            oldImagePathToDelete,
          );
        } catch (deleteError) {
          console.error(
            "Old gallery image could not be deleted:",
            deleteError,
          );
        }
      }

      resetForm();
      await loadGallery();
    } catch (saveError) {
      console.error(saveError);

      if (newImagePath) {
        try {
          await storageProvider.deleteFile(
            newImagePath,
          );
        } catch (cleanupError) {
          console.error(
            "Uploaded gallery image cleanup failed:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the gallery item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(
    item: GalleryRecord,
  ) {
    setMessage("");
    setError("");

    try {
      await updateDoc(
        doc(db, "gallery", item.id),
        {
          published: !item.published,
        },
      );

      setMessage(
        item.published
          ? "Gallery item unpublished."
          : "Gallery item published.",
      );

      await loadGallery();
    } catch (toggleError) {
      console.error(toggleError);

      setError(
        "Unable to change the publication status.",
      );
    }
  }

  async function handleDelete(
    item: GalleryRecord,
  ) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteDoc(
        doc(db, "gallery", item.id),
      );

      if (item.imagePath) {
        try {
          await storageProvider.deleteFile(
            item.imagePath,
          );
        } catch (deleteError) {
          console.error(
            "Gallery image could not be deleted:",
            deleteError,
          );
        }
      }

      if (editingId === item.id) {
        resetForm();
      }

      setMessage(
        "Gallery item deleted successfully.",
      );

      await loadGallery();
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        "Unable to delete the gallery item.",
      );
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">
              Administration
            </span>

            <h1>Gallery Manager</h1>

            <p>
              Add, edit, publish, unpublish,
              reorder, and delete gallery items.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                window.location.href =
                  "/admin/dashboard";
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

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {error && (
          <div className="admin-message admin-message-error">
            {error}
          </div>
        )}

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <span className="section-eyebrow">
                {editingId
                  ? "Edit Gallery Item"
                  : "Add Gallery Item"}
              </span>

              <h2>
                {editingId
                  ? "Update Gallery Item"
                  : "Create Gallery Item"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="admin-form"
          >
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
                <span>Gallery Image</span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />

                <small>
                  JPEG, PNG, or WebP.
                  Maximum file size: 5 MB.
                </small>

                {selectedImage && (
                  <p>
                    Selected:{" "}
                    <strong>
                      {selectedImage.name}
                    </strong>
                  </p>
                )}

                {!selectedImage &&
                  form.image && (
                    <div>
                      <p>Current image:</p>

                      <img
                        src={form.image}
                        alt={form.title || "Gallery"}
                        style={{
                          width: "160px",
                          height: "110px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
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
                  ? selectedImage
                    ? "Uploading & Saving..."
                    : "Saving..."
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
              <span className="section-eyebrow">
                Existing Gallery Items
              </span>

              <h2>Gallery Library</h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">
              Loading gallery...
            </div>
          ) : items.length === 0 ? (
            <div className="admin-message">
              No gallery items have been added yet.
            </div>
          ) : (
            <div className="admin-list">
              {items.map((item) => (
                <article
                  className="admin-list-item"
                  key={item.id}
                >
                  <div className="admin-list-content">
                    <div className="admin-list-meta">
                      <span>
                        {item.category}
                      </span>

                      <span>
                        {item.published
                          ? "Published"
                          : "Draft"}
                      </span>

                      <span>
                        Order {item.order}
                      </span>
                    </div>

                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          width: "160px",
                          height: "110px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "12px",
                        }}
                      />
                    )}

                    <h3>{item.title}</h3>

                    <p>
                      {item.description}
                    </p>

                    {item.image && (
                      <div className="admin-list-details">
                        <a
                          href={item.image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Image
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="admin-list-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() =>
                        startEdit(item)
                      }
                      disabled={saving}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() =>
                        togglePublished(item)
                      }
                      disabled={saving}
                    >
                      {item.published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() =>
                        handleDelete(item)
                      }
                      disabled={saving}
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