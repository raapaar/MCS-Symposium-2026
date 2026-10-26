import type { CSSProperties, ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollExperience from "../components/ScrollExperience";
import "../styles/v2.css";
import "../styles/frontier.css";
import { useAppearance } from "../v2/appearanceState";
import { FrontierMotion } from "../v2/Frontier";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const appearance = useAppearance();
  return (
    <div id="home" className="site-wrapper v2-site frontier" data-motion={appearance.motion} data-layout={appearance.layout} style={{ "--frontier-accent": appearance.accent, "--frontier-surface": appearance.surface } as CSSProperties}>
      <FrontierMotion />
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