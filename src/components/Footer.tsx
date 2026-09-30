import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";

import SponsorLogos from "./SponsorLogos";

function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-brand-logos">
              <div className="footer-logo-box">
                <img
                  src={dwuLogo}
                  alt="Divine Word University"
                  className="footer-dwu-logo"
                />
              </div>

              <div className="footer-logo-box">
                <img
                  src={mcsLogo}
                  alt="Mathematics and Computing Science Department"
                  className="footer-mcs-logo"
                />
              </div>
            </div>

            <div className="footer-brand-copy">
              <p className="footer-eyebrow">
                DIVINE WORD UNIVERSITY
              </p>

              <h2>
                MCS Symposium 2026
              </h2>

              <p>
                Mathematics and Computing
                Science Department
              </p>
            </div>
          </div>

          <div className="footer-links">
            <p className="footer-link-heading">
              Symposium
            </p>

            <nav
              className="footer-navigation"
              aria-label="Footer navigation"
            >
              <a href="#symposium">
                About
              </a>

              <a href="#keynote-speakers">
                Keynotes
              </a>

              <a href="#presenters">
                Presenters
              </a>

              <a href="#staff">
                Staff
              </a>

              <a href="#schedule">
                Schedule
              </a>

              <a href="#sponsors">
                Sponsors
              </a>
            </nav>
          </div>
        </div>

        <SponsorLogos mode="footer" />

        <div className="footer-bottom">
          <p>
            © {currentYear} Mathematics
            and Computing Science
            Department. All rights
            reserved.
          </p>

          <p>
            Divine Word University
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;