/**
 * Photos from Unsplash (https://unsplash.com/license - free to use, attribution appreciated).
 * Served from the Unsplash image CDN, resized on the fly via URL params (see utils/unsplash.ts).
 */
export interface Photo {
  /** Image id on images.unsplash.com */
  id: string
  /** Photo page slug on unsplash.com/photos/<slug> */
  slug: string
  author: string
  username: string
}

export const photos = {
  facialMassage: { id: 'photo-1643684391140-c5056cfd3436', slug: 'a-woman-getting-a-facial-massage-on-her-face-rWwuf8yKw4Y', author: 'Dominique Rivas', username: 'dominiquerivu' },
  salonInterior: { id: 'photo-1759262151080-e05ba1c6294f', slug: 'woman-sitting-in-a-modern-waiting-room-reading-jH05wxjmAWE', author: 'Caroline Badran', username: '___atmos' },
  facialMaskApplication: { id: 'photo-1731514771613-991a02407132', slug: 'a-woman-getting-a-facial-mask-on-her-face-u93nTfWqR9w', author: 'kimia kazemi', username: 'kimick' },

  injectionForehead: { id: 'photo-1785861485926-93a13556d656', slug: 'professional-administers-aesthetic-injection-to-womans-forehead-0I5csvv8RFA', author: 'Sum Sum', username: 'surprisechef' },
  injectionBotox: { id: 'photo-1746708810803-722593e53772', slug: 'botox-injection-being-administered-to-a-woman-qehqLHZ9toc', author: 'Mina Rad', username: 'miinrad' },
  injectionChin: { id: 'photo-1785861084191-3600dfc2a6d6', slug: 'a-woman-receiving-a-cosmetic-injection-on-her-chin-35IcCEwNTqc', author: 'Sum Sum', username: 'surprisechef' },
  portrait: { id: 'photo-1581182815808-b6eb627a8798', slug: 'close-portrait-of-woman-with-bokeh-e7jpGYe7OtU', author: 'Fleur Kaan', username: 'fleuraimeekaan' },
  lips: { id: 'photo-1654374504608-67c4cfe65fca', slug: 'a-close-up-of-a-womans-lips-and-nose-iVGmPVoi8Rk', author: 'Tony Litvyak', username: 'justatony' },
  glowingSkin: { id: 'photo-1581182800629-7d90925ad072', slug: 'woman-in-white-tank-top-w4Dj3MshHQ0', author: 'Fleur Kaan', username: 'fleuraimeekaan' },
  needleProcedure: { id: 'photo-1761819922656-d1b77eef49c0', slug: 'a-woman-receiving-a-thread-lift-procedure-on-her-face-SH4pZQtTdOs', author: 'Patient Perfect', username: 'patientperfect' },
  cleansingFoam: { id: 'photo-1761718209708-9ab9ba1c7252', slug: 'womans-face-with-cleansing-foam-during-facial-treatment-J6Hg_YH2tFk', author: 'kimia kazemi', username: 'kimick' },
  facialMask: { id: 'photo-1570172619644-dfd03ed5d881', slug: 'woman-receiving-facial-mask-treatment-at-spa-Pe9IXUuC6QU', author: 'Rosa Rafael', username: 'rosarafael' },
  facialTreatment: { id: 'photo-1761718210089-ba3bb5ccb54f', slug: 'a-person-receiving-a-facial-treatment-RbIcMsh0NSk', author: 'kimia kazemi', username: 'kimick' },
  lashes: { id: 'photo-1674049406467-824ea37c7184', slug: 'a-woman-getting-her-eyelashes-done-by-a-professional-makeup-artist-xA_djNkH0Yo', author: 'Bermix Studio', username: 'bermixstudio' },
  eyeBrow: { id: 'photo-1516220362602-dba5272034e7', slug: 'close-up-photo-of-persons-eye-fvInY-Gh7sc', author: 'Amanda Dalbjörn', username: 'amandadalbjorn' },
} satisfies Record<string, Photo>

export type PhotoKey = keyof typeof photos
