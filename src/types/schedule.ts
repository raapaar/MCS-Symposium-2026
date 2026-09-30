export type ScheduleStatus =
  | "upcoming"
  | "active"
  | "completed";

export type ScheduleSegment = 1 | 2 | 3 | 4;

export interface ScheduleItem {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  location: string;

  isPresenter?: boolean;
  presenterName?: string;
  status?: ScheduleStatus;
  order?: number;

  // Phase 7.1 four-part symposium program
  segment?: ScheduleSegment;

  published: boolean;
}