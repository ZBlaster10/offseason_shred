import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { doc, FieldPath, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentReference, type SnapshotMetadata } from 'firebase/firestore'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore, type SyncStatus } from '@/store/useAuthStore'
import { auth, db } from './firebase'
import { diffForWrite, mergeOnSignIn, pickLocal, remotePatch, toRemote, type FieldWrite, type LocalData, type RemoteData } from './merge'

/**
 * Keeps the app store in sync with `users/{uid}` while someone is signed in.
 * - The store (persisted to localStorage) stays the device cache, so the app works offline.
 * - Local changes are written field by field as they happen; Firestore queues them while offline.
 * - Changes from other devices arrive through a live listener and are patched into the store.
 */

const SCHEMA = 1
const REDIRECT_FLAG = 'shred-auth-redirect'

let started = false
let attachedUid: string | null = null
let detachSync: (() => void) | null = null
/** Set while a remote snapshot is written into the store, so it isn't echoed back. */
let applyingRemote = false

export function initCloud() {
  if (started) return
  started = true

  if (sessionStorage.getItem(REDIRECT_FLAG)) {
    sessionStorage.removeItem(REDIRECT_FLAG)
    getRedirectResult(auth).catch((err) => {
      const error = authErrorMessage(err)
      if (error) useAuthStore.setState({ signInOpen: true, error })
    })
  }

  onAuthStateChanged(auth, (user) => {
    if (user && user.uid === attachedUid) return
    detach()
    if (!user) {
      // Also the state on every page load for guests. Nothing is cleared here; only signing out does that.
      useAuthStore.setState({ status: 'signedOut', user: null })
      return
    }
    useAuthStore.setState({
      status: 'connecting',
      user: { email: user.email, displayName: user.displayName, photoURL: user.photoURL },
    })
    attach(user.uid)
  })
}

function attach(uid: string) {
  attachedUid = uid
  const ref = doc(db, 'users', uid)
  let unsubStore: (() => void) | null = null

  const unsubSnap = onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snap) => {
      if (!unsubStore) {
        // A cache miss while offline says nothing about the account. Wait for the server before merging,
        // or this device's data could overwrite it.
        if (!snap.exists() && snap.metadata.fromCache) return
        unsubStore = firstSync(ref, snap.exists() ? (snap.data() as Partial<RemoteData>) : null)
      } else if (snap.exists()) {
        applyToStore(remotePatch(local(), snap.data() as Partial<RemoteData>))
      }
      useAuthStore.setState({ sync: syncStatus(snap.metadata) })
    },
    (err) => {
      console.warn('[sync] listener stopped', err)
      useAuthStore.setState({ sync: 'error', status: 'signedIn' })
    },
  )

  detachSync = () => {
    unsubSnap()
    unsubStore?.()
  }
}

function detach() {
  detachSync?.()
  detachSync = null
  attachedUid = null
}

/** Merges this device with the account, then starts writing local changes. Returns the store unsubscribe. */
function firstSync(ref: DocumentReference, remote: Partial<RemoteData> | null) {
  const { merged, writes } = mergeOnSignIn(local(), remote)
  applyToStore(merged)
  if (!remote) void setDoc(ref, { ...toRemote(merged), schema: SCHEMA, updatedAt: serverTimestamp() }).catch(onWriteError)
  else if (writes.length) void write(ref, writes)

  const unsubStore = useAppStore.subscribe((next, prev) => {
    if (applyingRemote) return
    const changes = diffForWrite(pickLocal(prev), pickLocal(next))
    if (changes.length) void write(ref, changes)
  })
  useAuthStore.setState({ status: 'signedIn' })
  return unsubStore
}

async function write(ref: DocumentReference, writes: FieldWrite[]) {
  const [first, ...rest] = writes.flatMap((w) => [new FieldPath(...w.path), w.value])
  try {
    await updateDoc(ref, first as FieldPath, rest[0], ...rest.slice(1), 'updatedAt', serverTimestamp())
  } catch (err) {
    // The doc was deleted outside the app: recreate it from this device.
    if (err instanceof FirebaseError && err.code === 'not-found') {
      await setDoc(ref, { ...toRemote(local()), schema: SCHEMA, updatedAt: serverTimestamp() }).catch(onWriteError)
    } else onWriteError(err)
  }
}

function onWriteError(err: unknown) {
  console.warn('[sync] write failed', err)
  useAuthStore.setState({ sync: 'error' })
}

const local = (): LocalData => pickLocal(useAppStore.getState())

function applyToStore(patch: Partial<LocalData> | null) {
  if (!patch) return
  applyingRemote = true
  try {
    useAppStore.setState(patch)
  } finally {
    applyingRemote = false
  }
}

function syncStatus(meta: SnapshotMetadata): SyncStatus {
  if (meta.fromCache && !navigator.onLine) return 'offline'
  return meta.hasPendingWrites ? 'pending' : 'synced'
}

// ---- Account actions (called from the sign-in sheet and Profile) ----

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    // Some in-app browsers and home-screen apps block popups; a full-page redirect still works there.
    if (err instanceof FirebaseError && ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(err.code)) {
      sessionStorage.setItem(REDIRECT_FLAG, '1')
      await signInWithRedirect(auth, provider)
      return
    }
    throw err
  }
}

export const signInEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password)

export const signUpEmail = (email: string, password: string) => createUserWithEmailAndPassword(auth, email.trim(), password)

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim())

/** Signs out and clears this device. The account keeps everything. */
export async function signOutAndClear() {
  // Stop syncing first so the local reset isn't written to the account.
  detach()
  await signOut(auth)
  useAppStore.getState().resetAll()
}

const MESSAGES: Record<string, string | null> = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'There’s already an account with this email. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/account-exists-with-different-credential': 'This email already uses a different sign-in method.',
  'auth/unauthorized-domain': 'Sign-in isn’t enabled for this site yet. Add its domain in Firebase → Authentication → Settings.',
  'auth/operation-not-allowed': 'This sign-in method isn’t turned on in Firebase yet.',
  // The user closed the popup themselves: nothing to report.
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
  'auth/user-cancelled': null,
}

export function authErrorMessage(err: unknown): string | null {
  const code = err instanceof FirebaseError ? err.code : ''
  if (code in MESSAGES) return MESSAGES[code]
  console.warn('[auth]', err)
  return 'Something went wrong. Please try again.'
}
