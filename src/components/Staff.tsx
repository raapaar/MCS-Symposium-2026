import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import type { StaffMember } from "../types/staff";

function Staff() {
  const [staff, setStaff] =
    useState<StaffMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      try {
        const staffQuery = query(
          collection(db, "staff"),
          where(
            "published",
            "==",
            true,
          ),
        );

        const snapshot =
          await getDocs(staffQuery);

        const records: StaffMember[] =
          snapshot.docs.map(
            (staffDocument) => {
              const data =
                staffDocument.data();

              return {
                id:
                  staffDocument.id,

                name:
                  data.name ?? "",

                title:
                  data.title ?? "",

                position:
                  data.position ?? "",

                specialization:
                  data.specialization ??
                  "",

                biography:
                  data.biography ?? "",

                imageUrl:
                  data.imageUrl ?? "",

                imagePath:
                  data.imagePath ?? "",

                profileUrl:
                  data.profileUrl ?? "",

                email:
                  data.email ?? "",

                order:
                  typeof data.order ===
                  "number"
                    ? data.order
                    : 0,

                published:
                  data.published ===
                  true,
              };
            },
          );

        records.sort(
          (a, b) =>
            a.order - b.order,
        );

        if (active) {
          setStaff(records);
        }
      } catch (error) {
        console.error(
          "Unable to load department staff:",
          error,
        );

        if (active) {
          setStaff([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStaff();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (staff.length === 0) {
    return null;
  }

  return (
    <section
      className="staff-section"
      id="staff"
    >
      <div className="section-container">
        <div className="staff-heading">
          <p className="section-eyebrow">
            Mathematics &amp;
            Computing Science
          </p>

          <h2>
            Department Staff &amp;
            Lecturers
          </h2>

          <p className="staff-introduction">
            Meet the academic staff
            supporting teaching,
            research, innovation, and
            student development within
            the Mathematics and
            Computing Science
            Department.
          </p>
        </div>

        <div className="staff-grid">
          {staff.map(
            (staffMember) => (
              <article
                className="staff-card"
                key={staffMember.id}
              >
                <div className="staff-image-area">
                  {staffMember.imageUrl ? (
                    <img
                      src={
                        staffMember.imageUrl
                      }
                      alt={
                        staffMember.name
                      }
                      className="staff-image"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="staff-image-placeholder"
                      aria-hidden="true"
                    >
                      <span>
                        MCS
                      </span>
                    </div>
                  )}
                </div>

                <div className="staff-card-content">
                  {staffMember.specialization && (
                    <span className="staff-specialization">
                      {
                        staffMember.specialization
                      }
                    </span>
                  )}

                  <h3>
                    {staffMember.title
                      ? `${staffMember.title} ${staffMember.name}`
                      : staffMember.name}
                  </h3>

                  <p className="staff-position">
                    {
                      staffMember.position
                    }
                  </p>

                  {staffMember.biography && (
                    <p className="staff-biography">
                      {
                        staffMember.biography
                      }
                    </p>
                  )}

                  {(staffMember.profileUrl ||
                    staffMember.email) && (
                    <div className="staff-links">
                      {staffMember.profileUrl && (
                        <a
                          href={
                            staffMember.profileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="staff-profile-link"
                        >
                          View Profile
                        </a>
                      )}

                      {staffMember.email && (
                        <a
                          href={`mailto:${staffMember.email}`}
                          className="staff-email-link"
                        >
                          Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export default Staff;