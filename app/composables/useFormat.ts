export const useFormat = () => {
  const { locale, locales } = useI18n()

  const lang = computed(() => {
    const current = locales.value.find(l => (typeof l === 'string' ? l : l.code) === locale.value)
    return (typeof current === 'object' && current.language) || locale.value
  })

  const price = (value: number) =>
    new Intl.NumberFormat(lang.value, { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value)

  const duration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (!h) return `${m} min`
    return m ? `${h} h ${m} min` : `${h} h`
  }

  const date = (value: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang.value, options).format(value)

  return { price, duration, date }
}
