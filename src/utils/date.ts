/** Returns the UTC midnight Date for the day containing `d`. */
export function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Returns the UTC midnight of the day after `d`. */
export function endOfUTCDay(d: Date): Date {
  const start = startOfUTCDay(d);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** Parses a 'YYYY-MM-DD' string into a UTC midnight Date. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
