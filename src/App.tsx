import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import { StorePage } from "./v2/Store";
import "./styles/control.css";
import { ProtectedArea } from "./v2/Session";
const ControlPortal = lazy(() => import("./v2/ControlPortal"));

const AdminLogin = lazy(
  () => import("./pages/AdminLogin"),
);

const ScheduleManager = lazy(
  () => import("./pages/ScheduleManager"),
);

const PresenterManager = lazy(
  () => import("./pages/PresenterManager"),
);

const AnnouncementManager = lazy(
  () => import("./pages/AnnouncementManager"),
);

const DocumentManager = lazy(
  () => import("./pages/DocumentManager"),
);

const GalleryManager = lazy(
  () => import("./pages/GalleryManager"),
);

const SponsorManager = lazy(
  () => import("./pages/SponsorManager"),
);

const EventManager = lazy(
  () => import("./pages/EventManager"),
);

const StaffManager = lazy(
  () => import("./pages/StaffManager"),
);

function App() {
  const currentPath =
    window.location.pathname;

  useEffect(() => {
    if (
      window.location.pathname.startsWith(
        "/admin",
      )
    ) {
      return;
    }

    const storageKey =
      `mcs-symposium-scroll-position:${window.location.pathname}`;

    const savedPosition =
      sessionStorage.getItem(storageKey);

    if (savedPosition !== null) {
      const position =
        Number(savedPosition);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: Number.isFinite(position)
              ? position
              : 0,
            behavior: "auto",
          });
        });
      });
    }

    const saveScrollPosition = () => {
      sessionStorage.setItem(
        storageKey,
        String(window.scrollY),
      );
    };

    window.addEventListener(
      "beforeunload",
      saveScrollPosition,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        saveScrollPosition,
      );
    };
  }, []);

  const renderAdminPage = () => {
    if (
      currentPath ===
      "/admin/presenters"
    ) {
      return <PresenterManager />;
    }

    if (
      currentPath ===
      "/admin/staff"
    ) {
      return <StaffManager />;
    }

    if (
      currentPath ===
      "/admin/announcements"
    ) {
      return <AnnouncementManager />;
    }

    if (
      currentPath ===
      "/admin/documents"
    ) {
      return <DocumentManager />;
    }

    if (
      currentPath ===
      "/admin/gallery"
    ) {
      return <GalleryManager />;
    }

    if (
      currentPath ===
      "/admin/sponsors"
    ) {
      return <SponsorManager />;
    }

    if (
      currentPath ===
      "/admin/event"
    ) {
      return <EventManager />;
    }

    if (
      currentPath ===
      "/admin/schedule"
    ) {
      return <ScheduleManager />;
    }

    if (
      currentPath ===
      "/admin/dashboard"
    ) {
      return <ControlPortal />;
    }

    if (
      currentPath === "/admin"
    ) {
      return <AdminLogin />;
    }

    return null;
  };

  if (currentPath === "/staff" || currentPath === "/superuser") {
    return <Suspense fallback={<p>Loading workspace…</p>}><ProtectedArea ownerOnly={currentPath === "/superuser"}><ControlPortal owner={currentPath === "/superuser"} /></ProtectedArea></Suspense>;
  }

  const isAdminRoute =
    currentPath.startsWith(
      "/admin",
    );

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div>Loading...</div>
        }
      >
        <div className="frontier-legacy-admin">{currentPath === "/admin" ? renderAdminPage() : <ProtectedArea section={currentPath === "/admin/dashboard" ? undefined : currentPath.split("/")[2]}>{renderAdminPage()}</ProtectedArea>}</div>
      </Suspense>
    );
  }

  return (
    <MainLayout>
      {currentPath.startsWith("/store") ? <StorePage /> : <Home />}
    </MainLayout>
  );
}

export default App;