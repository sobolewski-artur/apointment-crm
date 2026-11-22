<script setup lang="ts">
import { APPOINTMENT_STATUSES, SlotUnavailableError, type Appointment, type AppointmentStatus } from '~/composables/useAdminAppointments'
import { isSlotTakenError } from '~/composables/useBookingApi'
import { getStaff, staff } from '~/data/staff'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { t } = useI18n()
const fmt = useFormat()

useHead({ title: () => t('admin.title') })

/* ---------- Day ---------- */
const today = toDateKey(new Date())
const date = ref(today)
// The native date input can be cleared - fall back to today instead of an invalid date
watch(date, (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) date.value = today
})
const shiftDay = (days: number) => {
  const d = fromDateKey(date.value)
  d.setDate(d.getDate() + days)
  date.value = toDateKey(d)
}
const dayLabel = computed(() => fmt.date(fromDateKey(date.value), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

/* ---------- Data ---------- */
const { day, dayState, pending, setStatus, reschedule } = useAdminAppointments(date)

const staffFilter = ref('all')
const statusFilter = ref<'all' | AppointmentStatus>('all')

const visible = computed(() => day.value.filter(a =>
  (staffFilter.value === 'all' || a.staffId === staffFilter.value)
  && (statusFilter.value === 'all' || a.status === statusFilter.value),
))

const stats = computed(() => {
  const active = visible.value.filter(a => a.status !== 'cancelled')
  return {
    count: active.length,
    revenue: active.filter(a => a.status !== 'no-show').reduce((sum, a) => sum + a.totalPrice, 0),
    pending: pending.value.length,
  }
})

/* ---------- Notices ---------- */
const notice = ref<string | null>(null)
let noticeTimer: ReturnType<typeof setTimeout> | undefined
function showNotice(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = null), 5000)
}
onBeforeUnmount(() => clearTimeout(noticeTimer))

/* ---------- Phone booking ---------- */
const showNewBooking = ref(false)

function onBookingSaved(savedDate: string) {
  showNewBooking.value = false
  date.value = savedDate // jump to the day the visit was booked on
  showNotice(t('admin.newBooking.saved'))
}

/* ---------- Reschedule ---------- */
const rescheduling = ref<Appointment | null>(null)

function onRescheduled(newDate: string, start: number) {
  rescheduling.value = null
  date.value = newDate
  const when = `${fmt.date(fromDateKey(newDate), { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(start)}`
  showNotice(t('admin.reschedule.saved', { when }))
}

/* ---------- Actions ---------- */
const savingId = ref<string | null>(null)
const actionError = ref<string | null>(null)

async function changeStatus(appointment: Appointment, status: AppointmentStatus) {
  savingId.value = appointment.id
  actionError.value = null
  try {
    await setStatus(appointment, status)
  }
  catch (error) {
    console.error('[admin] status change failed', error)
    // Restoring a cancelled visit whose time has been taken in the meantime
    const slotGone = error instanceof SlotUnavailableError || (appointment.status === 'cancelled' && isSlotTakenError(error))
    actionError.value = slotGone
      ? t('admin.actions.restoreConflict', { staff: getStaff(appointment.staffId)?.name ?? appointment.staffName })
      : t('admin.actions.error')
  }
  finally {
    savingId.value = null
  }
}

