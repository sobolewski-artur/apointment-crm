import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDocsFromServer,
  getFirestore,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { BusySlot } from '~/utils/schedule'

export interface AppointmentInput {
  treatments: { id: string, price: number, durationMin: number }[]
  totalPrice: number
  durationMin: number
  /** "YYYY-MM-DD" */
  date: string
  startMinutes: number
  /** "HH:MM" - convenience for reading in the Firebase console */
  startTime: string
  staffId: string
  /** Convenience for reading in the Firebase console */
  staffName: string
  customer: { name: string, phone: string, email: string }
  notes: string
  locale: string
}

/** Firestore retries silently forever when the backend is unreachable - fail visibly instead */
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })

/** Id of the busy-slot doc. One specialist can't have two bookings starting at the same time:
 *  creating an existing doc counts as an update, which the rules deny, so the batch fails. */
const busySlotId = (staffId: string, date: string, start: number) => `${staffId}_${date}_${start}`

/** A rejected write most likely means the specialist was booked by someone else a moment ago */
export const isSlotTakenError = (error: unknown) =>
  error instanceof FirebaseError && error.code === 'permission-denied'

/**
 * Firestore layout:
 *  - appointments/{autoId}                   full booking incl. personal data (create-only for clients)
 *  - busySlots/{staffId}_{date}_{start}      staff + time range only (publicly readable, used for availability)
 * See firestore.rules.
 */
export const useBookingApi = () => {
  const db = getFirestore(useFirebaseApp())

  const fetchBusySlots = async (date: string): Promise<BusySlot[]> => {
    // From server only: a stale cache would show taken times as free
    const snap = await withTimeout(
      getDocsFromServer(query(collection(db, 'busySlots'), where('date', '==', date))),
      10_000,
      'fetchBusySlots',
    )
    return snap.docs.map((d) => {
      const { staffId, start, end } = d.data() as BusySlot
      return { staffId, start, end }
    })
  }

  const createAppointment = async (input: AppointmentInput) => {
    const appointmentRef = doc(collection(db, 'appointments'))
    const batch = writeBatch(db)

    batch.set(appointmentRef, { ...input, status: 'pending', createdAt: serverTimestamp() })
    batch.set(doc(db, 'busySlots', busySlotId(input.staffId, input.date, input.startMinutes)), {
      appointmentId: appointmentRef.id,
      staffId: input.staffId,
      date: input.date,
      start: input.startMinutes,
      end: input.startMinutes + input.durationMin,
    })

    await withTimeout(batch.commit(), 20_000, 'createAppointment')
    return appointmentRef.id
  }

  return { fetchBusySlots, createAppointment }
}
