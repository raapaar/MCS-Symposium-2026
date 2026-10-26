import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollExperience from "../components/ScrollExperience";
import "../styles/v2.css";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div id="home" className="site-wrapper v2-site">
      <a className="v2-skip-link" href="#main-content">Skip to content</a>
      <ScrollExperience />
      <Header />

      <main id="main-content" className="site-main" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;