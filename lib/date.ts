// lib/date.ts
export const fmtUTC = new Intl.DateTimeFormat(undefined, {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
export const dateUTC = (v: string | Date) => fmtUTC.format(new Date(v));
