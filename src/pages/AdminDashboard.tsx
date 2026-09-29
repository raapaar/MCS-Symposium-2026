import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebase";

interface ManagementCardProps {
  title: string;
  description: string;
  path?: string;
}

function ManagementCard({
  title,
  description,
  path,
}: ManagementCardProps) {
  const handleClick = () => {
    if (path) {
      window.location.href =
        path;
    }
  };

  return (
    <button
      type="button"
      className="admin-management-card"
      onClick={handleClick}
      disabled={!path}
    >
      <span>{title}</span>

      <small>
        {description}
      </small>
    </button>
  );
}

function AdminDashboard() {
  const [user, setUser] =
    useState<User | null>(
      null,
    );

  const [
    checkingAccess,
    setCheckingAccess,
  ] = useState(true);

  const [
    authorized,
    setAuthorized,
  ] = useState(false);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (
          currentUser,
        ) => {
          if (!currentUser) {
            window.location.href =
              "/admin";

            return;
          }

          try {
            const userSnapshot =
              await getDoc(
                doc(
                  db,
                  "users",
                  currentUser.uid,
                ),
              );

            const isAdmin =
              userSnapshot.exists() &&
              userSnapshot.data()
                .role ===
                "admin";

            if (!isAdmin) {
              await signOut(
                auth,
              );

              window.location.href =
                "/admin";

              return;
            }

            setUser(
              currentUser,
            );

            setAuthorized(
              true,
            );
          } catch {
            await signOut(
              auth,
            );

            window.location.href =
              "/admin";
          } finally {
            setCheckingAccess(
              false,
            );
          }
        },
      );

    return unsubscribe;
  }, []);

  const handleLogout =
    async () => {
      await signOut(auth);

      window.location.href =
        "/admin";
    };

  if (checkingAccess) {
    return (
      <main className="admin-loading">
        <p>
          Checking administrator
          access...
        </p>
      </main>
    );
  }

  if (
    !authorized ||
    !user
  ) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="section-eyebrow">
            MCS Symposium 2026
          </p>

          <h1>
            Admin Dashboard
          </h1>
        </div>

        <div className="admin-user-area">
          <span>
            {user.email}
          </span>

          <button
            type="button"
            className="admin-logout-button"
            onClick={
              handleLogout
            }
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-dashboard-main">
        <section className="admin-welcome">
          <p className="section-eyebrow">
            Administration
          </p>

          <h2>
            Symposium Management
          </h2>

          <p>
            Manage the MCS
            Symposium 2026 content
            from one place. Changes
            made here will control
            what appears on the
            public website.
          </p>
        </section>

        <section className="admin-management-grid">
          {/* Event Information */}
          <ManagementCard
            title="Event Information"
            description="Manage symposium details, About content, dates, venue, contact information, HOD welcome content, hero branding, and other event settings."
            path="/admin/event"
          />

          {/* Schedule */}
          <ManagementCard
            title="Schedule"
            description="Add, edit, reorder, and publish symposium programs."
            path="/admin/schedule"
          />

          {/* Presenters */}
          <ManagementCard
            title="Presenters & Keynote Speakers"
            description="Manage presenters, keynote speakers, projects, presentation details, biographies, images, screenshots, and professional links."
            path="/admin/presenters"
          />

          {/* Department Staff */}
          <ManagementCard
            title="Department Staff & Lecturers"
            description="Manage department staff profiles, positions, specializations, biographies, photos, and public profile information."
            path="/admin/staff"
          />

          {/* Announcements */}
          <ManagementCard
            title="Announcements"
            description="Create, edit, and publish symposium announcements."
            path="/admin/announcements"
          />

          {/* Documents */}
          <ManagementCard
            title="Documents"
            description="Manage symposium documents, notices, programs, and downloadable information."
            path="/admin/documents"
          />

          {/* Gallery */}
          <ManagementCard
            title="Gallery"
            description="Manage symposium images and gallery content."
            path="/admin/gallery"
          />

          {/* Sponsors */}
          <ManagementCard
            title="Sponsors & Partners"
            description="Manage sponsors, partner organizations, sponsor tiers, logos, and partner information."
            path="/admin/sponsors"
          />
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;