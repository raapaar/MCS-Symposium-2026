import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleManager from "./pages/ScheduleManager";
import PresenterManager from "./pages/PresenterManager";
import AnnouncementManager from "./pages/AnnouncementManager";
import DocumentManager from "./pages/DocumentManager";
import GalleryManager from "./pages/GalleryManager";
import SponsorManager from "./pages/SponsorManager";
import EventManager from "./pages/EventManager";

function App() {
  const currentPath = window.location.pathname;

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

  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}

export default App;