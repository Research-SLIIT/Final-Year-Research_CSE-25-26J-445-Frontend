import { create } from "zustand"
import { apiClient, ApiError } from "@/lib/api-client"
import { DEMO_MODE } from "@/lib/demo/config"
import { DEMO_TOKEN, DEMO_USER } from "@/lib/demo/auth"

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
  refreshUser: () => Promise<void>
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
    // Reachable if someone navigates straight to /auth/sign-in in the demo.
    // Accept and drop them into the demo account rather than failing against
    // an auth-service that is not deployed.
    if (DEMO_MODE) {
      set({ user: DEMO_USER, token: DEMO_TOKEN, isAuthenticated: true, loading: false })
      return
    }
    try {
      const response = await apiClient<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      
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
    if (DEMO_MODE) {
      set({
        user: { ...DEMO_USER, name, displayName: name, email },
        token: DEMO_TOKEN,
        isAuthenticated: true,
        loading: false,
      })
      return
    }
    try {
      const response = await apiClient<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      })
      
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
    // Signing out of a demo that signs itself back in on the next load would
    // just look broken, so this returns to the demo account instead.
    if (DEMO_MODE) {
      set({ user: DEMO_USER, token: DEMO_TOKEN, isAuthenticated: true, loading: false, error: null })
      return
    }

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
    // No auth-service to sign in against, so the demo opens already signed in
    // as a premium account and every feature is one click away.
    if (DEMO_MODE) {
      set({
        user: DEMO_USER,
        token: DEMO_TOKEN,
        isAuthenticated: true,
        loading: false,
      })
      return
    }

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

  refreshUser: async () => {
    // Nothing to refresh against, and letting this fall through would 401 the
    // demo account straight back out to the login wall.
    if (DEMO_MODE) return

    try {
      const token = localStorage.getItem(STORAGE_KEY)
      if (!token) return

      const user = await apiClient<User>("/user/profile")
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      set({ user, isAuthenticated: true })
    } catch (error) {
      // An expired or invalid token means the session is no longer valid.
      // Clear it and drop to the unauthenticated state so the app can redirect
      // to login, instead of leaving a stale, half-authenticated session.
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
        set({ user: null, token: null, isAuthenticated: false })
        return
      }
      console.error("Failed to refresh user profile:", error)
    }
  },

  updateProfile: async (displayName: string, bio: string) => {
    set({ loading: true, error: null })
    // Edits apply for the session so the profile screen is not read-only, but
    // there is no user-service to persist them to.
    if (DEMO_MODE) {
      set((state) => ({
        user: state.user ? { ...state.user, displayName, bio } : { ...DEMO_USER, displayName, bio },
        loading: false,
      }))
      return
    }
    try {
      const updatedUser = await apiClient<User>("/user/profile", {
        method: "PUT",
        body: JSON.stringify({ displayName, bio }),
      })
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
