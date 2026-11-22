const pad = (n: number) => String(n).padStart(2, '0')

/** 570 -> "09:30" */
export const formatTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** Local date -> "YYYY-MM-DD" (no timezone shifting, unlike toISOString) */
export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "YYYY-MM-DD" -> local Date at midnight */
export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
