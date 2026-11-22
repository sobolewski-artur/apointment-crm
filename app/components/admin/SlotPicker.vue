<script setup lang="ts">
import { openingHours } from '~/data/salon'

/** Date input + free start times, driven by useBookingSlots(). */
const props = defineProps<{
  slots: number[]
  state: 'idle' | 'loading' | 'ready' | 'error'
  /** Shown instead of times, e.g. "select treatments first" */
  blockedMessage?: string
  /** Validation message under the picker */
  error?: string
  /** Highlighted as the appointment's current time (rescheduling) */
  currentStart?: number | null
}>()
const date = defineModel<string | null>('date', { required: true })
const start = defineModel<number | null>('start', { required: true })
const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
const today = toDateKey(new Date())
const isClosed = computed(() => !!date.value && /^\d{4}-\d{2}-\d{2}$/.test(date.value) && !openingHours[fromDateKey(date.value).getDay()])

const inputClass = 'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-stone-900 ring-1 ring-stone-300 focus:ring-2 focus:ring-rose-400 focus:outline-none sm:max-w-56'
</script>

<template>
  <div>
    <input v-model="date" type="date" :min="today" required :class="inputClass" :aria-label="t('admin.day.pick')">

    <div class="mt-4">
      <p v-if="props.blockedMessage" class="text-sm text-stone-500">{{ props.blockedMessage }}</p>
      <p v-else-if="isClosed" class="text-sm text-stone-500">{{ t('admin.newBooking.closedDay') }}</p>
      <p v-else-if="state === 'loading'" class="animate-pulse text-sm text-stone-500">{{ t('booking.checking') }}</p>
      <div v-else-if="state === 'error'" class="flex flex-wrap items-center gap-3 text-sm">
        <span class="text-red-600">{{ t('booking.slotsError') }}</span>
        <button type="button" class="font-semibold text-rose-600 hover:text-rose-700" @click="emit('retry')">{{ t('booking.retry') }}</button>
      </div>
      <p v-else-if="!slots.length" class="text-sm text-stone-500">{{ t('booking.noSlots') }}</p>
      <div v-else class="grid grid-cols-4 gap-2 sm:grid-cols-6">
        <button
          v-for="s in slots"
          :key="s"
          type="button"
          class="relative rounded-lg py-2 text-sm font-medium transition"
          :class="start === s
            ? 'bg-rose-500 text-white'
            : s === currentStart
              ? 'bg-white text-stone-700 outline-2 -outline-offset-2 outline-dashed outline-stone-400'
              : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-rose-300'"
          :aria-pressed="start === s"
          :title="s === currentStart ? t('admin.reschedule.currentTime') : undefined"
          @click="start = s"
        >
          {{ formatTime(s) }}
        </button>
      </div>
    </div>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
