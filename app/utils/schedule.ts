export interface BusySlot {
  staffId: string
  /** Minutes from midnight */
  start: number
  end: number
}

const overlaps = (a: { start: number, end: number }, b: { start: number, end: number }) =>
  a.start < b.end && b.start < a.end

/** Candidates (staff ids) who have no booking overlapping [start, start + duration) */
export const freeStaffAt = (start: number, duration: number, candidates: string[], busy: BusySlot[]) => {
  const slot = { start, end: start + duration }
  return candidates.filter(id => !busy.some(b => b.staffId === id && overlaps(b, slot)))
}

/** Spread the load: pick the free person with the fewest booked minutes that day */
export const pickLeastBusy = (free: string[], busy: BusySlot[]) => {
  const bookedMinutes = (id: string) =>
    busy.filter(b => b.staffId === id).reduce((sum, b) => sum + (b.end - b.start), 0)
  return [...free].sort((a, b) => bookedMinutes(a) - bookedMinutes(b))[0]
}
