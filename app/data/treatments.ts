import type { PhotoKey } from './photos'

export type TreatmentCategory = 'injectables' | 'facial' | 'lashes'

export interface Treatment {
  /** Also used as the i18n key: treatments.items.<id>.name / .description */
  id: string
  category: TreatmentCategory
  /** Price in PLN */
  price: number
  durationMin: number
  image: PhotoKey
  featured?: boolean
}

export const treatmentCategories: TreatmentCategory[] = ['injectables', 'facial', 'lashes']

export const treatments: Treatment[] = [
  // Injectables
  { id: 'botox-1-area', category: 'injectables', price: 700, durationMin: 30, image: 'injectionForehead' },
  { id: 'botox-3-areas', category: 'injectables', price: 1400, durationMin: 45, image: 'injectionBotox', featured: true },
  { id: 'botox-bruxism', category: 'injectables', price: 1200, durationMin: 30, image: 'injectionChin', featured: true },
  { id: 'botox-hyperhidrosis', category: 'injectables', price: 1800, durationMin: 45, image: 'portrait' },
  { id: 'lip-augmentation', category: 'injectables', price: 1100, durationMin: 45, image: 'lips', featured: true },
  { id: 'skin-booster', category: 'injectables', price: 1300, durationMin: 30, image: 'glowingSkin' },
  { id: 'mesotherapy', category: 'injectables', price: 500, durationMin: 45, image: 'needleProcedure' },

  // Facial treatments
  { id: 'deep-cleansing', category: 'facial', price: 300, durationMin: 60, image: 'cleansingFoam' },
  { id: 'chemical-peel', category: 'facial', price: 350, durationMin: 45, image: 'facialMaskApplication' },
  { id: 'microneedling', category: 'facial', price: 600, durationMin: 60, image: 'facialTreatment' },

  // Lashes & brows
  { id: 'lash-lift', category: 'lashes', price: 200, durationMin: 60, image: 'lashes' },
  { id: 'brow-lamination', category: 'lashes', price: 180, durationMin: 45, image: 'eyeBrow' },
]

export const getTreatment = (id: string) => treatments.find(t => t.id === id)
