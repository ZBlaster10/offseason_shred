import { create } from 'zustand'

export interface AccountUser {
  email: string | null
  displayName: string | null
  photoURL: string | null
}

/** `connecting`: signed in, waiting for the first merge with the account's data. */
export type AuthStatus = 'unknown' | 'signedOut' | 'connecting' | 'signedIn'
export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error'

interface AuthState {
  status: AuthStatus
  user: AccountUser | null
  sync: SyncStatus
  signInOpen: boolean
  /** Which form the sign-in sheet opens on. */
  signInMode: 'signIn' | 'signUp'
  /** Shown in the sign-in sheet. */
  error: string | null
  openSignIn: () => void
  openSignUp: () => void
  closeSignIn: () => void
}

/** Account state for the UI. Not persisted: Firebase restores the session itself. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'unknown',
  user: null,
  sync: 'synced',
  signInOpen: false,
  signInMode: 'signIn',
  error: null,
  openSignIn: () => set({ signInOpen: true, signInMode: 'signIn', error: null }),
  openSignUp: () => set({ signInOpen: true, signInMode: 'signUp', error: null }),
  closeSignIn: () => set({ signInOpen: false, error: null }),
}))
