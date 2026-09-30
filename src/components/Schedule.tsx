import { useEffect, useMemo, useState } from "react";
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

interface LoadedScheduleItem extends ScheduleItem {
  segment: ScheduleSegment;
  status: ScheduleStatus;
  order: number;
  isPresenter: boolean;
  presenterName: string;
}

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

  const [activeSegment, setActiveSegment] =
    useState<ScheduleSegment>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPublishedPrograms = async () => {
      setLoading(true);
      setError("");

      try {
        const scheduleQuery = query(
          collection(db, "schedule"),
          where("published", "==", true),
        );

        const snapshot =
          await getDocs(scheduleQuery);

        const loadedPrograms: LoadedScheduleItem[] =
          snapshot.docs
            .map((scheduleDoc) => {
              const data =
                scheduleDoc.data();

              const status: ScheduleStatus =
                data.status === "active" ||
                data.status === "completed"
                  ? data.status
                  : "upcoming";

              return {
                id: scheduleDoc.id,
                time: data.time ?? "",
                type: data.type ?? "",
                title: data.title ?? "",
                description:
                  data.description ?? "",
                location:
                  data.location ?? "",
                isPresenter:
                  data.isPresenter === true,
                presenterName:
                  data.presenterName ?? "",
                status,
                segment:
                  normalizeSegment(
                    data.segment,
                  ),
                order: Number(
                  data.order ?? 0,
                ),
                published:
                  data.published === true,
              };
            })
            .sort(
              (a, b) =>
                a.order - b.order,
            );

        setPrograms(loadedPrograms);
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
   * Only the selected segment is rendered.
   * This is what prevents the page from becoming
   * extremely long as more programs are added.
   */
  const segmentPrograms = useMemo(
    () =>
      programs.filter(
        (program) =>
          program.segment ===
          activeSegment,
      ),
    [activeSegment, programs],
  );

  /*
   * Group identical time values so SPBA and E50
   * sessions occurring simultaneously appear
   * together.
   */
  const groupedPrograms = useMemo(() => {
    const groups: Array<{
      time: string;
      programs: LoadedScheduleItem[];
    }> = [];

    segmentPrograms.forEach(
      (program) => {
        const existing =
          groups.find(
            (group) =>
              group.time ===
              program.time,
          );

        if (existing) {
          existing.programs.push(
            program,
          );
        } else {
          groups.push({
            time: program.time,
            programs: [program],
          });
        }
      },
    );

    return groups;
  }, [segmentPrograms]);

  /*
   * Determine the visual state of each segment.
   *
   * Active:
   * At least one program has been manually
   * marked Live.
   *
   * Completed:
   * Every program in that segment has been
   * manually marked Completed.
   */
  const getSegmentStatus = (
    segment: ScheduleSegment,
  ): ScheduleStatus => {
    const items =
      programs.filter(
        (program) =>
          program.segment === segment,
      );

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

  const goToPreviousSegment = () => {
    if (activeSegment > 1) {
      setActiveSegment(
        (activeSegment - 1) as ScheduleSegment,
      );
    }
  };

  const goToNextSegment = () => {
    if (activeSegment < 4) {
      setActiveSegment(
        (activeSegment + 1) as ScheduleSegment,
      );
    }
  };

  return (
    <section
      id="schedule"
      className="content-section schedule-section"
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
              Explore the symposium in four
              program segments. Concurrent
              presentations at SPBA and E50
              are displayed together.
            </p>
          </div>
        </div>

        {loading && (
          <div className="schedule-message">
            Loading symposium schedule...
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
              The symposium schedule will
              be published here once
              programs are confirmed.
            </div>
          )}

        {!loading &&
          !error &&
          programs.length > 0 && (
            <>
              <div
                className="schedule-segment-tabs"
                role="tablist"
                aria-label="Symposium program segments"
              >
                {(
                  [1, 2, 3, 4] as ScheduleSegment[]
                ).map((segment) => {
                  const status =
                    getSegmentStatus(
                      segment,
                    );

                  return (
                    <button
                      key={segment}
                      type="button"
                      role="tab"
                      aria-selected={
                        activeSegment ===
                        segment
                      }
                      className={`schedule-segment-tab ${
                        activeSegment ===
                        segment
                          ? "is-active"
                          : ""
                      } schedule-segment-status-${status}`}
                      onClick={() =>
                        setActiveSegment(
                          segment,
                        )
                      }
                    >
                      <span className="schedule-segment-number">
                        Segment{" "}
                        {segment}
                      </span>

                      {status ===
                        "active" && (
                        <span className="schedule-segment-live">
                          Live
                        </span>
                      )}

                      {status ===
                        "completed" && (
                        <span className="schedule-segment-done">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                className="schedule-segment-panel"
                role="tabpanel"
              >
                <div className="schedule-segment-header">
                  <div>
                    <p className="section-label">
                      PROGRAM SEGMENT{" "}
                      {activeSegment}
                    </p>

                    <h3>
                      {
                        segmentInformation[
                          activeSegment
                        ].title
                      }
                    </h3>

                    <p>
                      {
                        segmentInformation[
                          activeSegment
                        ].description
                      }
                    </p>
                  </div>

                  <div className="schedule-segment-count">
                    {
                      segmentPrograms.length
                    }{" "}
                    {segmentPrograms.length ===
                    1
                      ? "program"
                      : "programs"}
                  </div>
                </div>

                {segmentPrograms.length ===
                0 ? (
                  <div className="schedule-message">
                    No programs have been
                    published for this
                    segment yet.
                  </div>
                ) : (
                  <div className="schedule-segment-timeline">
                    {groupedPrograms.map(
                      (
                        group,
                        groupIndex,
                      ) => (
                        <div
                          className="schedule-segment-row"
                          key={`${group.time}-${groupIndex}`}
                        >
                          <div className="schedule-segment-time">
                            {group.time}
                          </div>

                          <div
                            className={`schedule-segment-events ${
                              group.programs
                                .length > 1
                                ? "has-concurrent-events"
                                : ""
                            }`}
                          >
                            {group.programs.map(
                              (
                                program,
                              ) => (
                                <article
                                  key={
                                    program.id
                                  }
                                  className={`schedule-segment-event schedule-status-${program.status}`}
                                >
                                  <div className="schedule-event-top">
                                    <div className="schedule-event-badges">
                                      {program.type && (
                                        <span className="schedule-type">
                                          {
                                            program.type
                                          }
                                        </span>
                                      )}

                                      {program.isPresenter && (
                                        <span className="schedule-presenter-badge">
                                          Presenter
                                        </span>
                                      )}
                                    </div>

                                    {program.location && (
                                      <span className="schedule-venue">
                                        {
                                          program.location
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {program.isPresenter &&
                                    program.presenterName && (
                                      <p className="schedule-presenter-name">
                                        {
                                          program.presenterName
                                        }
                                      </p>
                                    )}

                                  <h4>
                                    {
                                      program.title
                                    }
                                  </h4>

                                  {program.status ===
                                    "active" && (
                                    <div className="schedule-live-label">
                                      Happening
                                      Now
                                    </div>
                                  )}

                                  {program.status ===
                                    "completed" && (
                                    <div className="schedule-completed-label">
                                      Completed
                                    </div>
                                  )}

                                  {program.description && (
                                    <p className="schedule-event-description">
                                      {
                                        program.description
                                      }
                                    </p>
                                  )}
                                </article>
                              ),
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="schedule-segment-navigation">
                  <button
                    type="button"
                    className="schedule-segment-nav-button"
                    disabled={
                      activeSegment === 1
                    }
                    onClick={
                      goToPreviousSegment
                    }
                  >
                    ← Previous Segment
                  </button>

                  <span>
                    {activeSegment} of 4
                  </span>

                  <button
                    type="button"
                    className="schedule-segment-nav-button"
                    disabled={
                      activeSegment === 4
                    }
                    onClick={
                      goToNextSegment
                    }
                  >
                    Next Segment →
                  </button>
                </div>
              </div>
            </>
          )}
      </div>
    </section>
  );
}

export default Schedule;