
import Announcements from "../components/Announcements";
import Documents from "../components/Documents";
import Gallery from "../components/Gallery";
import Sponsors from "../components/Sponsors";
import Schedule from "../components/Schedule";
import Presenters from "../components/Presenters";
import EventInfo from "../components/EventInfo";

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
      <EventInfo />

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


<Announcements />

<Documents />
<Gallery />
<Sponsors />


   {/* Presenters */}
<Presenters />

<Schedule />

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