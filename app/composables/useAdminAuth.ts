import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore'

// Admin pages are client-only (routeRules ssr: false), so module-level state is safe here
// and firebase/auth is only loaded by admin pages, not the public site.
const user = shallowRef<User | null>(null)
const isAdmin = ref(false)
let ready: Promise<void> | null = null

/**
 * Admin = signed-in Firebase Auth user who has a document at admins/{uid}.
 * The same check is enforced in firestore.rules (isAdmin()).
 */
export const useAdminAuth = () => {
  const app = useFirebaseApp()
  const auth = getAuth(app)
  const db = getFirestore(app)

  const checkAdmin = async (u: User | null) => {
    if (!u) return false
    try {
      const snap = await withTimeout(getDocFromServer(doc(db, 'admins', u.uid)), 10_000, 'checkAdmin')
      return snap.exists()
    }
    catch (error) {
      console.error('[admin] admin check failed', error)
      return false
    }
  }

  /** Resolves once the initial auth state (restored session) is known */
  const init = () => {
    ready ??= new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (u) => {
        isAdmin.value = await checkAdmin(u)
        user.value = u
        resolve()
      })
    })
    return ready
  }

  const signIn = async (email: string, password: string) => {
    const { user: u } = await signInWithEmailAndPassword(auth, email, password)
    isAdmin.value = await checkAdmin(u)
    user.value = u
    if (!isAdmin.value) await signOut(auth)
    return isAdmin.value
  }

  const logout = () => signOut(auth)

  return { user, isAdmin, init, signIn, logout }
}
