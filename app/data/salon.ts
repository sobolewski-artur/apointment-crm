export interface DayHours {
  /** Minutes from midnight */
  open: number
  close: number
}

/** Opening hours indexed by Date#getDay() (0 = Sunday). `null` = closed. */
export const openingHours: Record<number, DayHours | null> = {
  0: null,
  1: { open: 9 * 60, close: 19 * 60 },
  2: { open: 9 * 60, close: 19 * 60 },
  3: { open: 9 * 60, close: 19 * 60 },
  4: { open: 9 * 60, close: 19 * 60 },
  5: { open: 9 * 60, close: 19 * 60 },
  6: { open: 9 * 60, close: 15 * 60 },
}

/** Granularity of offered start times */
export const SLOT_STEP_MIN = 30
/** How many days ahead (including today) clients can book */
export const BOOKING_DAYS_AHEAD = 30
/** Minimum notice for same-day bookings */
export const MIN_LEAD_MIN = 120
