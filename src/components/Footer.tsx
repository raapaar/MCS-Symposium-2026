import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";
import SponsorLogos from "./SponsorLogos";
import { useAppearance } from "../v2/appearanceState";
export default function Footer() {
  const appearance = useAppearance();
  return (
    <footer className="experience-footer">
      <div className="footer-invitation">
        <p className="frontier-kicker">STAY IN THE LOOP</p>
        <h2>
          Are you part of <em>what’s next?</em>
        </h2>
        <p>
          Discover the latest programme, announcements and symposium
          merchandise.
        </p>
        <a className="footer-white-button" href="/#announcements">
          Explore the latest updates ↗
        </a>
      </div>
      <div className="footer-columns">
        <div>
          <h3>Symposium</h3>
          <a href="/#symposium">About the event</a>
          <a href="/#keynote-speakers">Keynote & guest speakers</a>
          <a href="/#presenters">Student presenters</a>
          <a href="/#schedule">Programme</a>
          <a href="/#gallery">Gallery</a>
        </div>
        <div>
          <h3>Our Store</h3>
          <a href="/store">All merchandise</a>
          <a href="/store/cart">Your cart</a>
          <a href="/store/orders">Bookings & payment</a>
          <a href="/store/login">Your account</a>
        </div>
        <div>
          <h3>Information</h3>
          <a href="/store/policies">Store & reservation policy</a>
          <a href="/store/policies">Payment methods</a>
          <a href="/#documents">Documents & downloads</a>
          <a href="/#announcements">Announcements</a>
        </div>
        <div>
          <h3>Enquiries</h3>
          <p>
            Ask our symposium guide about the programme, speakers and store.
          </p>
          <a href="/#whatsapp-contact">Let’s chat ↗</a>
          <a href="/staff">Staff workspace</a>
          <div className="footer-brand-logos">
            <img
              src={appearance.dwuLogoUrl || dwuLogo}
              alt="Divine Word University"
            />
            <img
              src={appearance.mcsLogoUrl || mcsLogo}
              alt="Mathematics and Computing Science"
            />
          </div>
        </div>
      </div>
      <SponsorLogos mode="footer" />
      <div className="footer-copyright">
        © {new Date().getFullYear()} MCS Department · Divine Word University,
        Madang
      </div>
    </footer>
  );
}
