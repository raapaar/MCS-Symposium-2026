import { lazy, Suspense } from "react";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ScheduleManager = lazy(() => import("./pages/ScheduleManager"));
const PresenterManager = lazy(() => import("./pages/PresenterManager"));
const AnnouncementManager = lazy(
  () => import("./pages/AnnouncementManager"),
);
const DocumentManager = lazy(() => import("./pages/DocumentManager"));
const GalleryManager = lazy(() => import("./pages/GalleryManager"));
const SponsorManager = lazy(() => import("./pages/SponsorManager"));
const EventManager = lazy(() => import("./pages/EventManager"));

function App() {
  const currentPath = window.location.pathname;

  const renderAdminPage = () => {
    if (currentPath === "/admin/presenters") {
      return <PresenterManager />;
    }

    if (currentPath === "/admin/announcements") {
      return <AnnouncementManager />;
    }

    if (currentPath === "/admin/documents") {
      return <DocumentManager />;
    }

    if (currentPath === "/admin/gallery") {
      return <GalleryManager />;
    }

    if (currentPath === "/admin/sponsors") {
      return <SponsorManager />;
    }

    if (currentPath === "/admin/event") {
      return <EventManager />;
    }

    if (currentPath === "/admin/schedule") {
      return <ScheduleManager />;
    }

    if (currentPath === "/admin/dashboard") {
      return <AdminDashboard />;
    }

    if (currentPath === "/admin") {
      return <AdminLogin />;
    }

    return null;
  };

  const isAdminRoute = currentPath.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        {renderAdminPage()}
      </Suspense>
    );
  }

  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}

export default App;