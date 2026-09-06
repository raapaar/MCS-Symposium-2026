import type { Announcement } from "../types/announcement";

export const announcements: Announcement[] = [
  {
    id: "announcement-1",
    title: "MCS Symposium 2026",
    summary:
      "Development announcement: official symposium information will be published here.",
    date: "2026-09-06",
    category: "Event Update",
    published: true,
  },
  {
    id: "announcement-2",
    title: "Presenter Information",
    summary:
      "Development announcement: confirmed presenter information will be added here.",
    date: "2026-09-06",
    category: "Presenters",
    published: true,
  },
  {
    id: "announcement-3",
    title: "Program and Schedule",
    summary:
      "Development announcement: the official symposium program will be published here.",
    date: "2026-09-06",
    category: "Program",
    published: true,
  },
];