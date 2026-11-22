<script setup lang="ts">
import { getStaff } from '~/data/staff'
import { treatmentCategories, treatments } from '~/data/treatments'
import { isSlotTakenError } from '~/composables/useBookingApi'
import { ANY_STAFF } from '~/composables/useBookingSlots'

const props = defineProps<{ initialDate: string }>()
const emit = defineEmits<{ close: [], saved: [date: string] }>()

const { t, locale } = useI18n()
const fmt = useFormat()
const api = useBookingApi()

/* ---------- Treatments ---------- */
const selectedIds = ref<string[]>([])
const items = computed(() => treatments.filter(tr => selectedIds.value.includes(tr.id)))
const totalPrice = computed(() => items.value.reduce((sum, tr) => sum + tr.price, 0))
const totalDuration = computed(() => items.value.reduce((sum, tr) => sum + tr.durationMin, 0))
const groups = treatmentCategories.map(category => ({ category, items: treatments.filter(tr => tr.category === category) }))

/* ---------- Specialist, date & time (same rules as online booking, no lead time) ---------- */
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
} = useBookingSlots(items, { minLeadMin: 0 })

const today = toDateKey(new Date())
selectedDate.value = props.initialDate >= today ? props.initialDate : today

/* ---------- Client ---------- */
const form = reactive({ name: '', phone: '', email: '', notes: '' })
const attempted = ref(false)
const saving = ref(false)
const saveError = ref<'taken' | 'generic' | null>(null)

const errors = computed(() => {
  const e: Partial<Record<'name' | 'phone' | 'email' | 'treatments' | 'slot', string>> = {}
  if (!form.name.trim()) e.name = t('booking.errors.name')
  if (!/^\+?[\d\s()-]{7,20}$/.test(form.phone.trim())) e.phone = t('booking.errors.phone')
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('booking.errors.email')
  if (!items.value.length) e.treatments = t('booking.errors.treatments')
  else if (noSpecialist.value) e.treatments = t('admin.newBooking.noSpecialist')
  if (selectedStart.value === null) e.slot = t('booking.errors.slot')
  return e
})
const showError = (field: keyof typeof errors.value) => (attempted.value ? errors.value[field] : undefined)

async function save() {
  attempted.value = true
  const staffMember = assignedStaffId.value ? getStaff(assignedStaffId.value) : undefined
  if (Object.keys(errors.value).length || !selectedDate.value || selectedStart.value === null || !staffMember) return

  saving.value = true
  saveError.value = null
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
    }, { status: 'confirmed', source: 'phone' })
    emit('saved', date)
  }
  catch (error) {
    console.error('[admin] failed to create phone booking', error)
    saveError.value = isSlotTakenError(error) ? 'taken' : 'generic'
    await loadBusy(date)
  }
  finally {
    saving.value = false
  }
}

const inputClass = 'mt-1.5 block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-stone-900 ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-rose-400 focus:outline-none'
const sectionTitle = 'text-sm font-semibold uppercase tracking-wider text-stone-500'
</script>

