import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
  query,
  where,
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

function Gallery() {
  const [items, setItems] = useState<
    GalleryRecord[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);
        setError("");

        const galleryQuery = query(
          collection(db, "gallery"),
          where("published", "==", true),
        );

        const snapshot =
          await getDocs(galleryQuery);

        const publishedItems: GalleryRecord[] =
          snapshot.docs
            .map((item) => {
              const data = item.data();

              return {
                id: item.id,
                title: data.title ?? "",
                description:
                  data.description ?? "",
                image: data.image ?? "",
                category:
                  data.category ?? "",
                order:
                  typeof data.order ===
                  "number"
                    ? data.order
                    : 0,
                published:
                  data.published === true,
              };
            })
            .sort(
              (a, b) =>
                a.order - b.order,
            );

        setItems(publishedItems);
      } catch (loadError) {
        console.error(loadError);

        setError(
          "Unable to load gallery items at this time.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadGallery();
  }, []);

  return (
    <section
      className="gallery-section"
      id="gallery"
    >
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">
            Event Highlights
          </span>

          <h2>Gallery</h2>

          <p>
            Explore highlights from the
            Mathematics and Computing Science
            Department and MCS Symposium 2026.
          </p>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading gallery...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          items.length === 0 && (
            <div className="schedule-message">
              No gallery images are currently
              available.
            </div>
          )}

        {!loading &&
          !error &&
          items.length > 0 && (
            <div className="gallery-grid">
              {items.map((item) => (
                <article
                  className="gallery-card"
                  key={item.id}
                >
                  <div className="gallery-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="gallery-image-placeholder">
                        Image not available
                      </div>
                    )}
                  </div>

                  <div className="gallery-content">
                    {item.category && (
                      <span className="gallery-category">
                        {item.category}
                      </span>
                    )}

                    <h3>{item.title}</h3>

                    {item.description && (
                      <p>
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}

export default Gallery;