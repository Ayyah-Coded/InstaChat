import "./index.css";
import App from "./App.jsx";
import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";



createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);