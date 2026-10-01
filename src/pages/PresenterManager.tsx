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

type SpeakerType = "presenter" | "keynote" | "guest";

interface PresenterScreenshot {
  url: string;
  path: string;
}

interface PresenterForm {
  name: string;
  role: string;
  category: string;
  speakerType: SpeakerType;
  topic: string;
  biography: string;
  projectDescription: string;
  projectUrl: string;
  imageUrl: string;
  imagePath: string;
  screenshots: PresenterScreenshot[];
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
  speakerType: "presenter",
  topic: "",
  biography: "",
  projectDescription: "",
  projectUrl: "",
  imageUrl: "",
  imagePath: "",
  screenshots: [],
  linkedinUrl: "",
  order: 1,
  published: false,
};

function PresenterManager() {
  const [presenters, setPresenters] = useState<
    PresenterRecord[]
  >([]);

  const [form, setForm] =
    useState<PresenterForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [selectedScreenshots, setSelectedScreenshots] =
    useState<File[]>([]);

  const [removedScreenshotPaths, setRemovedScreenshotPaths] =
    useState<string[]>([]);

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

      const snapshot =
        await getDocs(presentersQuery);

      const loadedPresenters: PresenterRecord[] =
        snapshot.docs.map((presenterDoc) => {
          const data = presenterDoc.data();

          return {
            id: presenterDoc.id,
            name: data.name ?? "",
            role: data.role ?? "",
            category: data.category ?? "",
            speakerType:
              data.speakerType === "keynote"
                ? "keynote"
                : data.speakerType === "guest"
                  ? "guest"
                  : "presenter",
            topic: data.topic ?? "",
            biography: data.biography ?? "",
            projectDescription: data.projectDescription ?? "",
            projectUrl: data.projectUrl ?? "",
            imageUrl: data.imageUrl ?? "",
            imagePath: data.imagePath ?? "",
            screenshots: Array.isArray(data.screenshots)
              ? data.screenshots.filter(
                  (item: unknown): item is PresenterScreenshot =>
                    typeof item === "object" &&
                    item !== null &&
                    typeof (item as PresenterScreenshot).url === "string" &&
                    typeof (item as PresenterScreenshot).path === "string",
                )
              : [],
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

    setSelectedImage(null);
    setSelectedScreenshots([]);
    setRemovedScreenshotPaths([]);
    setEditingId(null);
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
        "Presenter image must be JPEG, PNG, or WebP.",
      );

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedImage(null);
      event.target.value = "";

      setError(
        "Presenter image must not exceed 5 MB.",
      );

      return;
    }

    setSelectedImage(file);
  };

  const handleScreenshotsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError("");

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setSelectedScreenshots([]);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        event.target.value = "";
        setSelectedScreenshots([]);
        setError("Project screenshots must be JPEG, PNG, or WebP.");
        return;
      }

      if (file.size > maxSize) {
        event.target.value = "";
        setSelectedScreenshots([]);
        setError("Each project screenshot must not exceed 5 MB.");
        return;
      }
    }

    setSelectedScreenshots(files);
  };

  const removeExistingScreenshot = (path: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      screenshots: currentForm.screenshots.filter(
        (screenshot) => screenshot.path !== path,
      ),
    }));

    setRemovedScreenshotPaths((currentPaths) =>
      currentPaths.includes(path)
        ? currentPaths
        : [...currentPaths, path],
    );
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

    if (
      form.projectUrl.trim() &&
      !/^https:\/\/.+/i.test(form.projectUrl.trim())
    ) {
      setError("Project URL must start with https://.");
      return;
    }

    setSaving(true);

    let newImagePath = "";
    const newScreenshotPaths: string[] = [];
    let oldImagePathToDelete = "";

    try {
      let imageUrl = form.imageUrl;
      let imagePath = form.imagePath;

      if (selectedImage) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedImage,
            "presenters",
          );

        newImagePath = uploadResult.path;

        if (editingId && form.imagePath) {
          oldImagePathToDelete = form.imagePath;
        }

        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
      }

      const uploadedScreenshots: PresenterScreenshot[] = [];

      for (const screenshot of selectedScreenshots) {
        const uploadResult =
          await storageProvider.uploadFile(
            screenshot,
            "presenters",
          );

        newScreenshotPaths.push(uploadResult.path);
        uploadedScreenshots.push({
          url: uploadResult.url,
          path: uploadResult.path,
        });
      }

      const screenshots = [
        ...form.screenshots,
        ...uploadedScreenshots,
      ];

      const presenterData = {
        name: form.name.trim(),
        role: form.role.trim(),
        category: form.category.trim(),
        speakerType: form.speakerType,
        topic: form.topic.trim(),
        biography: form.biography.trim(),
        projectDescription: form.projectDescription.trim(),
        projectUrl: form.projectUrl.trim(),
        imageUrl,
        imagePath,
        screenshots,
        linkedinUrl: form.linkedinUrl.trim(),
        order: Number(form.order),
        published: form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "presenters", editingId),
          presenterData,
        );

        setMessage(
          "Presenter updated successfully.",
        );
      } else {
        await addDoc(
          collection(db, "presenters"),
          presenterData,
        );

        setMessage(
          "Presenter added successfully.",
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
            "Old presenter image could not be deleted:",
            deleteError,
          );
        }
      }

      for (const path of removedScreenshotPaths) {
        try {
          await storageProvider.deleteFile(path);
        } catch (deleteError) {
          console.error(
            "Removed project screenshot could not be deleted:",
            deleteError,
          );
        }
      }

      resetForm();
      await loadPresenters();
    } catch (saveError) {
      console.error(
        "Unable to save presenter:",
        saveError,
      );

      if (newImagePath) {
        try {
          await storageProvider.deleteFile(
            newImagePath,
          );
        } catch (cleanupError) {
          console.error(
            "Uploaded image cleanup failed:",
            cleanupError,
          );
        }
      }

      for (const path of newScreenshotPaths) {
        try {
          await storageProvider.deleteFile(path);
        } catch (cleanupError) {
          console.error(
            "Uploaded screenshot cleanup failed:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save presenter.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (
    presenter: PresenterRecord,
  ) => {
    setEditingId(presenter.id);

    setForm({
      name: presenter.name,
      role: presenter.role,
      category: presenter.category,
      speakerType: presenter.speakerType,
      topic: presenter.topic,
      biography: presenter.biography,
      projectDescription: presenter.projectDescription,
      projectUrl: presenter.projectUrl,
      imageUrl: presenter.imageUrl,
      imagePath: presenter.imagePath,
      screenshots: presenter.screenshots,
      linkedinUrl: presenter.linkedinUrl,
      order: presenter.order,
      published: presenter.published,
    });

    setSelectedImage(null);
    setSelectedScreenshots([]);
    setRemovedScreenshotPaths([]);
    setMessage("");
    setError("");
  };

  const handleDelete = async (
    presenter: PresenterRecord,
  ) => {
    const confirmed = window.confirm(
      "Delete this presenter?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteDoc(
        doc(db, "presenters", presenter.id),
      );

      if (presenter.imagePath) {
        try {
          await storageProvider.deleteFile(
            presenter.imagePath,
          );
        } catch (deleteError) {
          console.error(
            "Presenter image could not be deleted:",
            deleteError,
          );
        }
      }

      for (const screenshot of presenter.screenshots) {
        try {
          await storageProvider.deleteFile(screenshot.path);
        } catch (deleteError) {
          console.error(
            "Presenter screenshot could not be deleted:",
            deleteError,
          );
        }
      }

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
          <p className="section-eyebrow">
            MCS Symposium 2026
          </p>

          <h1>Presenter Manager</h1>
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
            Symposium Presenters
          </p>

          <h2>
            {editingId
              ? "Edit Presenter"
              : "Add Presenter"}
          </h2>

          <p>
            Add and manage presenter information.
            Keep records as drafts until official
            presenter details are confirmed.
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
                <label htmlFor="presenter-speaker-type">
                  Speaker Type
                </label>

                <select
                  id="presenter-speaker-type"
                  value={form.speakerType}
                  onChange={(event) =>
                    handleInputChange(
                      "speakerType",
                      event.target.value as SpeakerType,
                    )
                  }
                >
                  <option value="presenter">Presenter</option>
                  <option value="keynote">Keynote Speaker</option>
                  <option value="guest">Guest Speaker</option>
                </select>
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

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-project-description">
                  Full Project / Presentation Description
                </label>

                <textarea
                  id="presenter-project-description"
                  rows={8}
                  placeholder="Describe the project, problem, approach, features, results, or presentation in detail."
                  value={form.projectDescription}
                  onChange={(event) =>
                    handleInputChange(
                      "projectDescription",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-project-url">
                  Project URL (Optional)
                </label>

                <input
                  id="presenter-project-url"
                  type="url"
                  placeholder="https://..."
                  value={form.projectUrl}
                  onChange={(event) =>
                    handleInputChange(
                      "projectUrl",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-image">
                  Presenter Image
                </label>

                <input
                  id="presenter-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />

                <small>
                  JPEG, PNG, or WebP. Maximum
                  file size: 5 MB.
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
                  form.imageUrl && (
                    <div>
                      <p>Current image:</p>

                      <img
                        src={form.imageUrl}
                        alt="Current presenter"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="presenter-screenshots">
                  Project Screenshots
                </label>

                <input
                  id="presenter-screenshots"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleScreenshotsChange}
                />

                <small>
                  Select one or more JPEG, PNG, or WebP images.
                  Maximum 5 MB per screenshot.
                </small>

                {selectedScreenshots.length > 0 && (
                  <p>
                    {selectedScreenshots.length} new screenshot
                    {selectedScreenshots.length === 1 ? "" : "s"} selected.
                  </p>
                )}

                {form.screenshots.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    {form.screenshots.map((screenshot) => (
                      <div key={screenshot.path}>
                        <img
                          src={screenshot.url}
                          alt="Project screenshot"
                          style={{
                            width: "100%",
                            height: "110px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />

                        <button
                          type="button"
                          className="admin-danger-button"
                          onClick={() =>
                            removeExistingScreenshot(
                              screenshot.path,
                            )
                          }
                          disabled={saving}
                          style={{ marginTop: "8px" }}
                        >
                          Remove Screenshot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  ? selectedImage
                    ? "Uploading & Saving..."
                    : "Saving..."
                  : editingId
                    ? "Update Presenter"
                    : "Add Presenter"}
              </button>

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
              disabled={saving}
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
                        {presenter.speakerType === "keynote"
                          ? "Keynote Speaker"
                          : presenter.speakerType === "guest"
                            ? "Guest Speaker"
                            : presenter.category}
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

                    {presenter.imageUrl && (
                      <img
                        src={presenter.imageUrl}
                        alt={presenter.name}
                        style={{
                          width: "90px",
                          height: "90px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "12px",
                        }}
                      />
                    )}

                    <h3>{presenter.name}</h3>

                    <p>{presenter.role}</p>

                    <p>{presenter.topic}</p>

                    {presenter.projectDescription && (
                      <small>Project description added</small>
                    )}

                    {presenter.screenshots.length > 0 && (
                      <small>
                        {presenter.screenshots.length} project screenshot
                        {presenter.screenshots.length === 1 ? "" : "s"}
                      </small>
                    )}

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
                        disabled={saving}
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
                        disabled={saving}
                      >
                        {presenter.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(presenter)
                        }
                        disabled={saving}
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