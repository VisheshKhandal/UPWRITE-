import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/models";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  initialized: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  initialized: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; user?: User | null }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.initialized = true;
    }
  }
});

export const { setCredentials, setCurrentUser, setInitialized, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
