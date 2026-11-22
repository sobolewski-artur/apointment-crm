/** Firestore retries silently forever when the backend is unreachable - fail visibly instead */
export const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })

/** Id of the busySlots doc for a booking. One specialist can't have two bookings starting at the
 *  same time: creating an existing doc counts as an update, which the rules deny. */
export const busySlotId = (staffId: string, date: string, start: number) => `${staffId}_${date}_${start}`
