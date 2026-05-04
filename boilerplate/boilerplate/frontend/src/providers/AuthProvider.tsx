import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../config/firebase'

export type UserRole = 'patient' | 'nutritionist'

interface ExtraData {
  phone?: string
  birthdate?: string
  country?: string
  especialidades?: string[]
  modalidad?: string
  registro?: string
}

interface LoginResult {
  role: UserRole
  onboardingCompleted: boolean
}

interface AuthContextType {
  user: User | null
  role: UserRole | null
  onboardingCompleted: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  loginWithGoogle: (role?: UserRole) => Promise<LoginResult>
  register: (email: string, password: string, displayName: string, role: UserRole, extra?: ExtraData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  markOnboardingDone: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        setRole((snap.data()?.role as UserRole) ?? 'patient')
        setOnboardingCompleted(snap.data()?.onboardingCompleted ?? false)
      } else {
        setRole(null)
        setOnboardingCompleted(false)
      }
      setLoading(false)
    })
  }, [])

  async function createUserDoc(u: User, r: UserRole, extra: ExtraData = {}) {
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName ?? '',
        photoURL: u.photoURL ?? '',
        role: r,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        ...extra,
      })
    }
    return r
  }

  async function login(email: string, password: string): Promise<LoginResult> {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', result.user.uid))
    const data = snap.data()
    const r = (data?.role as UserRole) ?? 'patient'
    const ob = data?.onboardingCompleted ?? false
    setRole(r)
    setOnboardingCompleted(ob)
    return { role: r, onboardingCompleted: ob }
  }

  async function loginWithGoogle(r: UserRole = 'patient'): Promise<LoginResult> {
    const result = await signInWithPopup(auth, googleProvider)
    const snap = await getDoc(doc(db, 'users', result.user.uid))
    const existingRole = snap.exists() ? (snap.data()?.role as UserRole) : r
    const ob = snap.exists() ? (snap.data()?.onboardingCompleted ?? false) : false
    await createUserDoc(result.user, existingRole)
    setRole(existingRole)
    setOnboardingCompleted(ob)
    return { role: existingRole, onboardingCompleted: ob }
  }

  async function register(email: string, password: string, displayName: string, r: UserRole, extra: ExtraData = {}) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    await createUserDoc(result.user, r, extra)
    setRole(r)
    setOnboardingCompleted(false)
  }

  async function logout() {
    await signOut(auth)
    setRole(null)
    setOnboardingCompleted(false)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  function markOnboardingDone() {
    setOnboardingCompleted(true)
  }

  return (
    <AuthContext.Provider value={{ user, role, onboardingCompleted, loading, login, loginWithGoogle, register, logout, resetPassword, markOnboardingDone }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
