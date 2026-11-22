<script setup lang="ts">
import { BOOKING_DAYS_AHEAD, MIN_LEAD_MIN, openingHours } from '~/data/salon'
import { getStaff } from '~/data/staff'
import { isSlotTakenError } from '~/composables/useBookingApi'
import { ANY_STAFF as ANY } from '~/composables/useBookingSlots'

const { t, locale } = useI18n()
const fmt = useFormat()
const { items, count, totalPrice, totalDuration, remove, clear } = useCart()
const api = useBookingApi()

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
} = useBookingSlots(items, { minLeadMin: MIN_LEAD_MIN })

/* ---------- Specialist ---------- */
const staffOptions = computed(() => [
  { id: ANY, name: t('booking.anySpecialist'), sub: t('booking.anySpecialistHint') },
  ...eligibleStaff.value.map(s => ({ id: s.id, name: s.name, sub: t(`booking.roles.${s.role}`) })),
])

const initials = (name: string) =>
  name.replace(/^dr\.?\s+/i, '').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()

/* ---------- Days ---------- */
const today = new Date()
today.setHours(0, 0, 0, 0)

const days = Array.from({ length: BOOKING_DAYS_AHEAD }, (_, i) => {
  const date = new Date(today)
  date.setDate(today.getDate() + i)
  return { key: toDateKey(date), date, open: !!openingHours[date.getDay()] }
})

/* ---------- Form ---------- */
const form = reactive({ name: '', phone: '', email: '', notes: '', consent: false })
const attempted = ref(false)
const submitting = ref(false)
const submitError = ref<'taken' | 'generic' | null>(null)

const errors = computed(() => {
  const e: Partial<Record<'treatments' | 'slot' | 'name' | 'phone' | 'email' | 'consent', string>> = {}
  if (!count.value) e.treatments = t('booking.errors.treatments')
  else if (noSpecialist.value) e.treatments = t('booking.noSpecialist')
  if (selectedStart.value === null) e.slot = t('booking.errors.slot')
  if (!form.name.trim()) e.name = t('booking.errors.name')
  if (!/^\+?[\d\s()-]{7,20}$/.test(form.phone.trim())) e.phone = t('booking.errors.phone')
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('booking.errors.email')
  if (!form.consent) e.consent = t('booking.errors.consent')
  return e
})
const showError = (field: keyof typeof errors.value) => (attempted.value ? errors.value[field] : undefined)

/* ---------- Confirmation ---------- */
interface Confirmation {
  name: string
  date: string
  start: number
  staffName: string
  treatmentIds: string[]
  total: number
}
const confirmation = ref<Confirmation | null>(null)

async function submit() {
  attempted.value = true
  const staffMember = assignedStaffId.value ? getStaff(assignedStaffId.value) : undefined
  if (Object.keys(errors.value).length || !selectedDate.value || selectedStart.value === null || !staffMember) return

  submitting.value = true
  submitError.value = null
  const date = selectedDate.value
  const start = selectedStart.value

  try {
    await api.createAppointment({
      treatments: items.value.map(({ id, price, durationMin }) => ({ id, price, durationMin })),
      totalPrice: totalPrice.value,
      durationMin: totalDuration.value,
      date,
      startMinutes: start,
      startTime: formatTime(start),
      staffId: staffMember.id,
      staffName: staffMember.name,
      customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() },
      notes: form.notes.trim(),
      locale: locale.value,
    })

    confirmation.value = {
      name: form.name.trim(),
      date,
      start,
      staffName: staffMember.name,
      treatmentIds: items.value.map(i => i.id),
      total: totalPrice.value,
    }
    clear()
    Object.assign(form, { name: '', phone: '', email: '', notes: '', consent: false })
    attempted.value = false
    selectedDate.value = null
    selectedStaff.value = ANY
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  catch (error) {
    console.error('[booking] failed to create appointment', error)
    submitError.value = isSlotTakenError(error) ? 'taken' : 'generic'
    // Refresh availability; the `slots` watcher drops the selected time if it's gone
    await loadBusy(date)
  }
  finally {
    submitting.value = false
  }
}

const longDate = (key: string) => fmt.date(fromDateKey(key), { weekday: 'long', day: 'numeric', month: 'long' })

