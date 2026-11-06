import type { ScheduleItem, ScheduleStatus } from "../types/schedule";
export interface ProgrammeControl {
  mode: "auto" | "manual";
  activeSegment: number;
}
export function programmeStatus(
  item: ScheduleItem,
  control: ProgrammeControl,
  now: number,
): ScheduleStatus {
  if (control.mode === "manual")
    return (item.segment || 1) < control.activeSegment
      ? "completed"
      : (item.segment || 1) === control.activeSegment
        ? "active"
        : "upcoming";
  if (item.startsAt && item.endsAt) {
    const start = Date.parse(item.startsAt),
      end = Date.parse(item.endsAt);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start)
      return now >= end ? "completed" : now >= start ? "active" : "upcoming";
  }
  return item.status || "upcoming";
}
