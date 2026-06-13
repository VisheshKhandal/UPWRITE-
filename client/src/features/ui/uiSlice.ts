import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark" | "system";

export interface ToastMessage {
  id: string;
  title: string;
  tone?: "success" | "error" | "info";
  actionLabel?: string;
  actionId?: string;
}

interface UiState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  theme: (localStorage.getItem("upwrite-theme") as ThemeMode | null) ?? "system",
  sidebarOpen: false,
  toasts: []
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      localStorage.setItem("upwrite-theme", action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("upwrite-theme", state.theme);
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    pushToast: (state, action: PayloadAction<Omit<ToastMessage, "id">>) => {
      state.toasts.push({ ...action.payload, id: crypto.randomUUID() });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    }
  }
});

export const { setTheme, toggleTheme, setSidebarOpen, pushToast, removeToast } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