const selectClass = 'rounded-xl border-0 bg-white py-2 pl-3 pr-8 text-sm text-stone-800 ring-1 ring-stone-300 focus:ring-2 focus:ring-rose-400 focus:outline-none'
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
    <!-- Day view -->
    <section class="min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="mr-auto font-serif text-2xl font-medium text-stone-900 first-letter:uppercase sm:text-3xl">{{ dayLabel }}</h1>
        <div class="flex items-center gap-1">
          <button type="button" class="rounded-lg p-2 text-stone-600 ring-1 ring-stone-300 hover:bg-white" :aria-label="t('admin.day.prev')" @click="shiftDay(-1)">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m15 19-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-stone-300 hover:bg-white disabled:opacity-50"
            :disabled="date === today"
            @click="date = today"
          >
            {{ t('admin.day.today') }}
          </button>
          <button type="button" class="rounded-lg p-2 text-stone-600 ring-1 ring-stone-300 hover:bg-white" :aria-label="t('admin.day.next')" @click="shiftDay(1)">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7" /></svg>
          </button>
          <input v-model="date" type="date" required class="ml-1 rounded-lg border-0 bg-white px-2.5 py-2 text-sm ring-1 ring-stone-300" :aria-label="t('admin.day.pick')">
        </div>
        <button
          type="button"
          class="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 sm:w-auto"
          @click="showNewBooking = true"
        >
          + {{ t('admin.newBooking.open') }}
        </button>
      </div>

      <p v-if="notice" class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200" role="status">
        {{ notice }}
      </p>

      <!-- Stats -->
      <div class="mt-5 grid grid-cols-3 gap-3">
        <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div class="text-xs text-stone-500">{{ t('admin.stats.appointments') }}</div>
          <div class="mt-1 text-2xl font-semibold text-stone-900">{{ stats.count }}</div>
        </div>
        <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div class="text-xs text-stone-500">{{ t('admin.stats.revenue') }}</div>
          <div class="mt-1 truncate text-2xl font-semibold text-stone-900">{{ fmt.price(stats.revenue) }}</div>
        </div>
        <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div class="text-xs text-stone-500">{{ t('admin.stats.pending') }}</div>
          <div class="mt-1 text-2xl font-semibold" :class="stats.pending ? 'text-amber-600' : 'text-stone-900'">{{ stats.pending }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="mt-5 flex flex-wrap gap-2">
        <select v-model="staffFilter" :class="selectClass" :aria-label="t('admin.filters.staff')">
          <option value="all">{{ t('admin.filters.allStaff') }}</option>
          <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="statusFilter" :class="selectClass" :aria-label="t('admin.filters.status')">
          <option value="all">{{ t('admin.filters.allStatuses') }}</option>
          <option v-for="s in APPOINTMENT_STATUSES" :key="s" :value="s">{{ t(`admin.status.${s}`) }}</option>
        </select>
      </div>

      <p v-if="actionError" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200" role="alert">
        {{ actionError }}
      </p>

      <!-- List -->
      <div class="mt-5">
        <p v-if="dayState === 'loading'" class="animate-pulse text-sm text-stone-500">{{ t('admin.loading') }}</p>
        <p v-else-if="dayState === 'error'" class="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{{ t('admin.loadError') }}</p>
        <p v-else-if="!visible.length" class="rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200">{{ t('admin.empty') }}</p>
        <div v-else class="space-y-3">
          <AdminAppointmentCard
            v-for="a in visible"
            :key="a.id"
            :appointment="a"
            :saving="savingId === a.id"
            @status="status => changeStatus(a, status)"
            @reschedule="rescheduling = a"
          />
        </div>
      </div>
    </section>

    <!-- Pending -->
    <aside class="lg:sticky lg:top-24 lg:self-start">
      <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h2 class="flex items-center gap-2 font-semibold text-stone-900">
          {{ t('admin.pendingTitle') }}
          <span v-if="pending.length" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{{ pending.length }}</span>
        </h2>
        <p v-if="!pending.length" class="mt-3 text-sm text-stone-500">{{ t('admin.pendingEmpty') }}</p>
        <ul v-else class="mt-3 divide-y divide-stone-100">
          <li v-for="a in pending" :key="a.id" class="flex items-center gap-3 py-2.5">
            <button type="button" class="min-w-0 flex-1 text-left" :title="t('admin.showDay')" @click="date = a.date">
              <div class="text-xs font-medium text-stone-500">
                {{ fmt.date(fromDateKey(a.date), { weekday: 'short', day: 'numeric', month: 'short' }) }}, {{ formatTime(a.startMinutes) }}
              </div>
              <div class="truncate text-sm font-medium text-stone-900">{{ a.customer.name }}</div>
              <div class="truncate text-xs text-stone-500">{{ a.staffName }}</div>
            </button>
            <button
              type="button"
              :disabled="savingId === a.id"
              class="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              @click="changeStatus(a, 'confirmed')"
            >
              {{ t('admin.actions.confirmed') }}
            </button>
          </li>
        </ul>
      </div>
    </aside>

    <AdminNewBookingDialog
      v-if="showNewBooking"
      :initial-date="date"
      @close="showNewBooking = false"
      @saved="onBookingSaved"
    />

    <AdminRescheduleDialog
      v-if="rescheduling"
      :key="rescheduling.id"
      :appointment="rescheduling"
      :reschedule="reschedule"
      @close="rescheduling = null"
      @saved="onRescheduled"
    />
  </div>
</template>
