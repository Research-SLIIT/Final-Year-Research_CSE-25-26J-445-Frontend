import { create } from "zustand"

export interface User {
  id: string
  name: string
  email: string
  displayName: string
  bio: string
  joinedDate: string
  isPremium?: boolean
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
  loadSession: () => void
  updateProfile: (displayName: string, bio: string) => Promise<void>
  clearError: () => void
}

const STORAGE_KEY = "cse_auth_token"
const USER_STORAGE_KEY = "cse_user"

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { authSignIn } = await import("@/lib/fakeApi")
      const response = await authSignIn(email, password)
      localStorage.setItem(STORAGE_KEY, response.token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Sign in failed",
        loading: false,
      })
      throw error
    }
  },

  signUp: async (name: string, email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { authSignUp } = await import("@/lib/fakeApi")
      const response = await authSignUp(name, email, password)
      localStorage.setItem(STORAGE_KEY, response.token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user))
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Sign up failed",
        loading: false,
      })
      throw error
    }
  },

  signOut: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })
  },

  loadSession: () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY)
      const userJson = localStorage.getItem(USER_STORAGE_KEY)
      if (token && userJson) {
        const user = JSON.parse(userJson)
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  updateProfile: async (displayName: string, bio: string) => {
    set({ loading: true, error: null })
    try {
      const { authUpdateProfile } = await import("@/lib/fakeApi")
      const token = localStorage.getItem(STORAGE_KEY)
      if (!token) throw new Error("Not authenticated")
      const updatedUser = await authUpdateProfile(token, displayName, bio)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
      set({
        user: updatedUser,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Profile update failed",
        loading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
