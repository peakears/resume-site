import { describe, expect, it } from "vitest";
import { formatDateRange, formatYearMonth, yearsSince } from "@/lib/dates";

describe("formatYearMonth", () => {
  it("formats a YYYY-MM string as 'Mon YYYY'", () => {
    expect(formatYearMonth("2022-01")).toBe("Jan 2022");
    expect(formatYearMonth("2025-12")).toBe("Dec 2025");
  });

  it.each(["2022", "2022-1", "Jan 2022", "2022-13", "2022-00"])(
    "rejects invalid input %j",
    (value) => {
      expect(() => formatYearMonth(value)).toThrow();
    },
  );
});

describe("formatDateRange", () => {
  it("shows 'Present' for a current role", () => {
    expect(formatDateRange("2024-01", null)).toBe("Jan 2024 – Present");
  });

  it("shows both ends for a past role", () => {
    expect(formatDateRange("2022-01", "2023-12")).toBe("Jan 2022 – Dec 2023");
  });
});

describe("yearsSince", () => {
  it("counts whole years only", () => {
    expect(yearsSince("2022-01", new Date(2026, 10, 4))).toBe(4); // Nov 2026
    expect(yearsSince("2022-01", new Date(2027, 0, 1))).toBe(5); // Jan 2027
  });

  it("never returns a negative number", () => {
    expect(yearsSince("2030-01", new Date(2026, 0, 1))).toBe(0);
  });
});
