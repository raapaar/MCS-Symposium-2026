import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";

import type {
  ScheduleItem,
  ScheduleSegment,
  ScheduleStatus,
} from "../types/schedule";

interface LoadedScheduleItem
  extends ScheduleItem {
  segment: ScheduleSegment;
  status: ScheduleStatus;
  order: number;
  isPresenter: boolean;
  presenterName: string;
}

const segments: ScheduleSegment[] = [
  1, 2, 3, 4,
];

const segmentInformation: Record<
  ScheduleSegment,
  {
    title: string;
    description: string;
  }
> = {
  1: {
    title: "Segment 1",
    description:
      "Opening program, concurrent presentations, keynote and morning tea",
  },

  2: {
    title: "Segment 2",
    description:
      "Concurrent presentations and guest speaker session",
  },

  3: {
    title: "Segment 3",
    description:
      "Concurrent presentations, keynote and lunch",
  },

  4: {
    title: "Segment 4",
    description:
      "Guest speaker, panel discussion, closing program and networking",
  },
};

function normalizeSegment(
  value: unknown,
): ScheduleSegment {
  const segment = Number(value);

  if (
    segment === 2 ||
    segment === 3 ||
    segment === 4
  ) {
    return segment;
  }

  return 1;
}

function Schedule() {
  const [programs, setPrograms] = useState<
    LoadedScheduleItem[]
  >([]);

  /*
   * null means every segment is collapsed.
   */
  const [activeSegment, setActiveSegment] =
    useState<ScheduleSegment | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadPublishedPrograms =
      async () => {
        setLoading(true);
        setError("");

        try {
          const scheduleQuery = query(
            collection(db, "schedule"),
            where(
              "published",
              "==",
              true,
            ),
          );

          const snapshot =
            await getDocs(
              scheduleQuery,
            );

          const loadedPrograms: LoadedScheduleItem[] =
            snapshot.docs
              .map((scheduleDoc) => {
                const data =
                  scheduleDoc.data();

                const status: ScheduleStatus =
                  data.status ===
                    "active" ||
                  data.status ===
                    "completed"
                    ? data.status
                    : "upcoming";

                return {
                  id: scheduleDoc.id,

                  time:
                    data.time ?? "",

                  type:
                    data.type ?? "",

                  title:
                    data.title ?? "",

                  description:
                    data.description ?? "",

                  location:
                    data.location ?? "",

                  isPresenter:
                    data.isPresenter ===
                    true,

                  presenterName:
                    data.presenterName ??
                    "",

                  status,

                  segment:
                    normalizeSegment(
                      data.segment,
                    ),

                  order: Number(
                    data.order ?? 0,
                  ),

                  published:
                    data.published ===
                    true,
                };
              })
              .sort(
                (a, b) =>
                  a.order - b.order,
              );

          setPrograms(
            loadedPrograms,
          );
        } catch {
          setError(
            "The symposium schedule is currently unavailable.",
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPublishedPrograms();
  }, []);

  /*
   * Pre-group each segment by time.
   * Programs sharing the same time remain
   * together for concurrent SPBA/E50 sessions.
   */
  const groupedBySegment =
    useMemo(() => {
      const result: Record<
        ScheduleSegment,
        Array<{
          time: string;
          programs: LoadedScheduleItem[];
        }>
      > = {
        1: [],
        2: [],
        3: [],
        4: [],
      };

      segments.forEach(
        (segment) => {
          const segmentPrograms =
            programs.filter(
              (program) =>
                program.segment ===
                segment,
            );

          segmentPrograms.forEach(
            (program) => {
              const existing =
                result[
                  segment
                ].find(
                  (group) =>
                    group.time ===
                    program.time,
                );

              if (existing) {
                existing.programs.push(
                  program,
                );
              } else {
                result[
                  segment
                ].push({
                  time:
                    program.time,
                  programs: [
                    program,
                  ],
                });
              }
            },
          );
        },
      );

      return result;
    }, [programs]);

  const getSegmentPrograms = (
    segment: ScheduleSegment,
  ) =>
    programs.filter(
      (program) =>
        program.segment === segment,
    );

  const getSegmentStatus = (
    segment: ScheduleSegment,
  ): ScheduleStatus => {
    const items =
      getSegmentPrograms(segment);

    if (
      items.some(
        (program) =>
          program.status === "active",
      )
    ) {
      return "active";
    }

    if (
      items.length > 0 &&
      items.every(
        (program) =>
          program.status ===
          "completed",
      )
    ) {
      return "completed";
    }

    return "upcoming";
  };

  const toggleSegment = (
    segment: ScheduleSegment,
  ) => {
    setActiveSegment(
      (current) =>
        current === segment
          ? null
          : segment,
    );
  };

  return (
    <section
      id="schedule"
      className="content-section schedule-section schedule-compact-section"
    >
      <div className="content-container">
        <div className="section-heading-row">
          <div>
            <p className="section-label">
              PROGRAM
            </p>

            <h2>
              Symposium Schedule
            </h2>

            <p>
              Select a program segment
              to view its schedule.
              Concurrent SPBA and E50
              presentations are grouped
              by time.
            </p>
          </div>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading symposium
            schedule...
          </div>
        )}

        {error && (
          <div className="schedule-message schedule-message-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          programs.length === 0 && (
            <div className="schedule-message">
              The symposium schedule
              will be published here
              once programs are
              confirmed.
            </div>
          )}

        {!loading &&
          !error &&
          programs.length > 0 && (
            <div className="schedule-compact-accordion">
              {segments.map(
                (segment) => {
                  const isOpen =
                    activeSegment ===
                    segment;

                  const status =
                    getSegmentStatus(
                      segment,
                    );

                  const segmentPrograms =
                    getSegmentPrograms(
                      segment,
                    );

                  const groups =
                    groupedBySegment[
                      segment
                    ];

                  return (
                    <div
                      key={segment}
                      className={`schedule-compact-segment schedule-compact-segment-${status} ${
                        isOpen
                          ? "is-open"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="schedule-compact-trigger"
                        onClick={() =>
                          toggleSegment(
                            segment,
                          )
                        }
                        aria-expanded={
                          isOpen
                        }
                        aria-controls={`schedule-segment-${segment}`}
                      >
                        <div className="schedule-compact-trigger-main">
                          <span className="schedule-compact-chevron">
                            {isOpen
                              ? "−"
                              : "+"}
                          </span>

                          <div className="schedule-compact-trigger-text">
                            <strong>
                              Segment{" "}
                              {
                                segment
                              }
                            </strong>

                            <span>
                              {
                                segmentInformation[
                                  segment
                                ]
                                  .description
                              }
                            </span>
                          </div>
                        </div>

                        <div className="schedule-compact-trigger-side">
                          {status ===
                            "active" && (
                            <span className="schedule-compact-live-badge">
                              LIVE
                            </span>
                          )}

                          {status ===
                            "completed" && (
                            <span className="schedule-compact-completed-badge">
                              Completed
                            </span>
                          )}

                          <span className="schedule-compact-count">
                            {
                              segmentPrograms.length
                            }{" "}
                            {segmentPrograms.length ===
                            1
                              ? "item"
                              : "items"}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div
                          id={`schedule-segment-${segment}`}
                          className="schedule-compact-content"
                        >
                          {groups.length ===
                          0 ? (
                            <div className="schedule-compact-empty">
                              No
                              programs
                              published
                              for this
                              segment.
                            </div>
                          ) : (
                            <div className="schedule-compact-table-wrapper">
                              <table className="schedule-compact-table">
                                <thead>
                                  <tr>
                                    <th className="schedule-col-time">
                                      Time
                                    </th>

                                    <th className="schedule-col-venue">
                                      Venue
                                    </th>

                                    <th>
                                      Program
                                      / Presenter
                                    </th>

                                    <th className="schedule-col-status">
                                      Status
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {groups.flatMap(
                                    (
                                      group,
                                    ) =>
                                      group.programs.map(
                                        (
                                          program,
                                          programIndex,
                                        ) => (
                                          <tr
                                            key={
                                              program.id
                                            }
                                            className={`schedule-compact-row schedule-compact-row-${program.status}`}
                                          >
                                            <td className="schedule-compact-time">
                                              {programIndex ===
                                              0
                                                ? group.time
                                                : ""}
                                            </td>

                                            <td className="schedule-compact-venue">
                                              {program.location ||
                                                "—"}
                                            </td>

                                            <td className="schedule-compact-program">
                                              <div className="schedule-compact-program-title">
                                                {
                                                  program.title
                                                }
                                              </div>

                                              {program.isPresenter &&
                                                program.presenterName && (
                                                  <div className="schedule-compact-presenter">
                                                    {
                                                      program.presenterName
                                                    }
                                                  </div>
                                                )}

                                              {!program.isPresenter &&
                                                program.type && (
                                                  <div className="schedule-compact-type">
                                                    {
                                                      program.type
                                                    }
                                                  </div>
                                                )}
                                            </td>

                                            <td className="schedule-compact-status">
                                              {program.status ===
                                                "active" && (
                                                <span className="schedule-table-live">
                                                  Live
                                                </span>
                                              )}

                                              {program.status ===
                                                "completed" && (
                                                <span className="schedule-table-completed">
                                                  Done
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ),
                                      ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
      </div>
    </section>
  );
}

export default Schedule;