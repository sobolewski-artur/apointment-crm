<script setup lang="ts">
import { NEXT_STATUSES, canReschedule, type Appointment, type AppointmentStatus } from '~/composables/useAdminAppointments'
import { getStaff } from '~/data/staff'

const props = defineProps<{ appointment: Appointment, saving: boolean }>()
const emit = defineEmits<{ status: [status: AppointmentStatus], reschedule: [] }>()

const { t } = useI18n()
const fmt = useFormat()
const open = ref(false)

const a = computed(() => props.appointment)
const end = computed(() => a.value.startMinutes + a.value.durationMin)
const staffName = computed(() => getStaff(a.value.staffId)?.name ?? a.value.staffName)
const actions = computed(() => NEXT_STATUSES[a.value.status] ?? [])

const statusClass: Record<AppointmentStatus, string> = {
  'pending': 'bg-amber-100 text-amber-800',
  'confirmed': 'bg-emerald-100 text-emerald-800',
  'completed': 'bg-sky-100 text-sky-800',
  'cancelled': 'bg-stone-200 text-stone-600',
  'no-show': 'bg-rose-100 text-rose-700',
}

const actionClass: Record<AppointmentStatus, string> = {
  'pending': '',
  'confirmed': 'bg-emerald-600 text-white hover:bg-emerald-700',
  'completed': 'bg-sky-600 text-white hover:bg-sky-700',
  'no-show': 'bg-white text-rose-700 ring-1 ring-rose-300 hover:bg-rose-50',
  'cancelled': 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50',
}

function act(status: AppointmentStatus) {
  if (status === 'cancelled' && !window.confirm(t('admin.actions.confirmCancel'))) return
  emit('status', status)
}
</script>

<template>
  <article
    class="rounded-2xl bg-white ring-1 ring-stone-200 transition"
    :class="a.status === 'cancelled' && 'opacity-60'"
  >
    <button type="button" class="flex w-full items-start gap-4 p-4 text-left" :aria-expanded="open" @click="open = !open">
      <div class="w-14 shrink-0 text-center sm:w-16">
        <div class="text-lg font-semibold leading-tight text-stone-900">{{ formatTime(a.startMinutes) }}</div>
        <div class="text-xs text-stone-500">{{ formatTime(end) }}</div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-semibold text-stone-900" :class="a.status === 'cancelled' && 'line-through'">{{ a.customer.name }}</span>
          <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass[a.status]">
            {{ t(`admin.status.${a.status}`) }}
          </span>
          <span v-if="a.source === 'phone'" class="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
            ☎ {{ t('admin.source.phone') }}
          </span>
        </div>
        <div class="mt-0.5 truncate text-sm text-stone-600">
          {{ a.treatments.map(tr => t(`treatments.items.${tr.id}.name`)).join(', ') }}
        </div>
        <div class="mt-0.5 text-xs text-stone-500">{{ staffName }}</div>
      </div>

      <div class="shrink-0 text-right">
        <div class="font-semibold text-stone-900">{{ fmt.price(a.totalPrice) }}</div>
        <svg class="ml-auto mt-1 size-4 text-stone-400 transition" :class="open && 'rotate-180'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </div>
    </button>

    <div v-if="open" class="border-t border-stone-100 px-4 pb-4 pt-3">
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-stone-500">{{ t('admin.details.phone') }}</dt>
          <dd><a :href="`tel:${a.customer.phone.replace(/[^\d+]/g, '')}`" class="font-medium text-rose-600 hover:underline">{{ a.customer.phone }}</a></dd>
        </div>
        <div>
          <dt class="text-xs text-stone-500">{{ t('admin.details.email') }}</dt>
          <dd>
            <a v-if="a.customer.email" :href="`mailto:${a.customer.email}`" class="font-medium text-rose-600 hover:underline">{{ a.customer.email }}</a>
            <span v-else class="text-stone-400">—</span>
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs text-stone-500">{{ t('admin.details.treatments') }}</dt>
          <dd>
            <ul class="mt-0.5 space-y-0.5">
              <li v-for="tr in a.treatments" :key="tr.id" class="flex justify-between gap-4">
                <span>{{ t(`treatments.items.${tr.id}.name`) }} <span class="text-stone-400">· {{ fmt.duration(tr.durationMin) }}</span></span>
                <span class="text-stone-600">{{ fmt.price(tr.price) }}</span>
              </li>
            </ul>
          </dd>
        </div>
        <div v-if="a.notes" class="sm:col-span-2">
          <dt class="text-xs text-stone-500">{{ t('admin.details.notes') }}</dt>
          <dd class="whitespace-pre-line text-stone-700">{{ a.notes }}</dd>
        </div>
        <div>
          <dt class="text-xs text-stone-500">{{ t('admin.details.booked') }}</dt>
          <dd class="text-stone-700">
            {{ a.createdAt ? fmt.date(a.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-stone-500">{{ t('admin.details.language') }}</dt>
          <dd class="uppercase text-stone-700">{{ a.locale }}</dd>
        </div>
      </dl>

      <div v-if="actions.length || canReschedule(a)" class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="status in actions.filter(s => s !== 'cancelled')"
          :key="status"
          type="button"
          :disabled="saving"
          class="rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60"
          :class="actionClass[status]"
          @click="act(status)"
        >
          {{ t(`admin.actions.${status}`) }}
        </button>
        <button
          v-if="canReschedule(a)"
          type="button"
          :disabled="saving"
          class="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-stone-800 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
          @click="emit('reschedule')"
        >
          {{ t('admin.reschedule.open') }}
        </button>
        <!-- Destructive action last -->
        <button
          v-if="actions.includes('cancelled')"
          type="button"
          :disabled="saving"
          class="rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 sm:ml-auto"
          :class="actionClass.cancelled"
          @click="act('cancelled')"
        >
          {{ t('admin.actions.cancelled') }}
        </button>
      </div>
    </div>
  </article>
</template>
