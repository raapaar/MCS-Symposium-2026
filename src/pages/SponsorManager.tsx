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
import type { SponsorTier } from "../types/sponsor";

interface SponsorRecord {
  id: string;
  name: string;
  description: string;
  logo: string;
  logoPath: string;
  website: string;
  category: string;
  tier: SponsorTier;
  order: number;
  published: boolean;
}

interface SponsorForm {
  name: string;
  description: string;
  logo: string;
  logoPath: string;
  website: string;
  category: string;
  tier: SponsorTier;
  order: number;
  published: boolean;
}

const emptyForm: SponsorForm = {
  name: "",
  description: "",
  logo: "",
  logoPath: "",
  website: "",
  category: "",
  tier: "partner",
  order: 1,
  published: false,
};

function getSponsorTier(
  value: unknown,
): SponsorTier {
  if (
    value === "gold" ||
    value === "silver" ||
    value === "bronze"
  ) {
    return value;
  }

  return "partner";
}

function getSponsorTierLabel(
  tier: SponsorTier,
) {
  switch (tier) {
    case "gold":
      return "Gold Sponsor";

    case "silver":
      return "Silver Sponsor";

    case "bronze":
      return "Bronze Sponsor";

    default:
      return "Partner";
  }
}

function SponsorManager() {
  const [sponsors, setSponsors] =
    useState<SponsorRecord[]>([]);

  const [form, setForm] =
    useState<SponsorForm>(emptyForm);

  const [selectedLogo, setSelectedLogo] =
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

  async function loadSponsors() {
    try {
      setLoading(true);
      setError("");

      const sponsorsQuery = query(
        collection(db, "sponsors"),
        orderBy("order", "asc"),
      );

      const snapshot =
        await getDocs(sponsorsQuery);

      const records: SponsorRecord[] =
        snapshot.docs.map((sponsor) => {
          const data = sponsor.data();

          return {
            id: sponsor.id,
            name: data.name ?? "",
            description:
              data.description ?? "",
            logo: data.logo ?? "",
            logoPath:
              data.logoPath ?? "",
            website:
              data.website ?? "",
            category:
              data.category ?? "",

            // Backward compatibility:
            // old sponsor records without a tier
            // are treated as partners.
            tier: getSponsorTier(
              data.tier,
            ),

            order:
              typeof data.order ===
              "number"
                ? data.order
                : 0,

            published:
              data.published === true,
          };
        });

      setSponsors(records);
    } catch (loadError) {
      console.error(loadError);

      setError(
        "Unable to load sponsors and partners.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSponsors();
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

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const file =
      event.target.files?.[0] ??
      null;

    if (!file) {
      setSelectedLogo(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setSelectedLogo(null);
      event.target.value = "";

      setError(
        "Sponsor logo must be JPEG, PNG, or WebP.",
      );

      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedLogo(null);
      event.target.value = "";

      setError(
        "Sponsor logo must not exceed 5 MB.",
      );

      return;
    }

    setSelectedLogo(file);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      order:
        sponsors.length + 1,
    });

    setSelectedLogo(null);
    setEditingId(null);
  }

  function startEdit(
    sponsor: SponsorRecord,
  ) {
    setEditingId(sponsor.id);

    setForm({
      name: sponsor.name,
      description:
        sponsor.description,
      logo: sponsor.logo,
      logoPath:
        sponsor.logoPath,
      website:
        sponsor.website,
      category:
        sponsor.category,
      tier: sponsor.tier,
      order: sponsor.order,
      published:
        sponsor.published,
    });

    setSelectedLogo(null);
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
        "Sponsor or partner name is required.",
      );

      return;
    }

    if (
      !form.description.trim()
    ) {
      setError(
        "Description is required.",
      );

      return;
    }

    if (!form.category.trim()) {
      setError(
        "Category is required.",
      );

      return;
    }

    if (
      !editingId &&
      !selectedLogo
    ) {
      setError(
        "Please select a sponsor logo.",
      );

      return;
    }

    if (
      editingId &&
      !selectedLogo &&
      !form.logo
    ) {
      setError(
        "Please select a sponsor logo.",
      );

      return;
    }

    if (form.website.trim()) {
      try {
        new URL(
          form.website.trim(),
        );
      } catch {
        setError(
          "Please enter a valid website URL.",
        );

        return;
      }
    }

    if (
      !Number.isFinite(
        form.order,
      ) ||
      form.order < 1
    ) {
      setError(
        "Display order must be a number greater than 0.",
      );

      return;
    }

    setSaving(true);

    let newLogoPath = "";
    let oldLogoPathToDelete =
      "";

    try {
      let logo = form.logo;
      let logoPath =
        form.logoPath;

      if (selectedLogo) {
        const uploadResult =
          await storageProvider.uploadFile(
            selectedLogo,
            "sponsors",
          );

        newLogoPath =
          uploadResult.path;

        if (
          editingId &&
          form.logoPath
        ) {
          oldLogoPathToDelete =
            form.logoPath;
        }

        logo =
          uploadResult.url;

        logoPath =
          uploadResult.path;
      }

      const sponsorData = {
        name:
          form.name.trim(),

        description:
          form.description.trim(),

        logo,
        logoPath,

        website:
          form.website.trim(),

        category:
          form.category.trim(),

        tier: form.tier,

        order:
          Number(form.order),

        published:
          form.published,
      };

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "sponsors",
            editingId,
          ),
          sponsorData,
        );

        setMessage(
          "Sponsor or partner updated successfully.",
        );
      } else {
        await addDoc(
          collection(
            db,
            "sponsors",
          ),
          sponsorData,
        );

        setMessage(
          "Sponsor or partner added successfully.",
        );
      }

      if (
        oldLogoPathToDelete &&
        oldLogoPathToDelete !==
          logoPath
      ) {
        try {
          await storageProvider.deleteFile(
            oldLogoPathToDelete,
          );
        } catch (deleteError) {
          console.error(
            "Old sponsor logo could not be deleted:",
            deleteError,
          );
        }
      }

      resetForm();

      await loadSponsors();
    } catch (saveError) {
      console.error(
        saveError,
      );

      if (newLogoPath) {
        try {
          await storageProvider.deleteFile(
            newLogoPath,
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Uploaded sponsor logo cleanup failed:",
            cleanupError,
          );
        }
      }

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save the sponsor or partner.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(
    sponsor: SponsorRecord,
  ) {
    setMessage("");
    setError("");

    try {
      await updateDoc(
        doc(
          db,
          "sponsors",
          sponsor.id,
        ),
        {
          published:
            !sponsor.published,
        },
      );

      setMessage(
        sponsor.published
          ? "Sponsor or partner unpublished."
          : "Sponsor or partner published.",
      );

      await loadSponsors();
    } catch (toggleError) {
      console.error(
        toggleError,
      );

      setError(
        "Unable to change the publication status.",
      );
    }
  }

  async function handleDelete(
    sponsor: SponsorRecord,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${sponsor.name}"? This cannot be undone.`,
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
          "sponsors",
          sponsor.id,
        ),
      );

      if (
        sponsor.logoPath
      ) {
        try {
          await storageProvider.deleteFile(
            sponsor.logoPath,
          );
        } catch (
          deleteError
        ) {
          console.error(
            "Sponsor logo could not be deleted:",
            deleteError,
          );
        }
      }

      if (
        editingId ===
        sponsor.id
      ) {
        resetForm();
      }

      setMessage(
        "Sponsor or partner deleted successfully.",
      );

      await loadSponsors();
    } catch (deleteError) {
      console.error(
        deleteError,
      );

      setError(
        "Unable to delete the sponsor or partner.",
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
              Sponsors &amp;
              Partners
            </h1>

            <p>
              Add, edit,
              classify, publish,
              unpublish, reorder,
              and delete sponsors
              and event partners.
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
                window.location.href =
                  "/";
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
                  ? "Edit Sponsor"
                  : "Add Sponsor"}
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
                onClick={
                  resetForm
                }
                disabled={
                  saving
                }
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="admin-form"
          >
            <div className="admin-form-grid">
              <label>
                <span>
                  Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Organization or sponsor name"
                />
              </label>

              <label>
                <span>
                  Category
                </span>

                <input
                  type="text"
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Industry Partner, Technology Partner, Community Partner..."
                />

                <small>
                  Optional descriptive
                  classification separate
                  from the sponsor tier.
                </small>
              </label>

              <label>
                <span>
                  Sponsor Tier
                </span>

                <select
                  name="tier"
                  value={
                    form.tier
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="gold">
                    Gold Sponsor
                  </option>

                  <option value="silver">
                    Silver Sponsor
                  </option>

                  <option value="bronze">
                    Bronze Sponsor
                  </option>

                  <option value="partner">
                    Partner
                  </option>
                </select>

                <small>
                  Published Gold
                  Sponsors can be
                  featured in the
                  symposium hero.
                </small>
              </label>

              <label>
                <span>
                  Display Order
                </span>

                <input
                  type="number"
                  name="order"
                  value={
                    form.order
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  step="1"
                />
              </label>

              <label>
                <span>
                  Sponsor Logo
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleLogoChange
                  }
                />

                <small>
                  JPEG, PNG, or
                  WebP. Maximum file
                  size: 5 MB.
                </small>

                {selectedLogo && (
                  <p>
                    Selected:{" "}
                    <strong>
                      {
                        selectedLogo.name
                      }
                    </strong>
                  </p>
                )}

                {!selectedLogo &&
                  form.logo && (
                    <div>
                      <p>
                        Current logo:
                      </p>

                      <img
                        src={
                          form.logo
                        }
                        alt={
                          form.name ||
                          "Sponsor logo"
                        }
                        style={{
                          width:
                            "150px",
                          height:
                            "100px",
                          objectFit:
                            "contain",
                          borderRadius:
                            "8px",
                        }}
                      />
                    </div>
                  )}
              </label>

              <label className="admin-form-full">
                <span>
                  Website URL
                </span>

                <input
                  type="url"
                  name="website"
                  value={
                    form.website
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="https://example.com"
                />
              </label>

              <label className="admin-form-full">
                <span>
                  Description
                </span>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={5}
                  placeholder="Brief description of the sponsor or partner."
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
                disabled={
                  saving
                }
              >
                {saving
                  ? selectedLogo
                    ? "Uploading & Saving..."
                    : "Saving..."
                  : editingId
                    ? "Update Sponsor"
                    : "Add Sponsor"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
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
                Existing Sponsors
              </span>

              <h2>
                Sponsor &amp;
                Partner Library
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="admin-message">
              Loading sponsors...
            </div>
          ) : sponsors.length ===
            0 ? (
            <div className="admin-message">
              No sponsors or
              partners have been
              added yet.
            </div>
          ) : (
            <div className="admin-list">
              {sponsors.map(
                (sponsor) => (
                  <article
                    className="admin-list-item"
                    key={
                      sponsor.id
                    }
                  >
                    <div className="admin-list-content">
                      <div className="admin-list-meta">
                        <span>
                          {getSponsorTierLabel(
                            sponsor.tier,
                          )}
                        </span>

                        {sponsor.category && (
                          <span>
                            {
                              sponsor.category
                            }
                          </span>
                        )}

                        <span>
                          {sponsor.published
                            ? "Published"
                            : "Draft"}
                        </span>

                        <span>
                          Order{" "}
                          {
                            sponsor.order
                          }
                        </span>
                      </div>

                      {sponsor.logo && (
                        <img
                          src={
                            sponsor.logo
                          }
                          alt={
                            sponsor.name
                          }
                          style={{
                            width:
                              "150px",
                            height:
                              "100px",
                            objectFit:
                              "contain",
                            borderRadius:
                              "8px",
                            marginBottom:
                              "12px",
                          }}
                        />
                      )}

                      <h3>
                        {
                          sponsor.name
                        }
                      </h3>

                      <p>
                        {
                          sponsor.description
                        }
                      </p>

                      <div className="admin-list-details">
                        {sponsor.logo && (
                          <a
                            href={
                              sponsor.logo
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Logo
                          </a>
                        )}

                        {sponsor.website && (
                          <a
                            href={
                              sponsor.website
                            }
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
                        onClick={() =>
                          startEdit(
                            sponsor,
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() =>
                          togglePublished(
                            sponsor,
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        {sponsor.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() =>
                          handleDelete(
                            sponsor,
                          )
                        }
                        disabled={
                          saving
                        }
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

export default SponsorManager;