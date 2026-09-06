import { documents } from "../data/documents";

function Documents() {
  const publishedDocuments = documents.filter(
    (document) => document.published,
  );

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

        <div className="documents-list">
          {publishedDocuments.map((document) => (
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

                <time dateTime={document.date}>
                  {new Date(document.date).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>

              <button
                type="button"
                className="document-button"
                aria-label={`Download ${document.title}`}
              >
                Download
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Documents;