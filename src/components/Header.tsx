import { useAppearance } from "../v2/appearanceState";
import { useRef, useState } from "react";
import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";
const links = [
  ["#symposium", "The symposium"],
  ["#keynote-speakers", "Keynotes"],
  ["#presenters", "The minds"],
  ["#schedule", "Programme"],
  ["#announcements", "Updates"],
  ["#store", "The store"],
  ["#gallery", "Gallery"],
  ["#whatsapp-contact", "Get in touch"],
];
export default function Header() {
  const appearance = useAppearance();
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <header className="site-header frontier-header">
      <div className="frontier-nav-shell">
        <a
          href="/#home"
          className="frontier-brand"
          aria-label="MCS Symposium home"
        >
          <img
            src={appearance.dwuLogoUrl || dwuLogo}
            alt="Divine Word University"
          />
          <img src={appearance.mcsLogoUrl || mcsLogo} alt="MCS Department" />
          <span>
            MCS<span>SYMPOSIUM / 2026</span>
          </span>
        </a>
        <nav className="frontier-desktop-nav" aria-label="Desktop navigation">
          <a href="/#symposium">Discover</a>
          <a href="/#presenters">The minds</a>
          <a href="/#schedule">Programme</a>
          <a href="/#store">Store ↗</a>
        </nav>
        <button
          type="button"
          ref={toggle}
          className="frontier-menu-toggle"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="public-navigation"
          onClick={() => {
            dialog.current?.showModal();
            setOpen(true);
          }}
        >
          MENU <span aria-hidden="true">☰</span>
        </button>
        <dialog
          ref={dialog}
          className="frontier-menu"
          onCancel={() => {
            setOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="frontier-menu-top">
            <a href="/#home" onClick={close}>
              MCS / 2026
            </a>
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation menu"
            >
              CLOSE ×
            </button>
          </div>
          <nav id="public-navigation" aria-label="Main navigation">
            {links.map(([href, label], i) => (
              <a
                key={href}
                href={href.startsWith("#") ? `/${href}` : href}
                onClick={close}
              >
                <small>{String(i + 1).padStart(2, "0")}</small>
                {label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
          <div className="frontier-menu-bottom">
            <span>DIVINE WORD UNIVERSITY · MADANG, PNG</span>
            <a href="/admin">Staff access ↗</a>
          </div>
        </dialog>
      </div>
    </header>
  );
}
