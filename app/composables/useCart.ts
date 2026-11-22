import { getTreatment, type Treatment } from '~/data/treatments'

/** Selected treatments. Persisted to localStorage by plugins/cart.client.ts */
export const useCart = () => {
  const ids = useState<string[]>('cart', () => [])

  const items = computed(() =>
    ids.value.map(id => getTreatment(id)).filter((t): t is Treatment => !!t),
  )
  const count = computed(() => items.value.length)
  const totalPrice = computed(() => items.value.reduce((sum, t) => sum + t.price, 0))
  const totalDuration = computed(() => items.value.reduce((sum, t) => sum + t.durationMin, 0))

  const has = (id: string) => ids.value.includes(id)
  const add = (id: string) => {
    if (!has(id)) ids.value = [...ids.value, id]
  }
  const remove = (id: string) => {
    ids.value = ids.value.filter(x => x !== id)
  }
  const toggle = (id: string) => (has(id) ? remove(id) : add(id))
  const clear = () => {
    ids.value = []
  }

  return { ids, items, count, totalPrice, totalDuration, has, add, remove, toggle, clear }
}
