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

interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  fileName: string;
  url: string;
  published: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  date: "",
  category: "",
  fileName: "",
  url: "",
  published: false,
};

function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const documentsQuery = query(
        collection(db, "documents"),
        orderBy("date", "desc"),
      );

      const snapshot = await getDocs(documentsQuery);

      const records: DocumentRecord[] = snapshot.docs.map((document) => {
        const data = document.data();

        return {
          id: document.id,
          title: data.title ?? "",
          description: data.description ?? "",
          date: data.date ?? "",
          category: data.category ?? "",
          fileName: data.fileName ?? "",
          url: data.url ?? "",
          published: data.published === true,
        };
      });

      setDocuments(records);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
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
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(documentRecord: DocumentRecord) {
    setEditingId(documentRecord.id);

    setForm({
      title: documentRecord.title,
      description: documentRecord.description,
      date: documentRecord.date,
      category: documentRecord.category,
      fileName: documentRecord.fileName,
      url: documentRecord.url,
      published: documentRecord.published,
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
      setError("Document title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Document description is required.");
      return;
    }

    if (!form.date) {
      setError("Document date is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Document category is required.");
      return;
    }

    if (!form.fileName.trim()) {
      setError("File name is required.");
      return;
    }

    if (form.url.trim()) {
      try {
        new URL(form.url.trim());
      } catch {
        setError("Please enter a valid document URL.");
        return;
      }
    }

    const documentData = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      category: form.category.trim(),
      fileName: form.fileName.trim(),
      url: form.url.trim(),
      published: form.published,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateDoc(doc(db, "documents", editingId), documentData);
        setMessage("Document updated successfully.");
      } else {
        await addDoc(collection(db, "documents"), documentData);
        setMessage("Document added successfully.");
      }

      resetForm();
      await loadDocuments();
    } catch (saveError) {
      console.error(saveError);
      setError("Unable to save the document.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(documentRecord: DocumentRecord) {
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "documents", documentRecord.id), {
        published: !documentRecord.published,
      });

      setMessage(
        documentRecord.published
          ? "Document unpublished."
          : "Document published.",
      );

      await loadDocuments();
    } catch (toggleError) {
      console.error(toggleError);
      setError("Unable to change the document publication status.");
    }
  }

  async function handleDelete(documentRecord: DocumentRecord) {
    const confirmed = window.confirm(
      `Delete "${documentRecord.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteDoc(doc(db, "documents", documentRecord.id));

      if (editingId === documentRecord.id) {
        resetForm();
      }

      setMessage("Document deleted successfully.");
      await loadDocuments();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Unable to delete the document.");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">Administration</span>

            <h1>Document Manager</h1>

            <p>
              Add, edit, publish, unpublish, and delete symposium documents.
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

        {error && <div className="admin-message admin-message-error">{error}</div>}

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <span className="section-eyebrow">
                {editingId ? "Edit Document" : "Add Document"}
              </span>

              <h2>{editingId ? "Update Document" : "Create Document"}</h2>
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
                  placeholder="MCS Symposium 2026 Program"
                />
              </label>

              <label>
                <span>Category</span>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Program"
                />
              </label>

              <label>
                <span>Date</span>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>File Name</span>

                <input
                  type="text"
                  name="fileName"
                  value={form.fileName}
                  onChange={handleChange}
                  placeholder="official-program.pdf"
                />
              </label>

              <label className="admin-form-full">
                <span>Document URL</span>

                <input
                  type="url"
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://example.com/document.pdf"
                />

                <small>
                  Leave blank until the official document is available.
                </small>
              </label>

              <label className="admin-form-full">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Brief description of the document."
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
                    ? "Update Document"
                    : "Add Document"}
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
              <span className="section-eyebrow">Existing Documents</span>

              <h2>Document Library</h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="admin-message">
              No documents have been added yet.
            </div>
          ) : (
            <div className="admin-list">
              {documents.map((documentRecord) => (
                <article className="admin-list-item" key={documentRecord.id}>
                  <div className="admin-list-content">
                    <div className="admin-list-meta">
                      <span>{documentRecord.category}</span>

                      <span>
                        {documentRecord.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <h3>{documentRecord.title}</h3>

                    <p>{documentRecord.description}</p>

                    <div className="admin-list-details">
                      <span>{documentRecord.fileName}</span>

                      <span>{documentRecord.date}</span>

                      {documentRecord.url && (
                        <a
                          href={documentRecord.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Document
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="admin-list-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => startEdit(documentRecord)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => togglePublished(documentRecord)}
                    >
                      {documentRecord.published ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => handleDelete(documentRecord)}
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

export default DocumentManager;