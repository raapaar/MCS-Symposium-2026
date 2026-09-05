function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div>
          <h2>MCS Symposium 2026</h2>
          <p>
            Mathematics and Computing Science Department
            <br />
            Divine Word University
          </p>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear} Mathematics and Computing Science Department.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;