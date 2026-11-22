<script setup lang="ts">
import { getStaff } from '~/data/staff'
import { getTreatment, type Treatment } from '~/data/treatments'
import { isSlotTakenError } from '~/composables/useBookingApi'
import { ANY_STAFF } from '~/composables/useBookingSlots'
import type { Appointment } from '~/composables/useAdminAppointments'

const props = defineProps<{
  appointment: Appointment
  reschedule: (a: Appointment, to: { date: string, startMinutes: number, staffId: string }) => Promise<void>
}>()
const emit = defineEmits<{ close: [], saved: [date: string, startMinutes: number] }>()

const { t } = useI18n()
const fmt = useFormat()
const a = props.appointment

// Keep the visit's booked durations (the catalog may have changed since it was booked)
const items = computed<Treatment[]>(() => a.treatments.flatMap((tr) => {
  const catalog = getTreatment(tr.id)
  return catalog ? [{ ...catalog, durationMin: tr.durationMin }] : []
}))

const {
  selectedStaff,
  eligibleStaff,
  noSpecialist,
  selectedDate,
  selectedStart,
  slotsState,
  slots,
  assignedStaffId,
  loadBusy,
} = useBookingSlots(items, { minLeadMin: 0, excludeAppointmentId: a.id })

// Start from the current booking
const today = toDateKey(new Date())
selectedStaff.value = eligibleStaff.value.some(s => s.id === a.staffId) ? a.staffId : ANY_STAFF
selectedDate.value = a.date >= today ? a.date : today

const currentStart = computed(() => (selectedDate.value === a.date ? a.startMinutes : null))
const unchanged = computed(() =>
  selectedDate.value === a.date && selectedStart.value === a.startMinutes && assignedStaffId.value === a.staffId,
)

const attempted = ref(false)
const saving = ref(false)
const saveError = ref<'taken' | 'generic' | null>(null)

async function save() {
  attempted.value = true
  if (!selectedDate.value || selectedStart.value === null || !assignedStaffId.value || unchanged.value) return

  saving.value = true
  saveError.value = null
  const to = { date: selectedDate.value, startMinutes: selectedStart.value, staffId: assignedStaffId.value }
  try {
    await props.reschedule(a, to)
    emit('saved', to.date, to.startMinutes)
  }
  catch (error) {
    console.error('[admin] reschedule failed', error)
    saveError.value = isSlotTakenError(error) ? 'taken' : 'generic'
    await loadBusy(to.date)
  }
  finally {
    saving.value = false
  }
}

const when = (date: string, start: number) =>
  `${fmt.date(fromDateKey(date), { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(start)}`

const inputClass = 'mt-1.5 block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-stone-900 ring-1 ring-stone-300 focus:ring-2 focus:ring-rose-400 focus:outline-none'
const sectionTitle = 'text-sm font-semibold uppercase tracking-wider text-stone-500'
</script>

<template>
  <AdminDrawer :title="t('admin.reschedule.title')" :subtitle="a.customer.name" :busy="saving" @close="emit('close')">
    <form id="reschedule-form" class="space-y-7" novalidate @submit.prevent="save">
      <!-- Current booking -->
      <section class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h3 :class="sectionTitle">{{ t('admin.reschedule.current') }}</h3>
        <p class="mt-2 font-semibold text-stone-900">{{ when(a.date, a.startMinutes) }} – {{ formatTime(a.startMinutes + a.durationMin) }}</p>
        <p class="text-sm text-stone-600">{{ getStaff(a.staffId)?.name ?? a.staffName }}</p>
        <p class="mt-1 text-sm text-stone-500">
          {{ a.treatments.map(tr => t(`treatments.items.${tr.id}.name`)).join(', ') }} · {{ fmt.duration(a.durationMin) }}
        </p>
      </section>

      <p v-if="noSpecialist" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
        {{ t('admin.newBooking.noSpecialist') }}
      </p>

      <template v-else>
        <!-- Specialist -->
        <section>
          <h3 :class="sectionTitle">{{ t('admin.newBooking.specialist') }}</h3>
          <select v-model="selectedStaff" :class="inputClass" :aria-label="t('admin.newBooking.specialist')">
            <option :value="ANY_STAFF">{{ t('booking.anySpecialist') }}</option>
            <option v-for="s in eligibleStaff" :key="s.id" :value="s.id">{{ s.name }} — {{ t(`booking.roles.${s.role}`) }}</option>
          </select>
        </section>

        <!-- New date & time -->
        <section>
          <h3 :class="[sectionTitle, 'mb-3']">{{ t('admin.reschedule.newTime') }}</h3>
          <AdminSlotPicker
            v-model:date="selectedDate"
            v-model:start="selectedStart"
            :slots="slots"
            :state="slotsState"
            :current-start="currentStart"
            :error="attempted && selectedStart === null ? t('booking.errors.slot') : undefined"
            @retry="selectedDate && loadBusy(selectedDate)"
          />
        </section>
      </template>
    </form>

    <template #footer>
      <p v-if="selectedDate && selectedStart !== null && assignedStaffId" class="text-sm">
        <span class="text-stone-500">{{ t('admin.reschedule.moveTo') }}:</span>
        <span class="font-medium text-stone-800"> {{ when(selectedDate, selectedStart) }} · {{ getStaff(assignedStaffId)?.name }}</span>
      </p>
      <p v-if="attempted && unchanged" class="mt-2 text-sm text-amber-700">{{ t('admin.reschedule.unchanged') }}</p>
      <p v-if="saveError" class="mt-2 text-sm text-red-600" role="alert">
        {{ saveError === 'taken' ? t('booking.slotTaken') : t('admin.reschedule.error') }}
      </p>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" :disabled="saving" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50" @click="emit('close')">
          {{ t('admin.newBooking.cancel') }}
        </button>
        <button
          type="submit"
          form="reschedule-form"
          :disabled="saving || noSpecialist"
          class="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ saving ? t('admin.newBooking.saving') : t('admin.reschedule.save') }}
        </button>
      </div>
    </template>
  </AdminDrawer>
</template>
