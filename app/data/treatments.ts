export type TreatmentCategory = 'injectables' | 'facial' | 'lashes'

export interface Treatment {
  /** Also used as the i18n key: treatments.items.<id>.name / .description */
  id: string
  category: TreatmentCategory
  /** Price in PLN */
  price: number
  durationMin: number
  featured?: boolean
}

export const treatmentCategories: TreatmentCategory[] = ['injectables', 'facial', 'lashes']

export const treatments: Treatment[] = [
  // Injectables
  { id: 'botox-1-area', category: 'injectables', price: 700, durationMin: 30 },
  { id: 'botox-3-areas', category: 'injectables', price: 1400, durationMin: 45, featured: true },
  { id: 'botox-bruxism', category: 'injectables', price: 1200, durationMin: 30, featured: true },
  { id: 'botox-hyperhidrosis', category: 'injectables', price: 1800, durationMin: 45 },
  { id: 'lip-augmentation', category: 'injectables', price: 1100, durationMin: 45, featured: true },
  { id: 'skin-booster', category: 'injectables', price: 1300, durationMin: 30 },
  { id: 'mesotherapy', category: 'injectables', price: 500, durationMin: 45 },

  // Facial treatments
  { id: 'deep-cleansing', category: 'facial', price: 300, durationMin: 60 },
  { id: 'chemical-peel', category: 'facial', price: 350, durationMin: 45 },
  { id: 'microneedling', category: 'facial', price: 600, durationMin: 60 },

  // Lashes & brows
  { id: 'lash-lift', category: 'lashes', price: 200, durationMin: 60 },
  { id: 'brow-lamination', category: 'lashes', price: 180, durationMin: 45 },
]

export const getTreatment = (id: string) => treatments.find(t => t.id === id)
