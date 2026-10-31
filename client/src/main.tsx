import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { AppRouter } from "./routes/AppRouter";
import { initInstallPrompt } from "./pwa/installPrompt";
import "./styles/index.css";

// Capture `beforeinstallprompt` as early as possible; it can fire before the sidebar mounts.
initInstallPrompt();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </React.StrictMode>
);
