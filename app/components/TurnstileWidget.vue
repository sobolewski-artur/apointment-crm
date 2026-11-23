<script setup lang="ts">
/**
 * Cloudflare Turnstile challenge. The token (v-model) must be verified on the server
 * (createBooking Cloud Function). Tokens are single-use - call reset() after each submit.
 */
interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const props = withDefaults(defineProps<{ action?: string }>(), { action: 'booking' })
const token = defineModel<string | null>({ default: null })

const { public: { turnstileSiteKey } } = useRuntimeConfig()
const { locale } = useI18n()
const container = ref<HTMLElement>()
const loadError = ref(false)
let widgetId: string | undefined

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | undefined
const loadScript = () => {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = undefined
      reject(new Error('Turnstile script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

onMounted(async () => {
  try {
    await loadScript()
  }
  catch (error) {
    console.error('[turnstile]', error)
    loadError.value = true
    return
  }
  if (!container.value || !window.turnstile) return
  widgetId = window.turnstile.render(container.value, {
    'sitekey': turnstileSiteKey,
    'action': props.action,
    'language': locale.value,
    'theme': 'light',
    'callback': (t: string) => (token.value = t),
    'expired-callback': () => (token.value = null),
    'error-callback': () => {
      token.value = null
    },
  })
})

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId)
})

defineExpose({
  reset: () => {
    token.value = null
    if (widgetId) window.turnstile?.reset(widgetId)
  },
})
</script>

<template>
  <div>
    <div ref="container" class="min-h-[65px]" />
    <p v-if="loadError" class="text-sm text-red-600">{{ $t('booking.errors.turnstileLoad') }}</p>
  </div>
</template>
