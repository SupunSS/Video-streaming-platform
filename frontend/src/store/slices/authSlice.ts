import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id?: string;
  email: string;
  username: string;
  avatar?: string;
  accountType?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const notifyLibraryChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("library-updated"));
};

const initialToken = getStoredToken();
const initialUser = getStoredUser();

const initialState: AuthState = {
  user: initialToken ? initialUser : null,
  token: initialToken,
  isAuthenticated: !!initialToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        notifyLibraryChanged();
      }
    },

    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },

    updateAvatar(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        notifyLibraryChanged();
      }
    },
  },
});

export const { setCredentials, setUser, updateAvatar, logout } =
  authSlice.actions;
export default authSlice.reducer;
