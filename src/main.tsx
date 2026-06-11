import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { persistor, store } from "./store/index.ts";
import { PersistGate } from "redux-persist/integration/react";
import { StyledEngineProvider } from "@mui/material/styles";

// Vite fires this event when a dynamically imported chunk fails to load.
// This happens when the browser has cached the old index.html after a new
// deployment (old chunk hashes no longer exist on the server).
// We do a single hard reload to pick up the fresh build.
window.addEventListener("vite:preloadError", () => {
  const reloadKey = "vite-preload-reload";
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  }
});

createRoot(document.getElementById("frontgate")!).render(
  <StyledEngineProvider injectFirst>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StyledEngineProvider>,
);
