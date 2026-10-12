import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { firebaseConfig } from './config'

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  // Writes made offline are kept in IndexedDB and sent when the connection returns.
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  // Optional fields like `feedback` can be undefined; Firestore rejects undefined values otherwise.
  ignoreUndefinedProperties: true,
})
