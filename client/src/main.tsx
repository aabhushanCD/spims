import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@/lib/i18n";

import { AuthProvider } from "./features/auth/context/authContext.tsx";
import { PreferencesProvider } from "./features/preferences/context/preferencesContext.tsx";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