const inputClass = 'mt-1.5 block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-stone-900 ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-rose-400 focus:outline-none'
</script>

<template>
  <div>
    <!-- Success -->
    <div v-if="confirmation" class="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center ring-1 ring-stone-200 sm:p-12">
      <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 text-2xl text-rose-600">✓</div>
      <h2 class="mt-6 font-serif text-3xl font-medium text-stone-900">
        {{ t('booking.success.title', { name: confirmation.name }) }}
      </h2>
      <p class="mt-3 text-stone-600">{{ t('booking.success.text') }}</p>

      <div class="mt-8 rounded-2xl bg-stone-50 p-5 text-left">
        <div class="text-xs font-semibold uppercase tracking-wider text-stone-500">{{ t('booking.success.when') }}</div>
        <div class="mt-1 font-semibold text-stone-900">
          {{ longDate(confirmation.date) }}, {{ formatTime(confirmation.start) }}
        </div>
        <div class="mt-1 text-sm text-stone-600">{{ t('booking.summary.specialist') }}: {{ confirmation.staffName }}</div>
        <ul class="mt-3 space-y-1 text-sm text-stone-600">
          <li v-for="id in confirmation.treatmentIds" :key="id">• {{ t(`treatments.items.${id}.name`) }}</li>
        </ul>
        <div class="mt-3 border-t border-stone-200 pt-3 text-sm font-semibold text-stone-900">
          {{ t('booking.summary.total') }}: {{ fmt.price(confirmation.total) }}
        </div>
      </div>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <NuxtLinkLocale
          to="/treatments"
          class="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
          @click="confirmation = null"
        >
          {{ t('booking.success.bookAnother') }}
        </NuxtLinkLocale>
        <NuxtLinkLocale to="/" class="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-400">
          {{ t('booking.success.backHome') }}
        </NuxtLinkLocale>
      </div>
    </div>

    <!-- Booking form -->
    <!-- grid-cols-1 + min-w-0: stop the scrollable day strip from widening the column on small screens -->
    <form v-else class="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3" novalidate @submit.prevent="submit">
      <div class="min-w-0 space-y-4 sm:space-y-6 lg:col-span-2">
        <!-- 1. Treatments -->
        <section class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6">
          <h2 class="flex items-center gap-3 text-lg font-semibold text-stone-900">
            <span class="flex size-7 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-700">1</span>
            {{ t('booking.steps.treatments') }}
          </h2>

          <div v-if="!count" class="mt-5 rounded-xl bg-stone-50 p-6 text-center">
            <p class="text-stone-600">{{ t('booking.empty') }}</p>
            <NuxtLinkLocale to="/treatments" class="mt-4 inline-block rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">
              {{ t('booking.browse') }}
            </NuxtLinkLocale>
          </div>

          <template v-else>
            <ul class="mt-5 divide-y divide-stone-100">
              <li v-for="item in items" :key="item.id" class="flex items-center gap-3 py-3 sm:gap-4">
                <UnsplashImage
                  :photo="item.image"
                  alt=""
                  :aspect="1"
                  :widths="[96, 160]"
                  sizes="56px"
                  class="size-12 shrink-0 rounded-xl sm:size-14"
                />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-stone-900">{{ t(`treatments.items.${item.id}.name`) }}</div>
                  <div class="text-xs text-stone-500">{{ fmt.duration(item.durationMin) }}</div>
                </div>
                <div class="font-semibold text-stone-900">{{ fmt.price(item.price) }}</div>
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-rose-600"
                  :aria-label="t('booking.remove')"
                  :title="t('booking.remove')"
                  @click="remove(item.id)"
                >
                  <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            </ul>
            <NuxtLinkLocale to="/treatments" class="mt-3 inline-block text-sm font-semibold text-rose-600 hover:text-rose-700">
              {{ t('booking.addMore') }}
            </NuxtLinkLocale>
          </template>
          <p v-if="showError('treatments')" class="mt-3 text-sm text-red-600">{{ showError('treatments') }}</p>
        </section>

        <!-- 2. Specialist -->
        <section class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6">
          <h2 class="flex items-center gap-3 text-lg font-semibold text-stone-900">
            <span class="flex size-7 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-700">2</span>
            {{ t('booking.steps.specialist') }}
          </h2>

          <p v-if="!count" class="mt-5 text-sm text-stone-500">{{ t('booking.specialistAfterTreatments') }}</p>
          <p v-else-if="noSpecialist" class="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            {{ t('booking.noSpecialist') }}
          </p>
          <div v-else class="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" :aria-label="t('booking.steps.specialist')">
            <button
              v-for="option in staffOptions"
              :key="option.id"
              type="button"
              role="radio"
              :aria-checked="selectedStaff === option.id"
              class="flex items-center gap-3 rounded-xl p-3 text-left transition"
              :class="selectedStaff === option.id
                ? 'bg-rose-50 ring-2 ring-rose-400'
                : 'bg-stone-50 ring-1 ring-stone-200 hover:ring-stone-400'"
              @click="selectedStaff = option.id"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                :class="option.id === ANY ? 'bg-stone-900 text-white' : 'bg-rose-100 text-rose-700'"
                aria-hidden="true"
              >
                {{ option.id === ANY ? '★' : initials(option.name) }}
              </span>
              <span class="min-w-0">
                <span class="block truncate font-medium text-stone-900">{{ option.name }}</span>
                <span class="block truncate text-xs text-stone-500">{{ option.sub }}</span>
              </span>
            </button>
          </div>
        </section>

        <!-- 3. Date & time -->
        <section class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6">
          <h2 class="flex items-center gap-3 text-lg font-semibold text-stone-900">
            <span class="flex size-7 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-700">3</span>
            {{ t('booking.steps.datetime') }}
          </h2>

          <div class="-mx-4 mt-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            <div class="flex gap-2">
              <button
                v-for="day in days"
                :key="day.key"
                type="button"
                :disabled="!day.open"
                class="flex w-16 shrink-0 flex-col items-center rounded-xl py-2.5 text-center transition disabled:cursor-not-allowed disabled:opacity-40"
                :class="selectedDate === day.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 enabled:hover:ring-stone-400'"
                :aria-pressed="selectedDate === day.key"
                @click="selectedDate = day.key"
              >
                <span class="text-[11px] font-medium uppercase">{{ fmt.date(day.date, { weekday: 'short' }) }}</span>
                <span class="text-lg font-semibold leading-tight">{{ day.date.getDate() }}</span>
                <span class="text-[11px]">{{ day.open ? fmt.date(day.date, { month: 'short' }) : t('booking.closed') }}</span>
              </button>
            </div>
          </div>

          <div class="mt-5">
            <p v-if="!selectedDate" class="text-sm text-stone-500">{{ t('booking.pickDate') }}</p>
            <p v-else-if="slotsState === 'loading'" class="animate-pulse text-sm text-stone-500">{{ t('booking.checking') }}</p>
            <div v-else-if="slotsState === 'error'" class="flex flex-wrap items-center gap-3 text-sm">
              <span class="text-red-600">{{ t('booking.slotsError') }}</span>
              <button type="button" class="font-semibold text-rose-600 hover:text-rose-700" @click="loadBusy(selectedDate)">
                {{ t('booking.retry') }}
              </button>
            </div>
            <p v-else-if="!slots.length" class="text-sm text-stone-500">{{ t('booking.noSlots') }}</p>
            <div v-else>
              <p class="mb-3 text-sm font-medium text-stone-700 first-letter:uppercase">{{ longDate(selectedDate) }}</p>
              <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
                <button
                  v-for="start in slots"
                  :key="start"
                  type="button"
                  class="rounded-lg py-2 text-sm font-medium transition"
                  :class="selectedStart === start
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 hover:ring-rose-300'"
                  :aria-pressed="selectedStart === start"
                  @click="selectedStart = start"
                >
                  {{ formatTime(start) }}
                </button>
              </div>
            </div>
          </div>
          <p v-if="showError('slot')" class="mt-3 text-sm text-red-600">{{ showError('slot') }}</p>
        </section>

        <!-- 4. Details -->
        <section class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6">
          <h2 class="flex items-center gap-3 text-lg font-semibold text-stone-900">
            <span class="flex size-7 items-center justify-center rounded-full bg-rose-100 text-sm text-rose-700">4</span>
            {{ t('booking.steps.details') }}
          </h2>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="block sm:col-span-2">
              <span class="text-sm font-medium text-stone-700">{{ t('booking.fields.name') }}</span>
              <input v-model="form.name" type="text" autocomplete="name" maxlength="100" :class="inputClass" :aria-invalid="!!showError('name')">
              <span v-if="showError('name')" class="mt-1 block text-sm text-red-600">{{ showError('name') }}</span>
            </label>
            <label class="block">
              <span class="text-sm font-medium text-stone-700">{{ t('booking.fields.phone') }}</span>
              <input v-model="form.phone" type="tel" autocomplete="tel" maxlength="20" :class="inputClass" :aria-invalid="!!showError('phone')">
              <span v-if="showError('phone')" class="mt-1 block text-sm text-red-600">{{ showError('phone') }}</span>
            </label>
            <label class="block">
              <span class="text-sm font-medium text-stone-700">
                {{ t('booking.fields.email') }} <span class="font-normal text-stone-400">({{ t('booking.fields.optional') }})</span>
              </span>
              <input v-model="form.email" type="email" autocomplete="email" maxlength="200" :class="inputClass" :aria-invalid="!!showError('email')">
              <span v-if="showError('email')" class="mt-1 block text-sm text-red-600">{{ showError('email') }}</span>
            </label>
            <label class="block sm:col-span-2">
              <span class="text-sm font-medium text-stone-700">
                {{ t('booking.fields.notes') }} <span class="font-normal text-stone-400">({{ t('booking.fields.optional') }})</span>
              </span>
              <textarea v-model="form.notes" rows="3" maxlength="1000" :placeholder="t('booking.fields.notesPlaceholder')" :class="inputClass" />
            </label>
            <label class="flex items-start gap-3 sm:col-span-2">
              <input v-model="form.consent" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-rose-500">
              <span class="text-sm text-stone-600">{{ t('booking.fields.consent') }}</span>
            </label>
            <p v-if="showError('consent')" class="text-sm text-red-600 sm:col-span-2">{{ showError('consent') }}</p>
          </div>
        </section>
      </div>

      <!-- Summary -->
      <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6">
          <h2 class="text-lg font-semibold text-stone-900">{{ t('booking.summary.title') }}</h2>
          <dl class="mt-4 space-y-2.5 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-stone-500">{{ t('booking.summary.duration') }}</dt>
              <dd class="font-medium text-stone-800">{{ count ? fmt.duration(totalDuration) : '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-stone-500">{{ t('booking.summary.date') }}</dt>
              <dd class="text-right font-medium text-stone-800">
                {{ selectedDate ? fmt.date(fromDateKey(selectedDate), { weekday: 'short', day: 'numeric', month: 'short' }) : t('booking.summary.notSelected') }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-stone-500">{{ t('booking.summary.time') }}</dt>
              <dd class="font-medium text-stone-800">
                {{ selectedStart !== null ? `${formatTime(selectedStart)} – ${formatTime(selectedStart + totalDuration)}` : t('booking.summary.notSelected') }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-stone-500">{{ t('booking.summary.specialist') }}</dt>
              <dd class="text-right font-medium text-stone-800">
                {{ assignedStaffId ? getStaff(assignedStaffId)?.name : selectedStaff === ANY ? t('booking.anySpecialist') : getStaff(selectedStaff)?.name }}
              </dd>
            </div>
          </dl>
          <div class="mt-5 flex items-baseline justify-between border-t border-stone-100 pt-5">
            <span class="font-semibold text-stone-900">{{ t('booking.summary.total') }}</span>
            <span class="text-2xl font-semibold text-stone-900">{{ fmt.price(totalPrice) }}</span>
          </div>
          <p class="mt-1 text-xs text-stone-500">{{ t('booking.summary.payNote') }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="mt-6 w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
          >
            {{ submitting ? t('booking.submitting') : t('booking.submit') }}
          </button>
          <p v-if="submitError" class="mt-3 text-sm text-red-600">
            {{ submitError === 'taken' ? t('booking.slotTaken') : t('booking.submitError') }}
          </p>
        </div>
      </aside>
    </form>
  </div>
</template>
