import type { FirebaseApp } from 'firebase/app'

/** Returns the Firebase app initialized in plugins/firebase.ts */
export const useFirebaseApp = (): FirebaseApp => useNuxtApp().$firebaseApp
