import { HttpsError } from 'firebase-functions/v2/https'

export interface BookingInput {
  treatments: { id: string, price: number, durationMin: number }[]
  totalPrice: number
  durationMin: number
  date: string
  startMinutes: number
  startTime: string
  staffId: string
  staffName: string
  customer: { name: string, phone: string, email: string }
  notes: string
  locale: string
}

const fail = (reason: string): never => {
  throw new HttpsError('invalid-argument', `invalid-booking: ${reason}`)
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, field: string, min: number, max: number) => {
  if (typeof v !== 'string' || v.trim().length < min || v.length > max) fail(field)
  return (v as string).trim()
}
const int = (v: unknown, field: string, min: number, max: number) => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) fail(field)
  return v as number
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Validates and normalizes an online booking - the same limits as firestore.rules,
 * plus consistency checks (totals, time format, date not in the past).
 */
export function parseBooking(input: unknown): BookingInput {
  if (!isObject(input)) fail('booking')
  const b = input as Record<string, unknown>

  if (!Array.isArray(b.treatments) || b.treatments.length < 1 || b.treatments.length > 20) fail('treatments')
  const treatments = (b.treatments as unknown[]).map((t, i) => {
    if (!isObject(t)) fail(`treatments[${i}]`)
    const tr = t as Record<string, unknown>
    return {
      id: str(tr.id, `treatments[${i}].id`, 1, 60),
      price: int(tr.price, `treatments[${i}].price`, 0, 100_000),
      durationMin: int(tr.durationMin, `treatments[${i}].durationMin`, 5, 600),
    }
  })

  const totalPrice = int(b.totalPrice, 'totalPrice', 0, 1_000_000)
  const durationMin = int(b.durationMin, 'durationMin', 5, 600)
  if (totalPrice !== treatments.reduce((s, t) => s + t.price, 0)) fail('totalPrice mismatch')
  if (durationMin !== treatments.reduce((s, t) => s + t.durationMin, 0)) fail('durationMin mismatch')

  const date = str(b.date, 'date', 10, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) fail('date')
  // Client sends its local date; allow one day of timezone slack
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (date < yesterday) fail('date in the past')

  const startMinutes = int(b.startMinutes, 'startMinutes', 0, 24 * 60 - 1)
  if (startMinutes + durationMin > 24 * 60) fail('ends after midnight')
  const startTime = `${pad(Math.floor(startMinutes / 60))}:${pad(startMinutes % 60)}`
  if (b.startTime !== startTime) fail('startTime')

  if (!isObject(b.customer)) fail('customer')
  const c = b.customer as Record<string, unknown>
  const phone = str(c.phone, 'customer.phone', 7, 30)
  if (!/^\+?[\d\s()-]{7,30}$/.test(phone)) fail('customer.phone')
  const email = typeof c.email === 'string' ? c.email.trim() : ''
  if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail('customer.email')

  return {
    treatments,
    totalPrice,
    durationMin,
    date,
    startMinutes,
    startTime,
    staffId: str(b.staffId, 'staffId', 1, 40),
    staffName: str(b.staffName, 'staffName', 0, 100),
    customer: { name: str(c.name, 'customer.name', 1, 100), phone, email },
    notes: typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : '',
    locale: str(b.locale, 'locale', 2, 10),
  }
}
