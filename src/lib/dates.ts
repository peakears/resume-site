const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseYearMonth(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Expected a "YYYY-MM" date, got "${value}"`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Month out of range in "${value}"`);
  }
  return { year, month };
}

/** "2022-01" -> "Jan 2022" */
export function formatYearMonth(value: string): string {
  const { year, month } = parseYearMonth(value);
  return `${MONTHS[month - 1]} ${year}`;
}

/** ("2022-01", null) -> "Jan 2022 – Present" */
export function formatDateRange(start: string, end: string | null): string {
  return `${formatYearMonth(start)} – ${end ? formatYearMonth(end) : "Present"}`;
}

/** Whole years elapsed since `start` ("YYYY-MM"), as of `now`. */
export function yearsSince(start: string, now: Date = new Date()): number {
  const { year, month } = parseYearMonth(start);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}
