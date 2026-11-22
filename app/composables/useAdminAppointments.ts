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

/** Restoring a cancelled visit failed: the specialist has another booking at that time now */
export class SlotUnavailableError extends Error {
  constructor() {
    super('Specialist is no longer free at this time')
    this.name = 'SlotUnavailableError'
  }
}

/** Only upcoming visits can be moved */
export const canReschedule = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed'

/** Quick-action buttons per status (the "Change status" select still allows any status) */
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
  const bookingApi = useBookingApi()
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

  /**
   * Any status can change to any other. Invariant: every non-cancelled appointment holds a busy slot.
   *  - to "cancelled": the busy slot is removed, so the time can be booked again
   *  - from "cancelled": the slot is taken again, if the specialist is still free at that time
   *    (throws SlotUnavailableError otherwise; an exact same-start clash is also rejected by the rules)
   */
  const setStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    if (status === appointment.status) return
    const slotRef = doc(db, 'busySlots', busySlotId(appointment.staffId, appointment.date, appointment.startMinutes))
    const batch = writeBatch(db)
    batch.update(doc(appointmentsRef, appointment.id), { status, updatedAt: serverTimestamp() })

    if (status === 'cancelled') {
      batch.delete(slotRef)
    }
    else if (appointment.status === 'cancelled') {
      const busy = (await bookingApi.fetchBusySlots(appointment.date)).filter(b => b.appointmentId !== appointment.id)
      const stillFree = freeStaffAt(appointment.startMinutes, appointment.durationMin, [appointment.staffId], busy).length > 0
      if (!stillFree) throw new SlotUnavailableError()
      batch.set(slotRef, {
        appointmentId: appointment.id,
        staffId: appointment.staffId,
        date: appointment.date,
        start: appointment.startMinutes,
        end: appointment.startMinutes + appointment.durationMin,
      })
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
