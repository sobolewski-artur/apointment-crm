import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import type { AppointmentInput, BookingSource } from './useBookingApi'
import { getStaff } from '~/data/staff'

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'] as const
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number]

export interface Appointment extends AppointmentInput {
  id: string
  status: AppointmentStatus
  /** Missing on bookings made before phone bookings existed (= online) */
  source?: BookingSource
  createdAt: Date | null
}

/** Only upcoming visits can be moved */
export const canReschedule = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed'

/** Status changes an admin can make from each status */
export const NEXT_STATUSES: Record<AppointmentStatus, AppointmentStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['completed', 'no-show', 'cancelled'],
  'completed': [],
  'cancelled': [],
  'no-show': [],
}

const toAppointment = (d: DocumentSnapshot): Appointment => {
  const data = d.data() as Omit<Appointment, 'id' | 'createdAt'> & { createdAt?: Timestamp }
  return { ...data, id: d.id, createdAt: data.createdAt?.toDate() ?? null }
}

const byDateAndTime = (a: Appointment, b: Appointment) =>
  a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes

type LoadState = 'loading' | 'ready' | 'error'

/** Live appointments for one day + all upcoming pending ones. Must be called in component setup. */
export const useAdminAppointments = (date: Ref<string>) => {
  const db = getFirestore(useFirebaseApp())
  const appointmentsRef = collection(db, 'appointments')

  const day = ref<Appointment[]>([])
  const dayState = ref<LoadState>('loading')
  const pending = ref<Appointment[]>([])

  // onSnapshot never errors when the backend is unreachable - surface it after a while
  const watchdog = (state: Ref<LoadState>) => setTimeout(() => {
    if (state.value === 'loading') state.value = 'error'
  }, 15_000)

  let stopDay: (() => void) | undefined
  let dayTimer: ReturnType<typeof setTimeout> | undefined

  watch(date, (d) => {
    stopDay?.()
    clearTimeout(dayTimer)
    day.value = []
    dayState.value = 'loading'
    dayTimer = watchdog(dayState)
    stopDay = onSnapshot(
      query(appointmentsRef, where('date', '==', d)),
      (snap) => {
        day.value = snap.docs.map(toAppointment).sort(byDateAndTime)
        dayState.value = 'ready'
      },
      (error) => {
        console.error('[admin] failed to load appointments', error)
        dayState.value = 'error'
      },
    )
  }, { immediate: true })

  const stopPending = onSnapshot(
    query(appointmentsRef, where('status', '==', 'pending')),
    (snap) => {
      const today = toDateKey(new Date())
      pending.value = snap.docs.map(toAppointment).filter(a => a.date >= today).sort(byDateAndTime)
    },
    error => console.error('[admin] failed to load pending appointments', error),
  )

  onScopeDispose(() => {
    stopDay?.()
    stopPending()
    clearTimeout(dayTimer)
  })

  /** Cancelling also removes the busy slot, so the time can be booked again */
  const setStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    const batch = writeBatch(db)
    batch.update(doc(appointmentsRef, appointment.id), { status, updatedAt: serverTimestamp() })
    if (status === 'cancelled') {
      batch.delete(doc(db, 'busySlots', busySlotId(appointment.staffId, appointment.date, appointment.startMinutes)))
    }
    await withTimeout(batch.commit(), 20_000, 'setStatus')
  }

  /**
   * Move a visit to another date/time and/or specialist. In one batch: update the appointment,
   * free the old busy slot and take the new one. If the new slot doc already exists (someone just
   * booked that specialist at that time) the rules reject the batch -> isSlotTakenError().
   */
  const reschedule = async (appointment: Appointment, to: { date: string, startMinutes: number, staffId: string }) => {
    const staffMember = getStaff(to.staffId)
    if (!staffMember) throw new Error(`Unknown staff member ${to.staffId}`)

    const oldSlotId = busySlotId(appointment.staffId, appointment.date, appointment.startMinutes)
    const newSlotId = busySlotId(to.staffId, to.date, to.startMinutes)
    if (oldSlotId === newSlotId) return // nothing changes

    const batch = writeBatch(db)
    batch.update(doc(appointmentsRef, appointment.id), {
      date: to.date,
      startMinutes: to.startMinutes,
      startTime: formatTime(to.startMinutes),
      staffId: staffMember.id,
      staffName: staffMember.name,
      updatedAt: serverTimestamp(),
    })
    batch.delete(doc(db, 'busySlots', oldSlotId))
    batch.set(doc(db, 'busySlots', newSlotId), {
      appointmentId: appointment.id,
      staffId: staffMember.id,
      date: to.date,
      start: to.startMinutes,
      end: to.startMinutes + appointment.durationMin,
    })
    await withTimeout(batch.commit(), 20_000, 'reschedule')
  }

  return { day, dayState, pending, setStatus, reschedule }
}
