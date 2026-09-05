import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="site-wrapper">
      <Header />

      <main className="site-main">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;