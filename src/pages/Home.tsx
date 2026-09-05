function Home() {
  return (
    <>
      <section id="home" className="hero-section">
        <div className="hero-container">
          <p className="hero-eyebrow">DIVINE WORD UNIVERSITY</p>

          <h1>MCS Symposium 2026</h1>

          <p className="hero-description">
            Mathematics and Computing Science Department
          </p>

          <p className="hero-introduction">
            Exploring ideas, innovation, research, and emerging technologies
            in mathematics and computing science.
          </p>

          <div className="hero-actions">
            <a href="#symposium" className="button button-primary">
              Explore Symposium
            </a>

            <a href="#schedule" className="button button-secondary">
              View Schedule
            </a>
          </div>
        </div>
      </section>

      <section id="symposium" className="content-section">
        <div className="content-container">
          <p className="section-label">ABOUT THE EVENT</p>

          <h2>Mathematics and Computing Science Symposium</h2>

          <p>
            The MCS Symposium 2026 provides a platform for students,
            academics, researchers, industry professionals, and guests to
            share ideas and explore developments across mathematics and
            computing science.
          </p>
        </div>
      </section>

      <section id="presenters" className="content-section content-section-alt">
        <div className="content-container">
          <p className="section-label">FEATURED</p>

          <h2>Presenters</h2>

          <p>
            Meet the presenters and discover the topics being explored at
            this year's symposium.
          </p>
        </div>
      </section>

      <section id="schedule" className="content-section">
        <div className="content-container">
          <p className="section-label">PROGRAM</p>

          <h2>Symposium Schedule</h2>

          <p>
            The complete symposium program and session timetable will be
            published here.
          </p>
        </div>
      </section>

      <section id="contact" className="content-section content-section-alt">
        <div className="content-container">
          <p className="section-label">GET IN TOUCH</p>

          <h2>Contact</h2>

          <p>
            Contact the Mathematics and Computing Science Department for
            symposium information and enquiries.
          </p>
        </div>
      </section>
    </>
  );
}

export default Home;