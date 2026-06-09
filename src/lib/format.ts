import { DateTime, Duration } from "luxon";

export const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const localTzAbbrev = (dt: DateTime) =>
  dt.setZone(localZone).toFormat("ZZZZ");

/** "Thu 11 Jun · 7:00 PM" in the viewer's local timezone. */
export const localStamp = (dt: DateTime) =>
  dt.setZone(localZone).toFormat("ccc d LLL · h:mm a");

export const localDay = (dt: DateTime) => dt.setZone(localZone).toFormat("ccc d LLL");
export const localTime = (dt: DateTime) => dt.setZone(localZone).toFormat("h:mm a");

/** Venue local time, e.g. "1:00 PM local". */
export const venueTime = (dt: DateTime, offset: string) =>
  dt.setZone(offset).toFormat("h:mm a") + " local";

export function countdown(target: DateTime, now: DateTime): string {
  const diff = target.diff(now);
  if (diff.toMillis() <= 0) return "LIVE";
  const d = diff.shiftTo("days", "hours", "minutes", "seconds") as Duration;
  const days = Math.floor(d.days);
  const h = Math.floor(d.hours);
  const m = Math.floor(d.minutes);
  const s = Math.floor(d.seconds);
  if (days > 0) return `${days}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