<template>
  <AdminDrawer :title="t('admin.newBooking.title')" :subtitle="t('admin.newBooking.subtitle')" :busy="saving" @close="emit('close')">
    <form id="new-booking-form" class="space-y-7" novalidate @submit.prevent="save">
      <!-- Client -->
      <section>
        <h3 :class="sectionTitle">{{ t('admin.newBooking.client') }}</h3>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium text-stone-700">{{ t('booking.fields.name') }}</span>
            <input v-model="form.name" type="text" maxlength="100" autocomplete="off" :class="inputClass" :aria-invalid="!!showError('name')">
            <span v-if="showError('name')" class="mt-1 block text-sm text-red-600">{{ showError('name') }}</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-stone-700">{{ t('booking.fields.phone') }}</span>
            <input v-model="form.phone" type="tel" maxlength="20" autocomplete="off" :class="inputClass" :aria-invalid="!!showError('phone')">
            <span v-if="showError('phone')" class="mt-1 block text-sm text-red-600">{{ showError('phone') }}</span>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-stone-700">
              {{ t('booking.fields.email') }} <span class="font-normal text-stone-400">({{ t('booking.fields.optional') }})</span>
            </span>
            <input v-model="form.email" type="email" maxlength="200" autocomplete="off" :class="inputClass" :aria-invalid="!!showError('email')">
            <span v-if="showError('email')" class="mt-1 block text-sm text-red-600">{{ showError('email') }}</span>
          </label>
        </div>
      </section>

      <!-- Treatments -->
      <section>
        <h3 :class="sectionTitle">{{ t('admin.newBooking.treatments') }}</h3>
        <div class="mt-3 space-y-4">
          <fieldset v-for="group in groups" :key="group.category">
            <legend class="mb-2 text-sm font-medium text-stone-700">{{ t(`categories.${group.category}`) }}</legend>
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="tr in group.items"
                :key="tr.id"
                class="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 ring-1 transition"
                :class="selectedIds.includes(tr.id) ? 'ring-2 ring-rose-400' : 'ring-stone-200 hover:ring-stone-300'"
              >
                <input v-model="selectedIds" type="checkbox" :value="tr.id" class="size-4 shrink-0 accent-rose-500">
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-medium text-stone-900">{{ t(`treatments.items.${tr.id}.name`) }}</span>
                  <span class="block text-xs text-stone-500">{{ fmt.duration(tr.durationMin) }} · {{ fmt.price(tr.price) }}</span>
                </span>
              </label>
            </div>
          </fieldset>
        </div>
        <p v-if="noSpecialist" class="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {{ t('admin.newBooking.noSpecialist') }}
        </p>
        <p v-else-if="showError('treatments')" class="mt-3 text-sm text-red-600">{{ showError('treatments') }}</p>
      </section>

      <!-- Specialist -->
      <section v-if="items.length && !noSpecialist">
        <h3 :class="sectionTitle">{{ t('admin.newBooking.specialist') }}</h3>
        <select v-model="selectedStaff" :class="inputClass" :aria-label="t('admin.newBooking.specialist')">
          <option :value="ANY_STAFF">{{ t('booking.anySpecialist') }}</option>
          <option v-for="s in eligibleStaff" :key="s.id" :value="s.id">{{ s.name }} — {{ t(`booking.roles.${s.role}`) }}</option>
        </select>
      </section>

      <!-- Date & time -->
      <section v-if="!noSpecialist">
        <h3 :class="[sectionTitle, 'mb-3']">{{ t('admin.newBooking.dateTime') }}</h3>
        <AdminSlotPicker
          v-model:date="selectedDate"
          v-model:start="selectedStart"
          :slots="slots"
          :state="slotsState"
          :blocked-message="items.length ? undefined : t('admin.newBooking.pickTreatmentsFirst')"
          :error="items.length ? showError('slot') : undefined"
          @retry="selectedDate && loadBusy(selectedDate)"
        />
      </section>

      <!-- Notes -->
      <section>
        <label class="block">
          <span :class="sectionTitle">{{ t('booking.fields.notes') }}</span>
          <textarea v-model="form.notes" rows="3" maxlength="1000" :class="inputClass" />
        </label>
      </section>
    </form>

    <template #footer>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span class="text-stone-500">
          {{ items.length ? `${fmt.duration(totalDuration)} · ${fmt.price(totalPrice)}` : '—' }}
        </span>
        <span v-if="assignedStaffId && selectedStart !== null && selectedDate" class="font-medium text-stone-800">
          {{ fmt.date(fromDateKey(selectedDate), { weekday: 'short', day: 'numeric', month: 'short' }) }}, {{ formatTime(selectedStart) }} · {{ getStaff(assignedStaffId)?.name }}
        </span>
      </div>
      <p v-if="saveError" class="mt-2 text-sm text-red-600" role="alert">
        {{ saveError === 'taken' ? t('booking.slotTaken') : t('admin.newBooking.error') }}
      </p>
      <div class="mt-3 flex justify-end gap-2">
        <button type="button" :disabled="saving" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50" @click="emit('close')">
          {{ t('admin.newBooking.cancel') }}
        </button>
        <button
          type="submit"
          form="new-booking-form"
          :disabled="saving"
          class="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
        >
          {{ saving ? t('admin.newBooking.saving') : t('admin.newBooking.save') }}
        </button>
      </div>
    </template>
  </AdminDrawer>
</template>
