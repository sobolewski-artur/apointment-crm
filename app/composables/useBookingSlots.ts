import { SLOT_STEP_MIN, openingHours } from '~/data/salon'
import { qualifiedStaff } from '~/data/staff'
import type { Treatment } from '~/data/treatments'
import type { BusySlot } from '~/utils/schedule'

export const ANY_STAFF = 'any'

/**
 * Specialist + date + time selection shared by the public booking flow and the admin phone booking.
 * Must be called in component setup.
 */
export const useBookingSlots = (
  items: Ref<Treatment[]>,
  options: {
    minLeadMin: number
    /** Rescheduling: the appointment's own current slot doesn't block it */
    excludeAppointmentId?: string
  },
) => {
  const api = useBookingApi()

  /* ---------- Specialist ---------- */
  const selectedStaff = ref<string>(ANY_STAFF)

  /** Specialists who can do the whole visit (every selected treatment) */
  const eligibleStaff = computed(() => qualifiedStaff([...new Set(items.value.map(i => i.category))]))
  const noSpecialist = computed(() => items.value.length > 0 && eligibleStaff.value.length === 0)

  // Treatments changed and the chosen person no longer does all of them -> back to "any"
  watch(eligibleStaff, (list) => {
    if (selectedStaff.value !== ANY_STAFF && !list.some(s => s.id === selectedStaff.value)) selectedStaff.value = ANY_STAFF
  })

  const candidateIds = computed(() =>
    selectedStaff.value === ANY_STAFF ? eligibleStaff.value.map(s => s.id) : [selectedStaff.value],
  )

  /* ---------- Availability ---------- */
  const selectedDate = ref<string | null>(null)
  const selectedStart = ref<number | null>(null)
  const busy = ref<BusySlot[]>([])
  const slotsState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

  async function loadBusy(date: string) {
    slotsState.value = 'loading'
    try {
      const result = await api.fetchBusySlots(date)
      if (selectedDate.value !== date) return // user switched day meanwhile
      busy.value = options.excludeAppointmentId
        ? result.filter(b => b.appointmentId !== options.excludeAppointmentId)
        : result
      slotsState.value = 'ready'
    }
    catch (error) {
      console.error('[booking] failed to load availability', error)
      if (selectedDate.value === date) slotsState.value = 'error'
    }
  }

  watch(selectedDate, (date) => {
    selectedStart.value = null
    busy.value = []
    if (date) loadBusy(date)
    else slotsState.value = 'idle'
  })

  const totalDuration = computed(() => items.value.reduce((sum, t) => sum + t.durationMin, 0))
  const duration = computed(() => Math.max(totalDuration.value, SLOT_STEP_MIN))

  /** Start times where at least one candidate specialist is free for the whole visit */
  const slots = computed(() => {
    if (!selectedDate.value || slotsState.value !== 'ready' || !candidateIds.value.length) return []
    const hours = openingHours[fromDateKey(selectedDate.value).getDay()]
    if (!hours) return []

    const now = new Date()
    const earliest = selectedDate.value === toDateKey(now)
      ? now.getHours() * 60 + now.getMinutes() + options.minLeadMin
      : 0

    const result: number[] = []
    for (let start = hours.open; start + duration.value <= hours.close; start += SLOT_STEP_MIN) {
      if (start < earliest) continue
      if (freeStaffAt(start, duration.value, candidateIds.value, busy.value).length) result.push(start)
    }
    return result
  })

  // Treatments, specialist or availability changed - drop a start time that is no longer free
  watch(slots, (list) => {
    if (selectedStart.value !== null && !list.includes(selectedStart.value)) selectedStart.value = null
  })

  /** Who will actually perform the visit at the selected time */
  const assignedStaffId = computed(() => {
    if (selectedStart.value === null) return null
    const free = freeStaffAt(selectedStart.value, duration.value, candidateIds.value, busy.value)
    return pickLeastBusy(free, busy.value) ?? null
  })

  return {
    selectedStaff,
    eligibleStaff,
    noSpecialist,
    selectedDate,
    selectedStart,
    slotsState,
    slots,
    assignedStaffId,
    loadBusy,
  }
}
