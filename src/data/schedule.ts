import type { ScheduleItem } from "../types/schedule";

export const scheduleItems: ScheduleItem[] = [
  {
    id: "schedule-1",
    time: "09:00",
    type: "OPENING",
    title: "Welcome and Opening",
    description:
      "Opening remarks and introduction to MCS Symposium 2026.",
    location: "Main Venue",
    published: true,
  },
  {
    id: "schedule-2",
    time: "10:00",
    type: "KEYNOTE",
    title: "Keynote Presentation",
    description:
      "Featured presentation exploring current developments in mathematics and computing science.",
    location: "Main Venue",
    published: true,
  },
  {
    id: "schedule-3",
    time: "11:30",
    type: "PRESENTATION",
    title: "Research and Innovation Session",
    description:
      "Presentations highlighting research, projects, and innovative ideas.",
    location: "Main Venue",
    published: true,
  },
  {
    id: "schedule-4",
    time: "01:30",
    type: "PANEL",
    title: "Discussion and Collaboration",
    description:
      "An opportunity for presenters and participants to exchange ideas and perspectives.",
    location: "Main Venue",
    published: true,
  },
];