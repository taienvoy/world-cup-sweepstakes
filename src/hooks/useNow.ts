import { useEffect, useState } from "react";
import { DateTime } from "luxon";

/** A ticking clock. Re-renders on the given interval (default 1s). */
export function useNow(intervalMs = 1000): DateTime {
  const [now, setNow] = useState(() => DateTime.now());
  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
