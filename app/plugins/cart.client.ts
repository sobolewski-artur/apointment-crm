import { getTreatment } from '~/data/treatments'

const STORAGE_KEY = 'aura-cart'

export default defineNuxtPlugin(() => {
  const ids = useState<string[]>('cart', () => [])

  // Restore only after hydration has fully finished (incl. async layouts/pages),
  // so server and client render the same initial markup
  onNuxtReady(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      if (Array.isArray(parsed)) {
        ids.value = parsed.filter((id): id is string => typeof id === 'string' && !!getTreatment(id))
      }
    }
    catch {
      // storage unavailable or corrupted - start with an empty cart
    }

    watch(ids, (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      }
      catch {
        // ignore (private mode / storage disabled)
      }
    })
  })
})
