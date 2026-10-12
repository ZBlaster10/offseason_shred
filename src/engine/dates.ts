import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'

export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd')

/** Monday-based week key (yyyy-MM-dd of that Monday). */
export const weekKeyOf = (d: Date) => toISODate(startOfWeek(d, { weekStartsOn: 1 }))

export const parseDay = (iso: string) => parseISO(iso)

export const addWeeksKey = (weekKey: string, n: number) => toISODate(addDays(parseISO(weekKey), 7 * n))

export const weeksBetween = (fromKey: string, toKey: string) =>
  Math.round(differenceInCalendarDays(parseISO(toKey), parseISO(fromKey)) / 7)

export const daysBetween = (from: Date, to: Date) => differenceInCalendarDays(to, from)

/** Days left in the week including `today` (Mon → 7, Sun → 1). */
export const daysLeftInWeek = (today: Date) => {
  const dow = (today.getDay() + 6) % 7 // Mon=0 … Sun=6
  return 7 - dow
}
