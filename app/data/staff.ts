import type { TreatmentCategory } from './treatments'

export type StaffRole = 'doctor' | 'cosmetologist'

export interface StaffMember {
  /** Stable id - stored with appointments, do not change once bookings exist */
  id: string
  name: string
  role: StaffRole
  /** Treatment categories this person performs */
  categories: TreatmentCategory[]
}

// Placeholder team - replace names with the real staff.
// Everyone works during the salon opening hours (data/salon.ts).
export const staff: StaffMember[] = [
  { id: 'doctor-1', name: 'dr Anna Kowalska', role: 'doctor', categories: ['injectables', 'facial'] },
  { id: 'doctor-2', name: 'dr Marta Nowak', role: 'doctor', categories: ['injectables', 'facial'] },
  { id: 'doctor-3', name: 'dr Piotr Zieliński', role: 'doctor', categories: ['injectables', 'facial'] },
  { id: 'cosmetologist-1', name: 'Karolina Wiśniewska', role: 'cosmetologist', categories: ['facial', 'lashes'] },
  { id: 'cosmetologist-2', name: 'Julia Wójcik', role: 'cosmetologist', categories: ['facial', 'lashes'] },
]

export const getStaff = (id: string) => staff.find(s => s.id === id)

/** Staff who can perform every given category (one specialist handles the whole visit) */
export const qualifiedStaff = (categories: TreatmentCategory[]) =>
  staff.filter(s => categories.every(c => s.categories.includes(c)))
