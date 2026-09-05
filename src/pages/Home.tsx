function Home() {
  return (
    <>
      {/* Hero */}
  <section id="home" className="hero-section">
  <div className="hero-overlay">
    <div className="hero-container">
      <p className="hero-eyebrow">
        DIVINE WORD UNIVERSITY
      </p>

      <h1>
        MCS Symposium
        <span>2026</span>
      </h1>

      <p className="hero-description">
        Mathematics and Computing Science Department
      </p>

      <p className="hero-introduction">
        Exploring ideas, innovation, research, and emerging
        technologies across mathematics and computing science.
      </p>

      <div className="hero-actions">
        <a
          href="#symposium"
          className="button button-primary"
        >
          Explore Symposium
        </a>

        <a
          href="#schedule"
          className="button button-secondary"
        >
          View Schedule
        </a>
      </div>
    </div>
  </div>
</section>

      {/* Event Information */}
      <section className="event-information">
        <div className="content-container event-grid">
          <div className="event-item">
            <span className="event-label">EVENT</span>
            <strong>MCS Symposium 2026</strong>
          </div>

          <div className="event-item">
            <span className="event-label">DEPARTMENT</span>
            <strong>Mathematics &amp; Computing Science</strong>
          </div>

          <div className="event-item">
            <span className="event-label">UNIVERSITY</span>
            <strong>Divine Word University</strong>
          </div>

          <div className="event-item">
            <span className="event-label">YEAR</span>
            <strong>2026</strong>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="symposium" className="content-section">
        <div className="content-container">
          <p className="section-label">ABOUT THE SYMPOSIUM</p>

          <h2>
            Mathematics, Computing, Innovation and Ideas
          </h2>

          <p className="section-introduction">
            The MCS Symposium 2026 provides a platform for students,
            academics, researchers, industry professionals, and guests
            to share knowledge, present ideas, and explore developments
            across mathematics and computing science.
          </p>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">01</div>

              <h3>Knowledge Sharing</h3>

              <p>
                Discover research, projects, concepts, and emerging
                ideas from the mathematics and computing science
                community.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">02</div>

              <h3>Innovation</h3>

              <p>
                Explore how technology, mathematics, and creative
                thinking can contribute to solving real-world
                challenges.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">03</div>

              <h3>Collaboration</h3>

              <p>
                Connect students, academics, researchers, and
                professionals through meaningful discussions and
                presentations.
              </p>
            </article>
          </div>
        </div>
      </section>

    {/* Presenters */}
<section
  id="presenters"
  className="content-section presenters-section"
>
  <div className="content-container">

    <div className="section-heading-row">
      <div>
        <p className="section-label">PRESENTERS</p>

        <h2>Meet the Symposium Presenters</h2>

        <p>
          Discover the academics, researchers, students, industry
          professionals, and invited guests contributing to the
          MCS Symposium 2026.
        </p>
      </div>

      <a
        href="#presenters"
        className="button button-primary"
      >
        View All Presenters
      </a>
    </div>

    <div className="presenter-grid">

      <article className="presenter-card">
        <div className="presenter-image-placeholder">
          <span>Presenter</span>
        </div>

        <div className="presenter-content">
          <span className="presenter-category">
            FEATURED PRESENTER
          </span>

          <h3>Presenter Name</h3>

          <p className="presenter-role">
            Academic / Researcher
          </p>

          <p className="presenter-topic">
            Presentation topic will appear here.
          </p>
        </div>
      </article>

      <article className="presenter-card">
        <div className="presenter-image-placeholder">
          <span>Presenter</span>
        </div>

        <div className="presenter-content">
          <span className="presenter-category">
            FEATURED PRESENTER
          </span>

          <h3>Presenter Name</h3>

          <p className="presenter-role">
            Academic / Researcher
          </p>

          <p className="presenter-topic">
            Presentation topic will appear here.
          </p>
        </div>
      </article>

      <article className="presenter-card">
        <div className="presenter-image-placeholder">
          <span>Presenter</span>
        </div>

        <div className="presenter-content">
          <span className="presenter-category">
            FEATURED PRESENTER
          </span>

          <h3>Presenter Name</h3>

          <p className="presenter-role">
            Academic / Researcher
          </p>

          <p className="presenter-topic">
            Presentation topic will appear here.
          </p>
        </div>
      </article>

    </div>

  </div>
</section>

{/* Schedule */}
<section
  id="schedule"
  className="content-section schedule-section"
>
  <div className="content-container">

    <div className="section-heading-row">
      <div>
        <p className="section-label">PROGRAM</p>

        <h2>Symposium Schedule</h2>

        <p>
          Explore the program, session times, presentation topics,
          and activities planned for MCS Symposium 2026.
        </p>
      </div>

      <a
        href="#schedule"
        className="button button-primary"
      >
        Full Program
      </a>
    </div>

    <div className="schedule-list">

      <article className="schedule-item">
        <div className="schedule-time">
          <strong>09:00</strong>
          <span>AM</span>
        </div>

        <div className="schedule-details">
          <span className="schedule-type">
            OPENING
          </span>

          <h3>Welcome and Opening</h3>

          <p>
            Opening remarks and introduction to MCS Symposium 2026.
          </p>
        </div>

        <div className="schedule-location">
          Main Venue
        </div>
      </article>

      <article className="schedule-item">
        <div className="schedule-time">
          <strong>10:00</strong>
          <span>AM</span>
        </div>

        <div className="schedule-details">
          <span className="schedule-type">
            KEYNOTE
          </span>

          <h3>Keynote Presentation</h3>

          <p>
            Featured presentation exploring current developments
            in mathematics and computing science.
          </p>
        </div>

        <div className="schedule-location">
          Main Venue
        </div>
      </article>

      <article className="schedule-item">
        <div className="schedule-time">
          <strong>11:30</strong>
          <span>AM</span>
        </div>

        <div className="schedule-details">
          <span className="schedule-type">
            PRESENTATION
          </span>

          <h3>Research and Innovation Session</h3>

          <p>
            Presentations highlighting research, projects, and
            innovative ideas.
          </p>
        </div>

        <div className="schedule-location">
          Main Venue
        </div>
      </article>

      <article className="schedule-item">
        <div className="schedule-time">
          <strong>01:30</strong>
          <span>PM</span>
        </div>

        <div className="schedule-details">
          <span className="schedule-type">
            PANEL
          </span>

          <h3>Discussion and Collaboration</h3>

          <p>
            An opportunity for presenters and participants to
            exchange ideas and perspectives.
          </p>
        </div>

        <div className="schedule-location">
          Main Venue
        </div>
      </article>

    </div>

  </div>
</section>

{/* Contact */}
<section
  id="contact"
  className="content-section content-section-alt contact-section-wrapper"
>
  <div className="content-container contact-section">

    <p className="section-label">GET IN TOUCH</p>

    <h2>Have a Question?</h2>

    <p>
      Contact the Mathematics and Computing Science Department
      for symposium information, enquiries, and updates.
    </p>

    <div className="contact-actions">
      <a
        href="mailto:mcs@dwu.ac.pg"
        className="button button-primary"
      >
        Email the Department
      </a>
    </div>

    <div className="contact-details">

      <div className="contact-detail">
        <span className="contact-detail-label">
          DEPARTMENT
        </span>

        <strong>
          Mathematics and Computing Science
        </strong>
      </div>

      <div className="contact-detail">
        <span className="contact-detail-label">
          UNIVERSITY
        </span>

        <strong>
          Divine Word University
        </strong>
      </div>

      <div className="contact-detail">
        <span className="contact-detail-label">
          EVENT
        </span>

        <strong>
          MCS Symposium 2026
        </strong>
      </div>

    </div>

  </div>
</section>
    
    </>
  );
}

export default Home;