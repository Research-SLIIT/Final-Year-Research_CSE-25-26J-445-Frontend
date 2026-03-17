import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";

// Mock fakeApi — dynamic imports inside the store actions require this
vi.mock("@/lib/fakeApi", () => ({
  authSignIn: vi.fn(),
  authSignUp: vi.fn(),
  authUpdateProfile: vi.fn(),
}));

import { authSignIn, authSignUp, authUpdateProfile } from "@/lib/fakeApi";
const mockSignIn = vi.mocked(authSignIn);
const mockSignUp = vi.mocked(authSignUp);
const mockUpdateProfile = vi.mocked(authUpdateProfile);

// Provide a full localStorage mock for jsdom
const localStorageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); }),
};
vi.stubGlobal("localStorage", mockLocalStorage);

const mockUser = {
  id: "u1",
  name: "Alice",
  email: "alice@example.com",
  displayName: "Alice A",
  bio: "Investor",
  joinedDate: "2024-01-01",
};

beforeEach(() => {
  mockSignIn.mockReset();
  mockSignUp.mockReset();
  mockUpdateProfile.mockReset();
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  // Clear local storage store
  Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });
});

describe("useAuthStore", () => {
  it("initializes with null user, null token, isAuthenticated false", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("loadSession sets user + token + isAuthenticated when localStorage has valid data", () => {
    localStorageStore["cse_auth_token"] = "tok123";
    localStorageStore["cse_user"] = JSON.stringify(mockUser);
    useAuthStore.getState().loadSession();
    const state = useAuthStore.getState();
    expect(state.token).toBe("tok123");
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
  });

  it("loadSession sets loading=false when localStorage is empty", () => {
    useAuthStore.getState().loadSession();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("loadSession handles malformed JSON in localStorage without crashing", () => {
    localStorageStore["cse_auth_token"] = "tok123";
    localStorageStore["cse_user"] = "{bad json{{";
    expect(() => useAuthStore.getState().loadSession()).not.toThrow();
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("signIn success: sets user, token, isAuthenticated=true, writes localStorage", async () => {
    mockSignIn.mockResolvedValueOnce({ user: mockUser, token: "tok-abc" });
    await useAuthStore.getState().signIn("alice@example.com", "pass");
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("tok-abc");
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cse_auth_token", "tok-abc");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cse_user", JSON.stringify(mockUser));
  });

  it("signIn failure: sets error message, does not set isAuthenticated", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Invalid credentials"));
    await expect(
      useAuthStore.getState().signIn("bad@example.com", "wrong")
    ).rejects.toThrow("Invalid credentials");
    const state = useAuthStore.getState();
    expect(state.error).toBe("Invalid credentials");
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });

  it("signIn sets loading=false after completion", async () => {
    mockSignIn.mockResolvedValueOnce({ user: mockUser, token: "tok" });
    await useAuthStore.getState().signIn("alice@example.com", "pass");
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it("signIn clears error at start of each call", async () => {
    useAuthStore.setState({ error: "previous error" });
    mockSignIn.mockResolvedValueOnce({ user: mockUser, token: "tok" });
    await useAuthStore.getState().signIn("alice@example.com", "pass");
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("signUp success: creates user, sets authenticated, writes localStorage", async () => {
    mockSignUp.mockResolvedValueOnce({ user: mockUser, token: "tok-new" });
    await useAuthStore.getState().signUp("Alice", "alice@example.com", "pass");
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe("tok-new");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cse_auth_token", "tok-new");
  });

  it("signUp failure: sets error message", async () => {
    mockSignUp.mockRejectedValueOnce(new Error("Email already exists"));
    await expect(
      useAuthStore.getState().signUp("Alice", "alice@example.com", "pass")
    ).rejects.toThrow("Email already exists");
    expect(useAuthStore.getState().error).toBe("Email already exists");
  });

  it("signOut clears user, token, sets isAuthenticated=false, removes localStorage keys", () => {
    useAuthStore.setState({ user: mockUser, token: "tok", isAuthenticated: true });
    useAuthStore.getState().signOut();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("cse_auth_token");
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("cse_user");
  });

  it("updateProfile calls fakeApi, updates user in store and localStorage", async () => {
    const updatedUser = { ...mockUser, displayName: "Alice Updated", bio: "New bio" };
    useAuthStore.setState({ user: mockUser, token: "tok", isAuthenticated: true });
    localStorageStore["cse_auth_token"] = "tok";
    mockUpdateProfile.mockResolvedValueOnce(updatedUser);
    await useAuthStore.getState().updateProfile("Alice Updated", "New bio");
    const state = useAuthStore.getState();
    expect(state.user).toEqual(updatedUser);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cse_user", JSON.stringify(updatedUser));
    expect(state.loading).toBe(false);
  });

  it("clearError sets error to null", () => {
    useAuthStore.setState({ error: "some error" });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
