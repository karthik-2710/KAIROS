import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

export const firebaseConfig = {
  databaseURL: "https://kairos-15394-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kairos-15394"
}

// Singleton Firebase initialization
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const rtdb = getDatabase(firebaseApp)
