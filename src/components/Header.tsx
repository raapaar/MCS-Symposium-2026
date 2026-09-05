function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <a href="/" className="site-brand">
          <span className="site-brand-title">MCS Symposium 2026</span>
          <span className="site-brand-subtitle">
            Mathematics and Computing Science Department
          </span>
        </a>

        <nav className="site-navigation" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#symposium">Symposium</a>
          <a href="#presenters">Presenters</a>
          <a href="#schedule">Schedule</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;