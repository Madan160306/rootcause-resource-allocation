/**
 * Timezone-aware date and time formatting utility for RootCause.
 * 
 * Rules:
 * 1. Backend and API timestamps stay in ISO-8601 UTC.
 * 2. Uses native Intl.DateTimeFormat (never manually adds 5h 30m).
 * 3. Detects the opening user's local browser timezone, defaulting to 'Asia/Kolkata'.
 * 4. Explicitly displays 'IST' when in Asia/Kolkata for the hackathon demo.
 */

export const getUserTimeZone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
};

export const getTimeZoneAbbr = (date = new Date(), timeZone = getUserTimeZone()) => {
  try {
    if (timeZone === "Asia/Kolkata" || timeZone === "Asia/Calcutta") {
      return "IST";
    }
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : "IST";
  } catch {
    return "IST";
  }
};

/**
 * Format full live clock timestamp for Header:
 * e.g. "Sun, 20 Sep 2026, 20:47:25 IST"
 */
export const formatLiveClock = (dateInput = new Date()) => {
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const timeZone = getUserTimeZone();
  const tzAbbr = getTimeZoneAbbr(date, timeZone);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${formatter.format(date)} ${tzAbbr}`;
};

/**
 * Format date & time for deadlines, audit logs, and availability:
 * e.g. "20 Sep 2026, 17:30 IST"
 */
export const formatDateShort = (dateInput) => {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const timeZone = getUserTimeZone();
  const tzAbbr = getTimeZoneAbbr(date, timeZone);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatter.format(date)} ${tzAbbr}`;
};

/**
 * Format date only:
 * e.g. "20 Sep 2026 IST"
 */
export const formatDateOnly = (dateInput) => {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const timeZone = getUserTimeZone();
  const tzAbbr = getTimeZoneAbbr(date, timeZone);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(date)} ${tzAbbr}`;
};
