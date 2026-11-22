<script setup lang="ts">
/** Side panel used by admin dialogs: overlay, Esc to close, scroll lock, focus on open. */
const props = defineProps<{ title: string, subtitle?: string, busy?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const titleId = useId()
const body = ref<HTMLElement>()

const close = () => {
  if (!props.busy) emit('close')
}
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  body.value?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <div class="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" aria-hidden="true" @click="close" />

    <div role="dialog" aria-modal="true" :aria-labelledby="titleId" class="relative flex h-full w-full max-w-2xl flex-col bg-stone-50 shadow-2xl">
      <div class="flex items-start gap-4 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
        <div class="min-w-0 flex-1">
          <h2 :id="titleId" class="font-serif text-xl font-medium text-stone-900">{{ title }}</h2>
          <p v-if="subtitle" class="mt-0.5 text-sm text-stone-500">{{ subtitle }}</p>
        </div>
        <button type="button" class="rounded-lg p-2 text-stone-500 hover:bg-stone-100" :aria-label="t('admin.newBooking.close')" @click="close">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div ref="body" class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <slot />
      </div>

      <div class="border-t border-stone-200 bg-white px-5 py-4 sm:px-6">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
