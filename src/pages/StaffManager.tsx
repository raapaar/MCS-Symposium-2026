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
import type { StaffMember } from "../types/staff";

type StaffForm = Omit<StaffMember, "id">;

const emptyForm: StaffForm = {
  name: "",
  title: "",
  position: "",
  specialization: "",
  biography: "",
  imageUrl: "",
  imagePath: "",
  profileUrl: "",
  email: "",
  order: 1,
  published: false,
};

function StaffManager() {
  const [staff, setStaff] =
    useState<StaffMember[]>([]);

  const [form, setForm] =
    useState<StaffForm>(emptyForm);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const staffQuery = query(
        collection(db, "staff"),
        orderBy("order", "asc"),
      );

      const snapshot =
        await getDocs(staffQuery);

      const records: StaffMember[] =
        snapshot.docs.map((staffDocument) => {
          const data = staffDocument.data();

          return {
            id: staffDocument.id,

            name:
              data.name ?? "",

            title:
              data.title ?? "",

            position:
              data.position ?? "",

            specialization:
              data.specialization ?? "",

            biography:
              data.biography ?? "",

            imageUrl:
              data.imageUrl ?? "",

            imagePath:
              data.imagePath ?? "",

            profileUrl:
              data.profileUrl ?? "",

            email:
              data.email ?? "",

            order:
              typeof data.order === "number"
                ? data.order
                : 0,

            published:
              data.published === true,
          };
        });

      setStaff(records);
    } catch (loadError) {
      console.error(loadError);

      setError(
        "Unable to load department staff.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) {
    const {
      name,
      value,
      type,
    } = event.target;

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
        "Staff photo must be JPEG, PNG, or WebP.",
      );

      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedImage(null);
      event.target.value = "";

      setError(
        "Staff photo must not exceed 5 MB.",
      );

      return;
    }

    setSelectedImage(file);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      order: staff.length + 1,
    });

    setSelectedImage(null);
    setEditingId(null);
  }

  function startEdit(
    staffMember: StaffMember,
  ) {
    setEditingId(staffMember.id);

    setForm({
      name:
        staffMember.name,

      title:
        staffMember.title,

      position:
        staffMember.position,

      specialization:
        staffMember.specialization,

      biography:
        staffMember.biography,

      imageUrl:
        staffMember.imageUrl,

      imagePath:
        staffMember.imagePath,

      profileUrl:
        staffMember.profileUrl,

      email:
        staffMember.email,

      order:
        staffMember.order,

      published:
        staffMember.published,
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

    if (!form.name.trim()) {
      setError(
        "Staff member name is required.",
      );

      return;
    }

    if (!form.position.trim()) {
      setError(
        "Position is required.",
      );

      return;
    }

    if (!form.specialization.trim()) {
      setError(
        "Specialization or discipline is required.",
      );

      return;
    }

    if (!form.biography.trim()) {
      setError(
        "Biography is required.",
      );

      return;
    }

    if (
      !Number.isFinite(form.order) ||
      form.order < 1
    ) {
      setError(
        "Display order must be greater than 0.",
      );

      return;
    }

    if (form.profileUrl.trim()) {
      try {
        const profileUrl =
          new URL(form.profileUrl.trim());

        if (
          profileUrl.protocol !== "http:" &&
          profileUrl.protocol !== "https:"
        ) {
          throw new Error(
            "Unsupported URL protocol.",
          );
        }
      } catch {
        setError(
          "Please enter a valid profile URL beginning with http:// or https://.",
        );

        return;
      }
    }

    setSaving(true);

    let newImagePath = "";
    let oldImagePathToDelete = "";

    try {
      let imageUrl =
        form.imageUrl;

      let imagePath =
        form.imagePath;

      if (selectedImage) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedImage,
            "staff",
          );

        newImagePath =
          uploadResult.path;

        if (
          editingId &&
          form.imagePath
        ) {
          oldImagePathToDelete =
            form.imagePath;
        }

        imageUrl =
          uploadResult.url;

        imagePath =
          uploadResult.path;
      }

      const staffData = {
        name:
          form.name.trim(),

        title:
          form.title.trim(),

        position:
          form.position.trim(),

        specialization:
          form.specialization.trim(),

        biography:
          form.biography.trim(),

        imageUrl,
        imagePath,

        profileUrl:
          form.profileUrl.trim(),

        email:
          form.email.trim(),

        order:
          Number(form.order),

        published:
          form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "staff",
            editingId,
          ),
          staffData,
        );

        setMessage(
          "Staff member updated successfully.",
        );
      } else {
        await addDoc(
          collection(
            db,
            "staff",
          ),
          staffData,
        );

        setMessage(
          "Staff member added successfully.",
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
            "Old staff image could not be deleted:",
            deleteError,
          );
        }
      }

      resetForm();

      await loadStaff();
    } catch (saveError) {
      console.error(saveError);

      if (newImagePath) {
        try {
          await storageProvider.deleteFile(
            newImagePath,
          );
        } catch (cleanupError) {
          console.error(
            "Uploaded staff image cleanup failed:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the staff member.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(
    staffMember: StaffMember,
  ) {
    setMessage("");
    setError("");

    try {
      await updateDoc(
        doc(
          db,
          "staff",
          staffMember.id,
        ),
        {
          published:
            !staffMember.published,
        },
      );

      setMessage(
        staffMember.published
          ? "Staff member unpublished."
          : "Staff member published.",
      );

      await loadStaff();
    } catch (toggleError) {
      console.error(toggleError);

      setError(
        "Unable to change publication status.",
      );
    }
  }

  async function handleDelete(
    staffMember: StaffMember,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${staffMember.name}"? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteDoc(
        doc(
          db,
          "staff",
          staffMember.id,
        ),
      );

      if (staffMember.imagePath) {
        try {
          await storageProvider.deleteFile(
            staffMember.imagePath,
          );
        } catch (deleteError) {
          console.error(
            "Staff image could not be deleted:",
            deleteError,
          );
        }
      }

      if (
        editingId === staffMember.id
      ) {
        resetForm();
      }

      setMessage(
        "Staff member deleted successfully.",
      );

      await loadStaff();
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        "Unable to delete the staff member.",
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

            <h1>
              Department Staff &amp; Lecturers
            </h1>

            <p>
              Manage the Mathematics and
              Computing Science department
              staff displayed on the public
              symposium website.
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
                  ? "Edit Staff Member"
                  : "Add Staff Member"}
              </span>

              <h2>
                {editingId
                  ? "Update Staff Profile"
                  : "Create Staff Profile"}
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
            className="admin-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-grid">
              <label>
                <span>
                  Full Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Staff member name"
                />
              </label>

              <label>
                <span>
                  Title
                </span>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Dr., Mr., Ms., Prof..."
                />
              </label>

              <label>
                <span>
                  Position
                </span>

                <input
                  type="text"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="Lecturer, Head of Department..."
                />
              </label>

              <label>
                <span>
                  Specialization / Discipline
                </span>

                <input
                  type="text"
                  name="specialization"
                  value={
                    form.specialization
                  }
                  onChange={handleChange}
                  placeholder="Computer Science, Mathematics..."
                />
              </label>

              <label>
                <span>
                  Display Order
                </span>

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
                <span>
                  Staff Photo
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                />

                <small>
                  JPEG, PNG, or WebP.
                  Maximum size: 5 MB.
                </small>

                {selectedImage && (
                  <p>
                    Selected:{" "}
                    <strong>
                      {
                        selectedImage.name
                      }
                    </strong>
                  </p>
                )}

                {!selectedImage &&
                  form.imageUrl && (
                    <div>
                      <p>
                        Current photo:
                      </p>

                      <img
                        src={
                          form.imageUrl
                        }
                        alt={
                          form.name ||
                          "Staff member"
                        }
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius:
                            "12px",
                        }}
                      />
                    </div>
                  )}
              </label>

              <label className="admin-form-full">
                <span>
                  Biography
                </span>

                <textarea
                  name="biography"
                  value={
                    form.biography
                  }
                  onChange={handleChange}
                  rows={6}
                  placeholder="Short professional biography..."
                />
              </label>

              <label className="admin-form-full">
                <span>
                  Profile URL
                </span>

                <input
                  type="url"
                  name="profileUrl"
                  value={
                    form.profileUrl
                  }
                  onChange={handleChange}
                  placeholder="https://..."
                />

                <small>
                  Optional department,
                  university, research, or
                  professional profile.
                </small>
              </label>

              <label className="admin-form-full">
                <span>
                  Contact Email
                </span>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Optional public email address"
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="published"
                  checked={
                    form.published
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Published
                </span>
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
                    ? "Update Staff Member"
                    : "Add Staff Member"}
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
                Department Directory
              </span>

              <h2>
                Existing Staff &amp;
                Lecturers
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">
              Loading department staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="admin-message">
              No department staff have
              been added yet.
            </div>
          ) : (
            <div className="admin-list">
              {staff.map(
                (staffMember) => (
                  <article
                    className="admin-list-item"
                    key={
                      staffMember.id
                    }
                  >
                    <div className="admin-list-content">
                      <div className="admin-list-meta">
                        <span>
                          {
                            staffMember.position
                          }
                        </span>

                        <span>
                          {
                            staffMember.specialization
                          }
                        </span>

                        <span>
                          {staffMember.published
                            ? "Published"
                            : "Draft"}
                        </span>

                        <span>
                          Order{" "}
                          {
                            staffMember.order
                          }
                        </span>
                      </div>

                      {staffMember.imageUrl && (
                        <img
                          src={
                            staffMember.imageUrl
                          }
                          alt={
                            staffMember.name
                          }
                          style={{
                            width:
                              "120px",
                            height:
                              "120px",
                            objectFit:
                              "cover",
                            borderRadius:
                              "12px",
                            marginBottom:
                              "12px",
                          }}
                        />
                      )}

                      <h3>
                        {staffMember.title
                          ? `${staffMember.title} ${staffMember.name}`
                          : staffMember.name}
                      </h3>

                      <p>
                        {
                          staffMember.biography
                        }
                      </p>

                      <div className="admin-list-details">
                        {staffMember.profileUrl && (
                          <a
                            href={
                              staffMember.profileUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Profile
                          </a>
                        )}

                        {staffMember.email && (
                          <a
                            href={`mailto:${staffMember.email}`}
                          >
                            Email
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="admin-list-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          startEdit(
                            staffMember,
                          )
                        }
                        disabled={saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          togglePublished(
                            staffMember,
                          )
                        }
                        disabled={saving}
                      >
                        {staffMember.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(
                            staffMember,
                          )
                        }
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default StaffManager;