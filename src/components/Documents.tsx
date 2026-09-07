import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
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

function Documents() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");

        const documentsQuery = query(
          collection(db, "documents"),
          where("published", "==", true),
        );

        const snapshot = await getDocs(documentsQuery);

        const publishedDocuments: DocumentRecord[] = snapshot.docs
          .map((document) => {
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
          })
          .sort((a, b) => b.date.localeCompare(a.date));

        setDocuments(publishedDocuments);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load documents at this time.");
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  return (
    <section className="documents-section" id="documents">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Resources</span>

          <h2>Documents</h2>

          <p>
            Access symposium programs, guidelines, and other official event
            resources.
          </p>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading documents...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="schedule-message">
            No documents are currently available.
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="documents-list">
            {documents.map((document) => (
              <article className="document-item" key={document.id}>
                <div className="document-icon" aria-hidden="true">
                  PDF
                </div>

                <div className="document-content">
                  <span className="document-category">
                    {document.category}
                  </span>

                  <h3>{document.title}</h3>

                  <p>{document.description}</p>

                  {document.date && (
                    <time dateTime={document.date}>
                      {new Date(document.date).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>

                {document.url ? (
                  <a
                    href={document.url}
                    className="document-button"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${document.title}`}
                  >
                    Download
                  </a>
                ) : (
                  <button
                    type="button"
                    className="document-button"
                    disabled
                    aria-label={`${document.title} is not available yet`}
                  >
                    Not Available
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Documents;