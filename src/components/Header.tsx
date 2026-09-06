import { useState } from "react";
import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-container">

        <a
          href="#home"
          className="site-brand"
          aria-label="MCS Symposium 2026 home"
          onClick={closeMenu}
        >
          <img
            src={dwuLogo}
            alt="Divine Word University"
            className="dwu-logo"
          />

          <img
            src={mcsLogo}
            alt="Mathematics and Computing Science"
            className="website-logo"
          />
        </a>

        <button
          type="button"
          className={`mobile-menu-button ${
            menuOpen ? "is-open" : ""
          }`}
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      <nav
  className={`site-navigation ${
    menuOpen ? "is-open" : ""
  }`}
  aria-label="Main navigation"
>
  <a href="#home" onClick={closeMenu}>Home</a>
  <a href="#symposium" onClick={closeMenu}>Symposium</a>
  <a href="#announcements" onClick={closeMenu}>Announcements</a>
  <a href="#documents" onClick={closeMenu}>Documents</a>
  <a href="#gallery" onClick={closeMenu}>Gallery</a>
  <a href="#sponsors" onClick={closeMenu}>Sponsors</a>
  <a href="#presenters" onClick={closeMenu}>Presenters</a>
  <a href="#schedule" onClick={closeMenu}>Schedule</a>
  <a href="#contact" onClick={closeMenu}>Contact</a>
</nav>

      </div>
    </header>
  );
}

export default Header;