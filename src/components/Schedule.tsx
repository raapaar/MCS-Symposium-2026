import { scheduleItems } from "../data/schedule";

function Schedule() {
  const publishedItems = scheduleItems.filter(
    (item) => item.published,
  );

  return (
    <section
      id="schedule"
      className="content-section schedule-section"
    >
      <div className="content-container">
        <div className="section-heading-row">
          <div>
            <p className="section-label">PROGRAM</p>

            <h2>Symposium Schedule</h2>

            <p>
              Explore the program, session times, presentation topics,
              and activities planned for MCS Symposium 2026.
            </p>
          </div>

          <a
            href="#schedule"
            className="button button-primary"
          >
            Full Program
          </a>
        </div>

        <div className="schedule-list">
          {publishedItems.map((item) => (
            <article className="schedule-item" key={item.id}>
              <div className="schedule-time">
                <strong>{item.time}</strong>
              </div>

              <div className="schedule-details">
                <span className="schedule-type">
                  {item.type}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>

              <div className="schedule-location">
                {item.location}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Schedule;