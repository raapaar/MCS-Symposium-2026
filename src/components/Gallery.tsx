import { galleryItems } from "../data/gallery";

function Gallery() {
  const publishedItems = galleryItems.filter(
    (item) => item.published,
  );

  return (
    <section className="gallery-section" id="gallery">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Event Highlights</span>

          <h2>Gallery</h2>

          <p>
            Explore highlights from the Mathematics and Computing Science
            Department and MCS Symposium 2026.
          </p>
        </div>

        <div className="gallery-grid">
          {publishedItems.map((item) => (
            <article className="gallery-card" key={item.id}>
              <div className="gallery-image-wrapper">
                <img
                  src={item.image}
                  alt={item.title}
                  className="gallery-image"
                />
              </div>

              <div className="gallery-content">
                <span className="gallery-category">
                  {item.category}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;