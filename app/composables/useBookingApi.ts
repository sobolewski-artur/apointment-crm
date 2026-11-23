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
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { BusySlot } from '~/utils/schedule'
import { busySlotId, withTimeout } from '~/utils/firestore'

export type BookingSource = 'online' | 'phone'

/** Region of the createBooking Cloud Function (same as Firestore) */
const FUNCTIONS_REGION = 'europe-west4'

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

/**
 * The specialist was booked by someone else a moment ago:
 *  - Cloud Function (online booking): "already-exists"
 *  - direct write (admin): the busy-slot doc already exists, so the rules deny it
 */
export const isSlotTakenError = (error: unknown) =>
  error instanceof FirebaseError && (error.code === 'functions/already-exists' || error.code === 'permission-denied')

/** Turnstile check rejected by the server (expired/reused/invalid token) */
export const isVerificationError = (error: unknown) =>
  error instanceof FirebaseError && error.code === 'functions/permission-denied'

/**
 * Firestore layout:
 *  - appointments/{autoId}                   full booking incl. personal data
 *  - busySlots/{staffId}_{date}_{start}      staff + time range only (publicly readable, used for availability)
 * Online bookings are created by the createBooking Cloud Function (Turnstile-protected);
 * admins write directly. See firestore.rules and functions/src.
 */
export const useBookingApi = () => {
  const app = useFirebaseApp()
  const db = getFirestore(app)

  const fetchBusySlots = async (date: string): Promise<BusySlot[]> => {
    // From server only: a stale cache would show taken times as free
    const snap = await withTimeout(
      getDocsFromServer(query(collection(db, 'busySlots'), where('date', '==', date))),
      10_000,
      'fetchBusySlots',
    )
    return snap.docs.map((d) => {
      const { appointmentId, staffId, start, end } = d.data() as BusySlot
      return { appointmentId, staffId, start, end }
    })
  }

  /** Public booking: verified by Turnstile and saved by the createBooking Cloud Function */
  const submitOnlineBooking = async (booking: AppointmentInput, turnstileToken: string) => {
    const createBooking = httpsCallable<{ booking: AppointmentInput, token: string }, { id: string }>(
      getFunctions(app, FUNCTIONS_REGION),
      'createBooking',
      { timeout: 30_000 },
    )
    const { data } = await createBooking({ booking, token: turnstileToken })
    return data.id
  }

  /** Admin only (enforced in firestore.rules): booking taken by phone */
  const createPhoneBooking = async (input: AppointmentInput, status: 'pending' | 'confirmed' = 'confirmed') => {
    const appointmentRef = doc(collection(db, 'appointments'))
    const batch = writeBatch(db)

    batch.set(appointmentRef, { ...input, status, source: 'phone', createdAt: serverTimestamp() })
    batch.set(doc(db, 'busySlots', busySlotId(input.staffId, input.date, input.startMinutes)), {
      appointmentId: appointmentRef.id,
      staffId: input.staffId,
      date: input.date,
      start: input.startMinutes,
      end: input.startMinutes + input.durationMin,
    })

    await withTimeout(batch.commit(), 20_000, 'createPhoneBooking')
    return appointmentRef.id
  }

  return { fetchBusySlots, submitOnlineBooking, createPhoneBooking }
}
